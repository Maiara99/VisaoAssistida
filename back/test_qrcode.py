import requests
import base64
import json

# Teste do endpoint de QR code
def test_qrcode_endpoint():
    # URL do servidor
    server_url = "http://localhost:8000"
    
    # Criar uma imagem de teste simples (1x1 pixel em base64)
    # Em um teste real, você usaria uma imagem com QR code
    test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jININwAAAABJRU5ErkJggg=="
    
    try:
        # Teste 1: Health check
        print("Testando health check...")
        response = requests.get(f"{server_url}/health")
        if response.status_code == 200:
            print("✓ Health check OK")
            print(f"Resposta: {response.json()}")
        else:
            print(f"✗ Health check falhou: {response.status_code}")
        
        print("\n" + "="*50 + "\n")
        
        # Teste 2: Endpoint de QR code
        print("Testando endpoint de QR code...")
        payload = {
            "image": test_image_base64
        }
        
        response = requests.post(
            f"{server_url}/process-qrcode",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✓ Endpoint de QR code respondeu")
            result = response.json()
            print(f"Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")
        else:
            print(f"✗ Endpoint de QR code falhou: {response.status_code}")
            print(f"Erro: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Não foi possível conectar ao servidor")
        print("Certifique-se de que o servidor está rodando em http://localhost:8000")
    except Exception as e:
        print(f"✗ Erro inesperado: {e}")

if __name__ == "__main__":
    test_qrcode_endpoint()
