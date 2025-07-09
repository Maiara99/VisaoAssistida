import base64
import cv2
import numpy as np
import socketio
import uvicorn
import time
import hashlib
import logging
from fastapi import FastAPI
from ultralytics import YOLO
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

# --- CONFIGURAÇÃO INICIAL ---
# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carrega o modelo YOLO
model = YOLO('yolov8n.pt')
class_names = model.names
classes_de_interesse = {
    # Categorias de Veículos
    1, 2, 3, 4, 5, 6, 7, 8,
    # Categorias de Exterior
    9, 10, 11, 12, 13,
    # Categorias de Animais
    14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    # Categorias de Acessórios
    24, 25, 26, 27, 28,
    # Categorias de Esportes
    29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
    # Categorias de Cozinha e Comida
    39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
    # Categorias de Mobília
    56, 57, 58, 59, 60, 61, 62,
    # Categorias de Eletrônicos
    63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
    # Categorias de Objetos Internos
    0, 73, 74, 75, 76, 77, 78, 79
}

# Rate limiting e cache
client_last_request = defaultdict(float)
MIN_REQUEST_INTERVAL = 1.0  # 1 segundo mínimo entre requests
result_cache = {}
CACHE_SIZE = 100

# Pool de threads para processamento CPU-intensivo
executor = ThreadPoolExecutor(max_workers=4)

# Cria a aplicação FastAPI
app = FastAPI()

# Cria o servidor Socket.IO e o anexa ao FastAPI
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*', max_http_buffer_size=10000000)
socket_app = socketio.ASGIApp(sio)

# --- ENDPOINTS REST ---

# Endpoint de health check para verificar se o servidor está rodando
@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "message": "Servidor está rodando",
        "timestamp": time.time(),
        "model_loaded": model is not None,
        "cache_size": len(result_cache)
    }

# Endpoint para configurar parâmetros de tempo real
@app.get("/config")
async def get_config():
    return {
        "min_request_interval": MIN_REQUEST_INTERVAL,
        "cache_size": CACHE_SIZE,
        "max_workers": executor._max_workers,
        "current_cache_entries": len(result_cache)
    }

# Endpoint para limpar cache manualmente
@app.post("/clear-cache")
async def clear_cache():
    global result_cache
    result_cache.clear()
    logger.info("Cache limpo manualmente")
    return {"status": "ok", "message": "Cache limpo com sucesso"}

# Monta o Socket.IO depois dos endpoints REST
app.mount("/", socket_app)

# --- FUNÇÕES AUXILIARES ---

def get_image_hash(base64_data):
    """Gera hash para cache de imagens"""
    # Usa apenas os primeiros 1000 caracteres para performance
    return hashlib.md5(base64_data[:1000].encode()).hexdigest()

def preprocess_image_for_realtime(frame):
    """Otimiza imagem para processamento em tempo real"""
    height, width = frame.shape[:2]
    max_size = 640  # Reduzir para processamento mais rápido
    
    if max(height, width) > max_size:
        if height > width:
            new_height = max_size
            new_width = int(width * (max_size / height))
        else:
            new_width = max_size
            new_height = int(height * (max_size / width))
        
        frame = cv2.resize(frame, (new_width, new_height))
    
    return frame

def process_yolo_detection(frame):
    """Processa detecção YOLO de forma otimizada"""
    results = model(frame)
    detections = []
    
    for r in results:
        boxes = r.boxes
        if boxes is not None:
            for box in boxes:
                cls_id = int(box.cls[0])
                if cls_id in classes_de_interesse:
                    confidence = float(box.conf[0])
                    if confidence > 0.5:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        label = class_names[cls_id]
                        
                        detections.append({
                            'label': label,
                            'confidence': confidence,
                            'box': [x1, y1, x2, y2]
                        })
    
    return detections

def manage_cache(image_hash, results):
    """Gerencia cache com limite de tamanho"""
    # Manter cache limitado
    if len(result_cache) >= CACHE_SIZE:
        # Remove o item mais antigo
        oldest_key = next(iter(result_cache))
        del result_cache[oldest_key]
    
    result_cache[image_hash] = results

# --- LÓGICA DO WEBSOCKET ---

# Evento de conexão: é acionado quando um cliente (o app) se conecta.
@sio.event
async def connect(sid, environ):
    print(f"Cliente conectado: {sid}")

# Evento de desconexão
@sio.event
async def disconnect(sid):
    print(f"Cliente desconectado: {sid}")

# Evento principal: recebe o quadro do cliente
@sio.event
async def process_frame(sid, data):
    # O cliente envia a imagem como uma string Base64.
    # Precisamos decodificá-la para que o OpenCV possa usá-la.
    try:
        current_time = time.time()
        
        # Verificar rate limiting
        if current_time - client_last_request[sid] < MIN_REQUEST_INTERVAL:
            logger.info(f"Rate limiting aplicado para cliente {sid}")
            return
        
        client_last_request[sid] = current_time
        
        # Gerar hash para cache
        image_hash = get_image_hash(data)
        
        # Verificar cache
        if image_hash in result_cache:
            logger.info(f"Cache hit para cliente {sid}")
            await sio.emit('detection_results', result_cache[image_hash], to=sid)
            return
        
        start_time = time.time()
        logger.info(f"Processando frame para cliente {sid}")
        
        # Extrai os dados da imagem da string base64
        # Verifica se há header (data:image/jpeg;base64,) ou se é apenas base64
        if "," in data:
            header, encoded = data.split(",", 1)
            logger.debug(f"Header encontrado: {header[:50]}...")
        else:
            # Se não há vírgula, assume que é apenas a string base64
            encoded = data
            logger.debug("Sem header, usando dados direto como base64")
        
        img_bytes = base64.b64decode(encoded)
        
        # Converte os bytes em um array numpy
        nparr = np.frombuffer(img_bytes, np.uint8)
        
        # Decodifica o array numpy em uma imagem OpenCV
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Verifica se a imagem foi decodificada corretamente
        if frame is None:
            logger.error("Erro: Não foi possível decodificar a imagem")
            await sio.emit('detection_error', {'error': 'Não foi possível decodificar a imagem'}, to=sid)
            return

        # Otimizar imagem para tempo real
        frame = preprocess_image_for_realtime(frame)
        
        # Executar detecção YOLO
        detections = process_yolo_detection(frame)
        
        processing_time = time.time() - start_time
        logger.info(f"Frame processado em {processing_time:.2f}s para cliente {sid}")
        
        # Avisar se processamento está lento
        if processing_time > 2.0:
            logger.warning(f"Processamento lento detectado: {processing_time:.2f}s")
        
        results = {
            'detections': detections,
            'processing_time': processing_time,
            'timestamp': current_time
        }
        
        # Adicionar ao cache
        manage_cache(image_hash, results)
        
        # Envia os resultados de volta para o cliente através do WebSocket
        await sio.emit('detection_results', results, to=sid)
        logger.info(f"Resultados enviados para cliente {sid}: {len(detections)} detecções")
    
    except Exception as e:
        logger.error(f"Erro ao processar o quadro: {e}")
        await sio.emit('detection_error', {'error': str(e)}, to=sid)

# --- INICIALIZAÇÃO DO SERVIDOR ---
if __name__ == "__main__":
    print("Iniciando servidor Socket.IO...")
    print("Servidor rodando em: http://localhost:5004")
    print("Para parar o servidor, pressione Ctrl+C")
    uvicorn.run(app, host="0.0.0.0", port=5004)