// Arquivo de teste para debug do streaming
// Execute no console do navegador ou adicione temporariamente ao componente

import {
  checkServerStatus,
  connectSocket,
  getStreamingStatus,
  testConnection,
} from "./services/api";

// Função para testar a conectividade completa
export const debugStreaming = async () => {
  console.log("=== DEBUG STREAMING ===");

  // 1. Verificar status do servidor
  console.log("1. Verificando servidor...");
  const serverStatus = await checkServerStatus();
  console.log("Servidor ativo:", serverStatus);

  if (!serverStatus) {
    console.error("❌ Servidor não está rodando!");
    return;
  }

  // 2. Testar conexão Socket.IO
  console.log("2. Testando conexão Socket.IO...");
  const connectionTest = await testConnection();
  console.log("Conexão Socket.IO:", connectionTest);

  if (!connectionTest) {
    console.error("❌ Falha na conexão Socket.IO!");
    return;
  }

  // 3. Verificar status do streaming
  console.log("3. Status do streaming:");
  const streamingStatus = getStreamingStatus();
  console.log("Status completo:", streamingStatus);

  // 4. Teste manual de envio de dados
  console.log("4. Testando envio manual...");
  const socket = connectSocket();

  socket.on("connect", () => {
    console.log("✅ Socket conectado para teste");

    // Escutar resultados
    socket.on("detection_results", (data) => {
      console.log("✅ Resultado recebido:", data);
    });

    // Enviar dados de teste
    const testData =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="; // Imagem de 1x1 pixel

    socket.emit("process_frame", testData);
    console.log("📤 Dados de teste enviados");

    // Timeout para teste
    setTimeout(() => {
      console.log("⏰ Teste finalizado");
      socket.disconnect();
    }, 5000);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Erro na conexão de teste:", error);
  });
};

// Função para monitorar continuamente o status
export const monitorStreaming = () => {
  console.log("=== MONITOR STREAMING INICIADO ===");

  const interval = setInterval(() => {
    const status = getStreamingStatus();
    console.log(`[${new Date().toLocaleTimeString()}] Status:`, status);
  }, 2000);

  // Para o monitor após 30 segundos
  setTimeout(() => {
    clearInterval(interval);
    console.log("=== MONITOR STREAMING FINALIZADO ===");
  }, 30000);

  return interval;
};

export default { debugStreaming, monitorStreaming };
