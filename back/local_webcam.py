import cv2
from ultralytics import YOLO

# Carrega o modelo YOLOv8 pré-treinado. 
# 'yolov8n.pt' é o modelo "nano", o mais rápido.
# Para maior precisão (e menor velocidade), você pode usar 'yolov8s.pt' ou 'yolov8m.pt'.
model = YOLO('yolov8n.pt')

# O modelo foi treinado no dataset COCO, que possui 80 classes de objetos.
# Vamos pegar os nomes dessas classes para podermos filtrar o que nos interessa.
class_names = model.names

# Estes são os IDs das classes que você quer detectar no dataset COCO:
# 0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck', 6: 'train', 
# 9: 'traffic light', 10: 'fire hydrant', 11: 'stop sign', 13: 'bench', 15: 'cat', 16: 'dog'
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

# Inicia a captura de vídeo pela webcam (0 é geralmente a câmera padrão).
cap = cv2.VideoCapture(0)

# Verifica se a câmera foi aberta corretamente.
if not cap.isOpened():
    print("Erro: Não foi possível abrir a câmera.")
    exit()

# Loop principal para processar cada quadro do vídeo.
while True:
    # Lê um quadro da câmera.
    success, frame = cap.read()
    if not success:
        print("Erro: Não foi possível ler o quadro da câmera.")
        break

    # Usa o modelo YOLO para detectar objetos no quadro.
    results = model(frame, stream=True)

    # Itera sobre cada objeto detectado no quadro.
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # Pega o ID da classe do objeto (ex: 2 para 'car').
            cls_id = int(box.cls[0])

            # Verifica se a classe detectada é uma das que nos interessa.
            if cls_id in classes_de_interesse:
                # Obtém as coordenadas da caixa que delimita o objeto.
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Obtém o nome da classe e a confiança da detecção.
                label = class_names[cls_id]
                confidence = float(box.conf[0])
                
                # Para o backend, o mais importante é a informação textual.
                # Esta lógica é onde você irá futuramente adicionar o alerta sonoro.
                if confidence > 0.5: # Apenas considera detecções com mais de 50% de confiança.
                    print(f"Objeto detectado: {label} com confiança de {confidence:.2f}")

                # Desenha a caixa e o rótulo no quadro (para visualização e depuração).
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f'{label} {confidence:.2f}', (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    # Mostra o quadro processado em uma janela.
    cv2.imshow("Detecção de Objetos - Pressione 'q' para sair", frame)

    # Encerra o loop se a tecla 'q' for pressionada.
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Libera a câmera e fecha todas as janelas.
cap.release()
cv2.destroyAllWindows()