import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  identifyImage,
  sendFrameForDetection,
  startRealtimeDetection,
  stopRealtimeDetection,
} from "../services/api";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const [lastSpokenResult, setLastSpokenResult] = useState("");
  const intervalRef = useRef<number | null>(null);
  const isStreamingRef = useRef<boolean>(false); // Ref para controle imediato do streaming
  const lastDetectedObjectsRef = useRef<string[]>([]); // Para comparação mais inteligente
  const lastAnnouncementTimeRef = useRef<number>(0); // Para controlar frequência de anúncios

  const [permission, requestPermission] = useCameraPermissions();

  // Função para comparar arrays de objetos detectados de forma inteligente
  const hasSignificantChange = useCallback(
    (newObjects: string[], oldObjects: string[]) => {
      console.log("🔍 Análise de mudança:");
      console.log("  - Objetos antigos:", oldObjects);
      console.log("  - Objetos novos:", newObjects);

      // Se ambos estão vazios, não há mudança
      if (oldObjects.length === 0 && newObjects.length === 0) {
        console.log("  - Ambos vazios, sem mudança");
        return false;
      }

      // Se não há objetos antigos e agora há objetos, é uma mudança significativa
      if (oldObjects.length === 0 && newObjects.length > 0) {
        console.log("  - Primeira detecção, mudança significativa");
        return true;
      }

      // Se não há novos objetos mas havia antes, é uma mudança
      if (newObjects.length === 0 && oldObjects.length > 0) {
        console.log("  - Objetos desapareceram, mudança significativa");
        return true;
      }

      // Comparação exata: arrays devem ser diferentes
      const arraysAreEqual =
        newObjects.length === oldObjects.length &&
        newObjects.every((obj, index) => obj === oldObjects[index]);

      if (arraysAreEqual) {
        console.log("  - Arrays idênticos, sem mudança");
        return false;
      }

      // Verificar se há objetos completamente novos ou removidos
      const newUniqueObjects = newObjects.filter(
        (obj) => !oldObjects.includes(obj)
      );
      const removedObjects = oldObjects.filter(
        (obj) => !newObjects.includes(obj)
      );

      console.log("  - Objetos novos:", newUniqueObjects);
      console.log("  - Objetos removidos:", removedObjects);

      // Só considera significativo se há pelo menos 1 objeto novo ou removido
      const hasChange =
        newUniqueObjects.length > 0 || removedObjects.length > 0;

      console.log(
        "  - Resultado:",
        hasChange ? "MUDANÇA SIGNIFICATIVA" : "SEM MUDANÇA"
      );
      return hasChange;
    },
    []
  );

  // Tradução simples de labels comuns
  const labelTranslations: Record<string, string> = {
    // Categorias de Veículos
    car: "carro",
    motorcycle: "moto",
    bus: "ônibus",
    truck: "caminhão",
    bicycle: "bicicleta",
    airplane: "avião",
    train: "trem",
    boat: "barco",

    // Categorias de Exterior
    "traffic light": "semáforo",
    "fire hydrant": "hidrante",
    "stop sign": "placa de pare",
    "parking meter": "parquímetro",
    bench: "banco",

    // Categorias de Animais
    bird: "pássaro",
    cat: "gato",
    dog: "cachorro",
    horse: "cavalo",
    sheep: "ovelha",
    cow: "vaca",
    elephant: "elefante",
    bear: "urso",
    zebra: "zebra",
    giraffe: "girafa",

    // Categorias de Acessórios
    backpack: "mochila",
    umbrella: "guarda-chuva",
    handbag: "bolsa",
    tie: "gravata",
    suitcase: "mala",

    // Categorias de Esportes
    frisbee: "frisbee",
    skis: "esquis",
    snowboard: "snowboard",
    "sports ball": "bola de esporte",
    kite: "pipa",
    "baseball bat": "taco de beisebol",
    "baseball glove": "luva de beisebol",
    skateboard: "skate",
    surfboard: "prancha de surfe",
    "tennis racket": "raquete de tênis",

    // Categorias de Cozinha e Comida
    bottle: "garrafa",
    "wine glass": "taça de vinho",
    cup: "copo",
    fork: "garfo",
    knife: "faca",
    spoon: "colher",
    bowl: "tigela",
    banana: "banana",
    apple: "maçã",
    sandwich: "sanduíche",
    orange: "laranja",
    broccoli: "brócolis",
    carrot: "cenoura",
    "hot dog": "cachorro-quente",
    pizza: "pizza",
    donut: "rosquinha",
    cake: "bolo",

    // Categorias de Mobília
    chair: "cadeira",
    couch: "sofá",
    "potted plant": "planta em vaso",
    bed: "cama",
    "dining table": "mesa de jantar",
    toilet: "vaso sanitário",
    tv: "televisão",

    // Categorias de Eletrônicos
    laptop: "laptop",
    mouse: "mouse",
    remote: "controle remoto",
    keyboard: "teclado",
    "cell phone": "celular",
    microwave: "micro-ondas",
    oven: "forno",
    toaster: "torradeira",
    sink: "pia",
    refrigerator: "geladeira",

    // Categorias de Objetos Internos
    person: "pessoa",
    book: "livro",
    clock: "relógio",
    vase: "vaso",
    scissors: "tesoura",
    "teddy bear": "urso de pelúcia",
    "hair drier": "secador de cabelo",
    toothbrush: "escova de dentes",
  };

  // Função para processar resultados de detecção
  const processDetectionResults = useCallback(
    (detections: any[]) => {
      let description = "Nenhum objeto identificado.";
      let currentObjects: string[] = [];

      if (detections && detections.length > 0) {
        // Traduzir e mapear objetos
        currentObjects = detections
          .map((det: any) => labelTranslations[det.label] || det.label)
          .sort(); // Ordenar para comparação consistente

        description = currentObjects.join(", ");
      }

      setResult(description);

      // No modo tempo real, usar comparação inteligente
      if (isRealtimeMode) {
        console.log("🔍 Comparando detecções:");
        console.log("  - Objetos anteriores:", lastDetectedObjectsRef.current);
        console.log("  - Objetos atuais:", currentObjects);

        // Verificar se houve mudança significativa
        const hasChanged = hasSignificantChange(
          currentObjects,
          lastDetectedObjectsRef.current
        );

        // Verificar timeout (mínimo 5 segundos entre anúncios)
        const now = Date.now();
        const timeSinceLastAnnouncement = now - lastAnnouncementTimeRef.current;
        const minInterval = 5000; // 5 segundos

        console.log("  - Mudança significativa:", hasChanged);
        console.log(
          "  - Tempo desde último anúncio:",
          timeSinceLastAnnouncement,
          "ms"
        );
        console.log("  - Intervalo mínimo:", minInterval, "ms");

        if (
          hasChanged &&
          description !== "Nenhum objeto identificado." &&
          description.trim() !== "" &&
          timeSinceLastAnnouncement >= minInterval
        ) {
          console.log("🗣️ Anunciando nova detecção:", description);
          Speech.speak(description);
          setLastSpokenResult(description);
          lastDetectedObjectsRef.current = currentObjects; // Atualizar referência
          lastAnnouncementTimeRef.current = now; // Atualizar timestamp
        } else {
          console.log("🔇 Não anunciando:", {
            hasChanged,
            notEmpty: description !== "Nenhum objeto identificado.",
            timeoutOk: timeSinceLastAnnouncement >= minInterval,
          });
        }
      } else {
        // No modo foto única, sempre fala
        Speech.speak(description);
        lastDetectedObjectsRef.current = currentObjects; // Atualizar mesmo no modo foto
      }
    },
    [isRealtimeMode, hasSignificantChange, labelTranslations]
  );

  // Função para capturar frame durante streaming (sem useCallback para evitar closure stale)
  const captureFrameForStreaming = async () => {
    console.log("=== DEBUG CAPTURA ===");
    console.log("cameraRef.current:", !!cameraRef.current);
    console.log("isRealtimeMode (estado):", isRealtimeMode);
    console.log("isStreamingRef.current (ref):", isStreamingRef.current);
    console.log("intervalRef.current:", !!intervalRef.current);

    if (!cameraRef.current) {
      console.log("❌ Captura cancelada: câmera não disponível");
      return;
    }

    // Usar o ref para controle imediato ao invés do estado
    if (!isStreamingRef.current) {
      console.log("❌ Captura cancelada: streaming inativo (ref)");
      return;
    }

    try {
      console.log("📸 Capturando frame para streaming...");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Qualidade menor para melhor performance
        base64: true,
        skipProcessing: true, // Pula processamento desnecessário
      });

      if (photo && photo.base64) {
        console.log("✅ Frame capturado, enviando para processamento...");
        console.log("📏 Tamanho do base64:", photo.base64.length);
        await sendFrameForDetection(photo.base64);
        console.log("🚀 Frame enviado com sucesso");
      } else {
        console.warn("⚠️ Falha ao capturar frame: dados inválidos");
      }
    } catch (error) {
      console.error("❌ Erro ao capturar frame:", error);
      // Não para o streaming por um erro único, mas loga para debug
    }
  };

  // Função para alternar modo tempo real
  const toggleRealtimeMode = useCallback(async () => {
    console.log("=== TOGGLE REALTIME MODE ===");
    console.log("Estado atual isRealtimeMode:", isRealtimeMode);
    console.log("Estado atual isStreamingRef:", isStreamingRef.current);

    if (isRealtimeMode) {
      console.log("🛑 Desativando modo tempo real...");
      // Parar streaming
      isStreamingRef.current = false; // Parar imediatamente via ref
      stopRealtimeDetection();
      if (intervalRef.current) {
        console.log("⏹️ Parando interval:", intervalRef.current);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRealtimeMode(false);
      setResult("");
      setLastSpokenResult("");
      lastDetectedObjectsRef.current = []; // Limpar histórico de objetos
      lastAnnouncementTimeRef.current = 0; // Resetar timestamp
      Speech.speak("Modo tempo real desativado");
      console.log("✅ Modo tempo real desativado");
    } else {
      try {
        console.log("🚀 Ativando modo tempo real...");
        // Iniciar streaming
        isStreamingRef.current = true; // Ativar imediatamente via ref
        setIsRealtimeMode(true);
        console.log("✅ Estado isRealtimeMode atualizado para true");
        console.log("✅ isStreamingRef atualizado para true");

        Speech.speak("Modo tempo real ativado. Conectando ao servidor...");

        // Iniciar streaming de detecção (agora é assíncrono)
        console.log("🔌 Iniciando streaming de detecção...");
        await startRealtimeDetection((data) => {
          console.log("📥 Dados recebidos no streaming:", data);
          processDetectionResults(data.detections);
        });

        Speech.speak("Conectado! Direcionando a câmera para objetos");
        console.log("✅ Streaming de detecção iniciado");

        // Capturar frames a cada 2 segundos
        console.log("⏱️ Configurando interval para captura...");
        intervalRef.current = setInterval(() => {
          console.log("⏰ Executando captura via interval...");
          captureFrameForStreaming();
        }, 2000);
        console.log("✅ Interval configurado:", intervalRef.current);

        // Capturar o primeiro frame imediatamente
        console.log("🎬 Agendando primeira captura...");
        setTimeout(() => {
          console.log("🎬 Executando primeira captura...");
          captureFrameForStreaming();
        }, 500);
      } catch (error) {
        console.error("❌ Erro ao iniciar streaming:", error);
        isStreamingRef.current = false; // Reverter ref em caso de erro
        setIsRealtimeMode(false);
        lastDetectedObjectsRef.current = []; // Limpar em caso de erro
        lastAnnouncementTimeRef.current = 0; // Resetar timestamp
        Speech.speak("Erro ao conectar com o servidor. Verifique a conexão.");
      }
    }
  }, [isRealtimeMode, processDetectionResults]);

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      isStreamingRef.current = false; // Parar streaming via ref
      lastDetectedObjectsRef.current = []; // Limpar histórico
      lastAnnouncementTimeRef.current = 0; // Resetar timestamp
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopRealtimeDetection();
    };
  }, []);

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        setResult("");

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo && photo.base64) {
          const response = await identifyImage(photo.base64);
          processDetectionResults(response.detections);
        }
      } catch (error) {
        console.error("Erro ao tirar foto ou identificar imagem:", error);
        const errorMessage = "Erro ao processar a imagem. Tente novamente.";
        setResult(errorMessage);
        Speech.speak(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRequestPermission = async () => {
    const response = await requestPermission();
    if (!response.granted) {
      Speech.speak("Permissão de câmera necessária para usar o aplicativo");
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Precisamos da sua permissão para usar a câmera
        </Text>
        <Button onPress={handleRequestPermission} title="Conceder Permissão" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />

      <View style={styles.controlsContainer}>
        {/* Toggle para modo tempo real */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
            {isRealtimeMode ? "Tempo Real (Ativo)" : "Modo Foto"}
          </Text>
          <Switch
            value={isRealtimeMode}
            onValueChange={toggleRealtimeMode}
            disabled={isLoading}
          />
        </View>

        {/* Botão para foto única (apenas quando não está em modo tempo real) */}
        {!isRealtimeMode && (
          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "Processando..." : "Tirar Foto e Identificar"}
              onPress={handleTakePicture}
              disabled={isLoading}
            />
          </View>
        )}

        {/* Indicador de status para modo tempo real */}
        {isRealtimeMode && (
          <View style={styles.realtimeStatusContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.realtimeStatusText}>
              Identificando objetos em tempo real...
            </Text>
          </View>
        )}
      </View>

      {isLoading && !isRealtimeMode && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Identificando objeto...</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    fontSize: 16,
    marginHorizontal: 20,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  buttonContainer: {
    marginTop: 10,
  },
  realtimeStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#e8f4fd",
    borderRadius: 8,
    marginTop: 10,
  },
  realtimeStatusText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 20,
    maxHeight: 150,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  resultText: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
});
