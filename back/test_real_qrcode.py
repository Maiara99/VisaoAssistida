import requests
import base64
import json

def test_with_real_qrcode():
    """
    Testa o endpoint com QR codes reais gerados
    """
    server_url = "http://localhost:8000"
    
    try:
        # Lê o QR code base64 gerado
        with open("qrcode_exemplo_1_base64.txt", "r") as f:
            qr_base64 = f.read().strip()
        
        print("Testando processamento de QR code real...")
        print("QR code contém: '001'")
        
        payload = {
            "image": qr_base64
        }
        
        response = requests.post(
            f"{server_url}/process-qrcode",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✓ QR code processado com sucesso!")
            result = response.json()
            print(f"Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")
        else:
            print(f"✗ Erro no processamento: {response.status_code}")
            print(f"Erro: {response.text}")
            
    except FileNotFoundError:
        print("✗ Arquivo de QR code não encontrado. Execute generate_qr_examples.py primeiro.")
    except Exception as e:
        print(f"✗ Erro: {e}")

if __name__ == "__main__":
    test_with_real_qrcode()
