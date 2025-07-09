import React, { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  checkServerStatus,
  getStreamingStatus,
  testConnection,
} from "../services/api";

interface DebugInfo {
  isStreaming?: boolean;
  hasCallback?: boolean;
  socketConnected?: boolean;
  socketId?: string | null;
}

export default function StreamingDebugComponent() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-10), `[${timestamp}] ${message}`]);
  };

  const runDiagnostics = async () => {
    addLog("🔍 Iniciando diagnósticos...");

    try {
      // 1. Verificar servidor
      addLog("Verificando servidor...");
      const serverStatus = await checkServerStatus();
      addLog(`Servidor: ${serverStatus ? "✅ Ativo" : "❌ Inativo"}`);

      // 2. Testar conexão
      addLog("Testando conexão Socket.IO...");
      const connectionTest = await testConnection();
      addLog(`Socket.IO: ${connectionTest ? "✅ Conectado" : "❌ Falha"}`);

      // 3. Status do streaming
      const streamingStatus = getStreamingStatus();
      addLog(`Streaming ativo: ${streamingStatus.isStreaming ? "✅" : "❌"}`);
      addLog(
        `Socket conectado: ${streamingStatus.socketConnected ? "✅" : "❌"}`
      );

      setDebugInfo(streamingStatus);
    } catch (error) {
      addLog(
        `❌ Erro: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    // Atualiza status a cada 3 segundos
    const interval = setInterval(() => {
      const status = getStreamingStatus();
      setDebugInfo(status);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Streaming</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {debugInfo.isStreaming ? "🟢 Ativo" : "🔴 Inativo"}
        </Text>
        <Text style={styles.statusText}>
          Socket:{" "}
          {debugInfo.socketConnected ? "🟢 Conectado" : "🔴 Desconectado"}
        </Text>
        <Text style={styles.statusText}>
          Callback: {debugInfo.hasCallback ? "🟢 OK" : "🔴 Ausente"}
        </Text>
        {debugInfo.socketId && (
          <Text style={styles.statusText}>ID: {debugInfo.socketId}</Text>
        )}
      </View>

      <View style={styles.buttonsContainer}>
        <Button title="Executar Diagnósticos" onPress={runDiagnostics} />
        <Button title="Limpar Logs" onPress={clearLogs} />
      </View>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  statusContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: "monospace",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  logsContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    maxHeight: 200,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 2,
    color: "#333",
  },
});
