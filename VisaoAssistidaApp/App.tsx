// App.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import VisionComponent from './src/components/VisionComponent';

const App = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'granted') {
        setHasPermission(true);
      } else {
        // Lidar com o caso em que o usuário nega a permissão
        console.error('Permissão da câmera negada.');
      }
    };
    requestCameraPermission();
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Aguardando permissão da câmera...</Text>
      </View>
    );
  }

  return <VisionComponent />;
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;