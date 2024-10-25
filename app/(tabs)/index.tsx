import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner, BarCodeEvent } from 'expo-barcode-scanner';
import { MaterialIcons } from '@expo/vector-icons'; // For QR code icon

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false); // For toggling the camera

  // Function to set greeting based on time
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good Morning 🌞');
    } else if (hours < 18) {
      setGreeting('Good Afternoon ☀️');
    } else {
      setGreeting('Good Evening 🌜');
    }
  }, []);

  // Requesting camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: BarCodeEvent) => {
    setScanned(true);
    setScannedData(data);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  // Conditional rendering if the permission is pending
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Requesting for camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Displaying Greeting */}
      <Text style={styles.greeting}>{greeting}</Text>

      {/* QR Code Scanner Tab */}
      <TouchableOpacity
        style={styles.qrTab}
        onPress={() => setCameraOpen(true)} // Open camera only when clicked
      >
        <MaterialIcons name="qr-code-scanner" size={24} color="black" />
        <Text style={styles.qrText}>Scan any QR code</Text>
      </TouchableOpacity>

      {/* Conditionally render the camera */}
      {cameraOpen && (
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          {scanned && (
            <View style={styles.buttonContainer}>
              <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} color="#841584" />
            </View>
          )}
          {scannedData ? (
            <View style={styles.dataContainer}>
              <Text style={styles.dataText}>Scanned Data: {scannedData}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30, // Reduced padding to move content higher
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content to the top
    backgroundColor: '#f5f5f5',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10, // Reduced margin to move closer to the top
    textAlign: 'center',
    color: '#333',
  },
  qrTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Reduced margin to move closer to the top
    padding: 20,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 10,
    width: '60%', // Reduced width from '90%' to '80%'
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  qrText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dataContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    alignItems: 'center',
  },
  dataText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
