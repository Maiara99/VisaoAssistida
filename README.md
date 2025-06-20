# VisaoAssistida

Para rodar, instale tudo que for necessário.
Altere o IP no código do front para o IP do seu computador. Onde está 192.168.0.38, coloque o seu.
Utilizei meu telefone para rodar a aplicação.
Para executar, rode em 3 terminais diferentes (Altere o caminho para o caminho da sua maquina):

Terminal 1:
BACKEND
cd C:\dev\TrabalhoFinal\back
.\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000

Terminal 2:
FRONT
cd C:\dev\TrabalhoFinal\VisaoAssistidaApp
npx react-native start

Terminal 3:
BUILD
cd C:\dev\TrabalhoFinal\VisaoAssistidaApp
npx react-native run-android
