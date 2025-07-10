import qrcode
import json
from PIL import Image
import io
import base64

def create_bus_qr_codes():
    """
    Cria QR codes de exemplo para linhas de ônibus
    """
    
    # Exemplos de dados para QR codes
    bus_examples = [
        # Formato 1: Apenas número
        "001",
        
        # Formato 2: JSON
        {
            "linha": "002",
            "empresa": "Express Bus"
        },
        
        # Formato 3: URL
        "http://businfo.com?linha=101",
        
        # Formato 4: Número com letra
        "201A"
    ]
    
    for i, bus_data in enumerate(bus_examples):
        # Converte dados para string se necessário
        if isinstance(bus_data, dict):
            qr_text = json.dumps(bus_data, ensure_ascii=False)
        else:
            qr_text = str(bus_data)
        
        # Cria o QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_text)
        qr.make(fit=True)
        
        # Cria a imagem
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Salva a imagem
        filename = f"qrcode_exemplo_{i+1}.png"
        img.save(filename)
        print(f"QR code criado: {filename}")
        print(f"Dados: {qr_text}")
        print("-" * 40)
        
        # Também cria versão em base64 para testes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        with open(f"qrcode_exemplo_{i+1}_base64.txt", "w") as f:
            f.write(img_base64)

if __name__ == "__main__":
    try:
        create_bus_qr_codes()
        print("\nQR codes criados com sucesso!")
        print("Você pode usar esses arquivos para testar o scanner.")
    except ImportError:
        print("Para gerar QR codes, instale: pip install qrcode[pil]")
    except Exception as e:
        print(f"Erro ao criar QR codes: {e}")
