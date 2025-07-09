// App.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import CameraView from '../../components/CameraView'; 

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <CameraView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
