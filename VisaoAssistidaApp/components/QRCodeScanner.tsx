import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

interface BusLineInfo {
  numero: string;
  nome: string;
  empresa: string;
  tarifa: number | string;
  horarios: string[];
  pontos_principais: string[];
  qr_data_original?: string;
  erro?: string;
}

interface QRCodeResult {
  qr_data: string;
  bus_info: BusLineInfo;
  bbox: number[];
}

interface QRCodeScannerProps {
  serverUrl: string;
  onClose: () => void;
}

export default function QRCodeScanner({
  serverUrl,
  onClose,
}: QRCodeScannerProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<QRCodeResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  const speakText = (text: string) => {
    Speech.speak(text, {
      language: 'pt-BR',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const captureAndProcessQRCode = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      // Captura a foto
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (!photo?.base64) {
        throw new Error('Não foi possível capturar a imagem');
      }

      // Envia para o servidor
      const response = await fetch(`${serverUrl}/process-qrcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: photo.base64,
        }),
      });

      const data = await response.json();

      if (data.error) {
        Alert.alert('Erro', data.error);
        speakText(`Erro: ${data.error}`);
        return;
      }

      if (!data.qr_codes_found) {
        Alert.alert('QR Code não encontrado', data.message);
        speakText(data.message);
        return;
      }

      // Processa os resultados
      setResults(data.results);
      setShowResults(true);

      // Fala os resultados
      const announcements = data.results.map((result: QRCodeResult) => {
        const bus = result.bus_info;
        if (bus.erro) {
          return `Erro ao processar QR code: ${bus.erro}`;
        }

        const nextHours = bus.horarios.slice(0, 3).join(', ');
        return `Linha ${bus.numero}: ${bus.nome}. Próximos horários: ${nextHours}. Tarifa: ${bus.tarifa}`;
      });

      speakText(announcements.join('. '));
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      Alert.alert('Erro', 'Erro ao processar QR code');
      speakText('Erro ao processar QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Solicitando permissão da câmera...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          Precisamos da sua permissão para usar a câmera
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <ThemedText style={styles.buttonText}>Conceder Permissão</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <ThemedText style={styles.headerText}>
            Escaneie o QR Code da linha de ônibus
          </ThemedText>
        </View>

        {/* QR Code Frame */}
        <View style={styles.qrFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isProcessing && styles.captureButtonDisabled,
            ]}
            onPress={captureAndProcessQRCode}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Ionicons name="scan" size={40} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowResults(true)}
            disabled={results.length === 0}
          >
            <Ionicons
              name="list"
              size={30}
              color={results.length > 0 ? 'white' : 'gray'}
            />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResults(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Informações da Linha
            </ThemedText>
            <TouchableOpacity onPress={() => setShowResults(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsContainer}>
            {results.map((result, index) => (
              <View key={index} style={styles.busInfoCard}>
                {result.bus_info.erro ? (
                  <View>
                    <ThemedText style={styles.errorText}>
                      {result.bus_info.erro}
                    </ThemedText>
                    <ThemedText style={styles.qrDataText}>
                      Dados do QR Code: {result.qr_data}
                    </ThemedText>
                  </View>
                ) : (
                  <View>
                    <ThemedText style={styles.busNumber}>
                      Linha {result.bus_info.numero}
                    </ThemedText>
                    <ThemedText style={styles.busName}>
                      {result.bus_info.nome}
                    </ThemedText>
                    <ThemedText style={styles.busCompany}>
                      Empresa: {result.bus_info.empresa}
                    </ThemedText>
                    <ThemedText style={styles.busFare}>
                      Tarifa: R$ {result.bus_info.tarifa}
                    </ThemedText>

                    <View style={styles.section}>
                      <ThemedText style={styles.sectionTitle}>
                        Próximos Horários:
                      </ThemedText>
                      {result.bus_info.horarios.map((horario, i) => (
                        <ThemedText key={i} style={styles.scheduleItem}>
                          • {horario}
                        </ThemedText>
                      ))}
                    </View>

                    <View style={styles.section}>
                      <ThemedText style={styles.sectionTitle}>
                        Pontos Principais:
                      </ThemedText>
                      {result.bus_info.pontos_principais.map((ponto, i) => (
                        <ThemedText key={i} style={styles.stopItem}>
                          • {ponto}
                        </ThemedText>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.speakButton}
                      onPress={() => {
                        const text = `Linha ${result.bus_info.numero}: ${
                          result.bus_info.nome
                        }. Próximos horários: ${result.bus_info.horarios
                          .slice(0, 3)
                          .join(', ')}. Tarifa: ${result.bus_info.tarifa}`;
                        speakText(text);
                      }}
                    >
                      <Ionicons name="volume-high" size={20} color="white" />
                      <ThemedText style={styles.speakButtonText}>
                        Ouvir Informações
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    marginRight: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  qrFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
  },
  cornerTopRight: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: '30%',
    right: '20%',
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  busInfoCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  busName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  busCompany: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  busFare: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28A745',
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  scheduleItem: {
    fontSize: 14,
    marginBottom: 3,
    color: '#666',
  },
  stopItem: {
    fontSize: 14,
    marginBottom: 3,
    color: '#666',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  speakButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  qrDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
