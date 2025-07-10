// Configurações do aplicativo

export const APP_CONFIG = {
  // Configuração do servidor
  SERVER: {
    // Para desenvolvimento local (emulador)
    LOCAL_URL: 'http://localhost:8000',

    // Para dispositivo real - substitua pelo IP da sua máquina
    NETWORK_URL: 'http://192.168.1.100:8000',

    // Usar configuração baseada no ambiente
    get URL() {
      // Para desenvolvimento, use LOCAL_URL (emulador) ou NETWORK_URL (dispositivo real)
      // Por padrão, usa LOCAL_URL - mude manualmente se necessário
      return this.LOCAL_URL;
    },
  },

  // Configurações da câmera
  CAMERA: {
    QUALITY: 0.8,
    BASE64: true,
  },

  // Configurações de voz
  SPEECH: {
    LANGUAGE: 'pt-BR',
    PITCH: 1.0,
    RATE: 0.8,
  },

  // Configurações de QR Code
  QRCODE: {
    // Timeout para processamento
    TIMEOUT: 10000, // 10 segundos

    // Formatos suportados
    SUPPORTED_FORMATS: [
      'simple', // Apenas número: "001"
      'json', // JSON: {"linha": "001"}
      'url', // URL: "http://exemplo.com?linha=001"
      'text', // Texto livre
    ],
  },
};

// Função para obter URL do servidor baseada no ambiente
export const getServerUrl = () => {
  return APP_CONFIG.SERVER.URL;
};

// Função para validar configuração
export const validateConfig = () => {
  const url = getServerUrl();
  console.log(`Usando servidor: ${url}`);
  return url;
};
