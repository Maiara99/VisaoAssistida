import base64
import cv2
import numpy as np
import socketio
import uvicorn
from fastapi import FastAPI
from ultralytics import YOLO

# --- CONFIGURAÇÃO INICIAL ---
# Carrega o modelo YOLO
model = YOLO('yolov8n.pt')
class_names = model.names
classes_de_interesse = {1, 2, 3, 5, 7, 9, 11, 13, 15, 41, 0}

# Cria a aplicação FastAPI
app = FastAPI()

# Cria o servidor Socket.IO e o anexa ao FastAPI
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*', max_http_buffer_size=10000000)
socket_app = socketio.ASGIApp(sio)
app.mount("/", socket_app)

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
        # Extrai os dados da imagem da string base64
        header, encoded = data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        
        # Converte os bytes em um array numpy
        nparr = np.frombuffer(img_bytes, np.uint8)
        
        # Decodifica o array numpy em uma imagem OpenCV
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # --- EXECUTA A DETECÇÃO (seu código existente) ---
        results = model(frame)
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                if cls_id in classes_de_interesse:
                    confidence = float(box.conf[0])
                    if confidence > 0.5:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        label = class_names[cls_id]
                        
                        # Adiciona a detecção à nossa lista de resultados
                        detections.append({
                            'label': label,
                            'confidence': confidence,
                            'box': [x1, y1, x2, y2]
                        })

        # Envia os resultados de volta para o cliente através do WebSocket
        # O cliente estará ouvindo por um evento chamado 'detection_results'
        await sio.emit('detection_results', {'detections': detections}, to=sid)
    
    except Exception as e:
        print(f"Erro ao processar o quadro: {e}")

# Para rodar, use o comando no terminal: uvicorn main:app --host 0.0.0.0 --port 8000