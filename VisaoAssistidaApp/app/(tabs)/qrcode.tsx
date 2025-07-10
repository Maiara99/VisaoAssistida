import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import QRCodeScanner from '@/components/QRCodeScanner';
import { getServerUrl } from '@/config/app.config';

export default function QRCodeScreen() {
  const [showScanner, setShowScanner] = useState(false);

  // Obtém URL do servidor da configuração
  const SERVER_URL = getServerUrl();

  const handleStartScan = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  if (showScanner) {
    return (
      <QRCodeScanner serverUrl={SERVER_URL} onClose={handleCloseScanner} />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="qr-code" size={80} color="#007AFF" />
        <ThemedText style={styles.title}>Scanner de QR Code</ThemedText>
        <ThemedText style={styles.subtitle}>
          Escaneie QR codes de linhas de ônibus para obter informações completas
        </ThemedText>
      </View>

      <View style={styles.features}>
        <View style={styles.featureItem}>
          <Ionicons name="bus" size={24} color="#007AFF" />
          <ThemedText style={styles.featureText}>
            Informações da linha
          </ThemedText>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="time" size={24} color="#007AFF" />
          <ThemedText style={styles.featureText}>
            Horários dos ônibus
          </ThemedText>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <ThemedText style={styles.featureText}>Pontos principais</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="card" size={24} color="#007AFF" />
          <ThemedText style={styles.featureText}>Valor da tarifa</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="volume-high" size={24} color="#007AFF" />
          <ThemedText style={styles.featureText}>
            Leitura em voz alta
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
        <Ionicons name="scan" size={30} color="white" />
        <ThemedText style={styles.scanButtonText}>Iniciar Scanner</ThemedText>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <ThemedText style={styles.instructionsTitle}>Como usar:</ThemedText>
        <ThemedText style={styles.instructionsText}>
          1. Toque em "Iniciar Scanner" acima
        </ThemedText>
        <ThemedText style={styles.instructionsText}>
          2. Aponte a câmera para o QR code da linha de ônibus
        </ThemedText>
        <ThemedText style={styles.instructionsText}>
          3. Toque no botão de captura para processar
        </ThemedText>
        <ThemedText style={styles.instructionsText}>
          4. Ouça as informações da linha em voz alta
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  features: {
    marginVertical: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 20,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  instructions: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
});
