// src/components/VisionComponent.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { io, Socket } from 'socket.io-client';
import RNFS from 'react-native-fs';

const SERVER_URL = 'http://192.168.0.38:8000'; // Lembre-se de usar seu IP correto

interface Detection {
  label: string;
  confidence: number;
  box: [number, number, number, number];
}

const VisionComponent = () => {
  const device = useCameraDevice('back');
  const [detections, setDetections] = useState<Detection[]>([]);
  const socket = useRef<Socket | null>(null);
  const camera = useRef<Camera>(null);
  // MUDANÇA 1: Usar um useRef para guardar o ID do intervalo
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("[INFO] useEffect iniciado. Tentando conectar ao servidor...");
    socket.current = io(SERVER_URL);

    const captureAndProcess = async () => {
      console.log("--> [FRONTEND] Tentando capturar foto...");
      if (camera.current) { // Checa apenas a câmera, pois já sabemos que o socket está conectado
        try {
          const photo = await camera.current.takePhoto();
          const base64 = await RNFS.readFile(photo.path, 'base64');
          if (socket.current?.connected) { // Checagem extra de segurança
            socket.current.emit('process_frame', `data:image/jpeg;base64,${base64}`);
          }
        } catch (e) {
          console.error("!!!!!! [FRONTEND] ERRO:", e);
        }
      }
    };

    // MUDANÇA 2: A lógica do intervalo agora fica DENTRO dos listeners de conexão
    socket.current.on('connect', () => {
      console.log("--> [FRONTEND] Conectado ao servidor WebSocket!");
      // Só inicia o intervalo DEPOIS de conectar
      intervalId.current = setInterval(captureAndProcess, 2000);
    });
    
    socket.current.on('detection_results', (data: { detections: Detection[] }) => {
        console.log("--> [FRONTEND] Detecções recebidas:", data.detections);
        setDetections(data.detections);
    });

    socket.current.on('disconnect', () => {
      console.log("--> [FRONTEND] Desconectado do servidor.");
      // Limpa o intervalo se a conexão cair
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    });

    // Função de limpeza do useEffect
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // O resto do componente continua igual
  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'white'}}>Câmera não disponível.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={true} photo={true} />
      {detections.length > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{detections.map(d => d.label).join(', ')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
    infoContainer: { position: 'absolute', bottom: 50, left: 20, right: 20, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: 15, borderRadius: 10 },
    infoText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }
});

export default VisionComponent;