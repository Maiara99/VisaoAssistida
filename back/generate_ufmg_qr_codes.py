import qrcode
import json
from PIL import Image
import io
import base64

def create_ufmg_bus_qr_codes():
    """
    Cria QR codes para as linhas de ônibus da UFMG
    """
    
    # Dados das linhas de ônibus da UFMG
    ufmg_lines = [
        "1",  # Linha 1 - Antônio Carlos - Fafich
        "2",  # Linha 2 - Antônio Carlos - FACE
        "3",  # Linha 3 - Carlos Luz - Fafich
        "4",  # Linha 4 - BH Tec
    ]
    
    print("Gerando QR codes das linhas de ônibus da UFMG...\n")
    
    for line_number in ufmg_lines:
        # Cria o QR code com apenas o número da linha
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(line_number)
        qr.make(fit=True)
        
        # Cria a imagem
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Salva a imagem
        filename = f"ufmg_linha_{line_number}.png"
        img.save(filename)
        
        # Também cria versão em base64 para testes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        with open(f"ufmg_linha_{line_number}_base64.txt", "w") as f:
            f.write(img_base64)
        
        print(f"✓ QR code criado: {filename}")
        print(f"  Dados: '{line_number}'")
        print(f"  Base64 salvo em: ufmg_linha_{line_number}_base64.txt")
        print("-" * 50)

def create_json_format_qr_codes():
    """
    Cria QR codes no formato JSON para as linhas da UFMG
    """
    
    # Dados das linhas em formato JSON
    ufmg_lines_json = [
        {"linha": "1", "universidade": "UFMG"},
        {"linha": "2", "universidade": "UFMG"},
        {"linha": "3", "universidade": "UFMG"},
        {"linha": "4", "universidade": "UFMG"},
    ]
    
    print("\nGerando QR codes no formato JSON...\n")
    
    for i, line_data in enumerate(ufmg_lines_json, 1):
        # Converte para JSON
        qr_text = json.dumps(line_data, ensure_ascii=False)
        
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
        filename = f"ufmg_linha_{i}_json.png"
        img.save(filename)
        
        # Também cria versão em base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        with open(f"ufmg_linha_{i}_json_base64.txt", "w") as f:
            f.write(img_base64)
        
        print(f"✓ QR code JSON criado: {filename}")
        print(f"  Dados: {qr_text}")
        print(f"  Base64 salvo em: ufmg_linha_{i}_json_base64.txt")
        print("-" * 50)

if __name__ == "__main__":
    try:
        create_ufmg_bus_qr_codes()
        create_json_format_qr_codes()
        
        print("\n🎉 Todos os QR codes da UFMG foram criados com sucesso!")
        print("\nArquivos gerados:")
        print("📁 Imagens PNG: ufmg_linha_*.png")
        print("📄 Base64: ufmg_linha_*_base64.txt")
        print("\nVocê pode usar esses QR codes para testar o scanner no app!")
        
    except ImportError:
        print("❌ Para gerar QR codes, instale: pip install qrcode[pil]")
    except Exception as e:
        print(f"❌ Erro ao criar QR codes: {e}")
