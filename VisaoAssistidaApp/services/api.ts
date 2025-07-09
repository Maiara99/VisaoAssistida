import { io, Socket } from "socket.io-client";

const API_URL = "http://192.168.0.137:5004";

let socket: Socket | null = null;

// Conecta ao servidor Socket.IO
const connectSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ["polling", "websocket"], // Polling primeiro, depois websocket
      timeout: 10000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Conectado ao servidor Socket.IO");
    });

    socket.on("disconnect", (reason) => {
      console.log("Desconectado do servidor Socket.IO:", reason);
    });

    socket.on("connect_error", (error: any) => {
      console.error("Erro de conexão Socket.IO:", error);
      console.error("Detalhes do erro:", error.message);
      console.error(
        "Verifique se o servidor Python está rodando em localhost:8000"
      );
    });

    socket.on("error", (error: any) => {
      console.error("Erro no Socket.IO:", error);
    });
  }
  return socket;
};

export const identifyImage = async (
  base64: string
): Promise<{ detections: any[] }> => {
  // Primeiro verifica se o servidor está rodando
  const isServerRunning = await checkServerStatus();
  if (!isServerRunning) {
    throw new Error(
      "Servidor não está rodando. Verifique se o backend Python está executando em localhost:8000"
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const socketInstance = connectSocket();

      // Verifica se está conectado
      if (!socketInstance.connected) {
        console.log("Socket não conectado, aguardando conexão...");

        // Aguarda conexão ou falha
        const onConnect = () => {
          console.log("Conectado! Enviando imagem para processamento...");
          socketInstance.off("connect", onConnect);
          socketInstance.off("connect_error", onConnectError);
          sendFrame();
        };

        const onConnectError = (error: any) => {
          console.error("Falha ao conectar:", error);
          socketInstance.off("connect", onConnect);
          socketInstance.off("connect_error", onConnectError);
          reject(
            new Error(
              `Erro de conexão: ${
                error.message || error
              }. Verifique se o servidor Python está rodando.`
            )
          );
        };

        socketInstance.on("connect", onConnect);
        socketInstance.on("connect_error", onConnectError);

        // Timeout para conexão
        setTimeout(() => {
          socketInstance.off("connect", onConnect);
          socketInstance.off("connect_error", onConnectError);
          reject(
            new Error(
              "Timeout na conexão com o servidor. Verifique se o backend está rodando."
            )
          );
        }, 10000);
      } else {
        console.log("Socket já conectado, enviando imagem...");
        sendFrame();
      }

      function sendFrame() {
        // Escuta os resultados da detecção
        const onDetectionResults = (data: { detections: any[] }) => {
          console.log("Resultados recebidos:", data);
          socketInstance.off("detection_results", onDetectionResults);
          resolve(data);
        };

        socketInstance.on("detection_results", onDetectionResults);

        // Envia a imagem para processamento
        socketInstance.emit("process_frame", base64);
        console.log("Imagem enviada para processamento");

        // Timeout para evitar travamento
        setTimeout(() => {
          socketInstance.off("detection_results", onDetectionResults);
          reject(new Error("Timeout na identificação da imagem"));
        }, 30000);
      }
    } catch (error) {
      console.error("Erro ao identificar imagem:", error);
      reject(new Error(`Erro na identificação: ${error}`));
    }
  });
};

// Verifica se o servidor está rodando
export const checkServerStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      timeout: 5000,
    } as any);
    return response.ok;
  } catch (error) {
    console.error("Servidor não está rodando:", error);
    return false;
  }
};

// Função para testar conectividade
export const testConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const socketInstance = connectSocket();

      if (socketInstance.connected) {
        resolve(true);
        return;
      }

      const onConnect = () => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        resolve(true);
      };

      const onConnectError = () => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        resolve(false);
      };

      socketInstance.on("connect", onConnect);
      socketInstance.on("connect_error", onConnectError);

      setTimeout(() => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        resolve(false);
      }, 5000);
    } catch (error) {
      resolve(false);
    }
  });
};

// Função para desconectar quando necessário
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

let isStreaming = false;
let streamingCallback: ((data: { detections: any[] }) => void) | null = null;

// Inicia streaming de detecção em tempo real
export const startRealtimeDetection = async (
  onDetection: (data: { detections: any[] }) => void
): Promise<void> => {
  if (isStreaming) {
    console.log("Streaming já está ativo");
    return;
  }

  // Primeiro verifica se o servidor está rodando
  const isServerRunning = await checkServerStatus();
  if (!isServerRunning) {
    throw new Error(
      "Servidor não está rodando. Verifique se o backend Python está executando"
    );
  }

  return new Promise((resolve, reject) => {
    const socketInstance = connectSocket();

    if (!socketInstance.connected) {
      console.log("Aguardando conexão para iniciar streaming...");

      const onConnect = () => {
        console.log("Conectado! Iniciando streaming em tempo real...");
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        startStreamingListener(socketInstance, onDetection);
        resolve();
      };

      const onConnectError = (error: any) => {
        console.error("Falha ao conectar para streaming:", error);
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        reject(
          new Error(
            `Erro de conexão para streaming: ${
              error.message || error
            }. Verifique se o servidor Python está rodando.`
          )
        );
      };

      socketInstance.on("connect", onConnect);
      socketInstance.on("connect_error", onConnectError);

      // Timeout para conexão
      setTimeout(() => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        reject(
          new Error(
            "Timeout na conexão para streaming. Verifique se o backend está rodando."
          )
        );
      }, 10000);
    } else {
      console.log("Socket já conectado, iniciando streaming...");
      startStreamingListener(socketInstance, onDetection);
      resolve();
    }
  });
};

// Configura o listener para streaming
const startStreamingListener = (
  socketInstance: Socket,
  onDetection: (data: { detections: any[] }) => void
) => {
  isStreaming = true;
  streamingCallback = onDetection;

  // Remove listeners antigos se existirem
  socketInstance.off("detection_results");

  // Escuta os resultados de detecção em tempo real
  socketInstance.on("detection_results", (data: { detections: any[] }) => {
    console.log("🎯 Resultado de detecção recebido:", data);

    if (isStreaming && streamingCallback) {
      streamingCallback(data);
    } else {
      console.warn("⚠️ Streaming inativo ou callback ausente");
    }
  });

  // Adiciona listener para erros
  socketInstance.on("detection_error", (error: any) => {
    console.error("❌ Erro de detecção recebido:", error);
  });

  // Adiciona listener para desconexão
  socketInstance.on("disconnect", (reason: string) => {
    console.warn("🔌 Socket desconectado durante streaming:", reason);
  });

  console.log(
    "✅ Streaming de detecção iniciado - Socket ID:",
    socketInstance.id
  );
};

// Para o streaming de detecção
export const stopRealtimeDetection = (): void => {
  if (!isStreaming) {
    return;
  }

  isStreaming = false;
  streamingCallback = null;

  if (socket) {
    socket.off("detection_results");
    console.log("Streaming de detecção parado");
  }
};

// Envia um frame para processamento durante o streaming
export const sendFrameForDetection = async (base64: string): Promise<void> => {
  if (!isStreaming) {
    console.warn("Streaming não está ativo, não é possível enviar frame");
    return;
  }

  const socketInstance = connectSocket();

  if (!socketInstance.connected) {
    console.warn("Socket não está conectado, tentando reconectar...");
    // Tenta reconectar uma vez
    return new Promise((resolve, reject) => {
      const onConnect = () => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        socketInstance.emit("process_frame", base64);
        console.log("Frame enviado após reconexão");
        resolve();
      };

      const onConnectError = (error: any) => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        console.error("Falha ao reconectar para enviar frame:", error);
        reject(error);
      };

      socketInstance.on("connect", onConnect);
      socketInstance.on("connect_error", onConnectError);

      // Timeout para reconexão
      setTimeout(() => {
        socketInstance.off("connect", onConnect);
        socketInstance.off("connect_error", onConnectError);
        reject(new Error("Timeout na reconexão"));
      }, 5000);
    });
  } else {
    // Socket conectado, envia o frame
    socketInstance.emit("process_frame", base64);
    console.log("Frame enviado para processamento (streaming)");
  }
};

// Verifica se o streaming está ativo
export const isRealtimeDetectionActive = (): boolean => {
  return isStreaming;
};

// Função para debug - verifica status do streaming
export const getStreamingStatus = () => {
  return {
    isStreaming,
    hasCallback: streamingCallback !== null,
    socketConnected: socket?.connected || false,
    socketId: socket?.id || null,
  };
};
