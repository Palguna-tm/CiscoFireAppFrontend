import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, Text, TouchableOpacity, Animated, Image, Modal, Button, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { BarCodeScanner, BarCodeEvent } from 'expo-barcode-scanner';
import { MaterialIcons } from '@expo/vector-icons';
import config from '../config'; // Adjust the path as necessary

const Report = () => {
  const [extinguisherId, setExtinguisherId] = useState('');
  const [inspectionDate, setInspectionDate] = useState<Date | null>(null);
  const [inspectorName, setInspectorName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [greeting, setGreeting] = useState('');
  const [photo, setPhoto] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning ☀️');
    } else if (hour < 18) {
      setGreeting('Good Afternoon 🌤️');
    } else {
      setGreeting('Good Evening 🌙');
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleAddInspection = async () => {
    if (!inspectionDate) {
      Alert.alert('Error', 'Please select an inspection date');
      return;
    }

    const formData = new FormData();
    formData.append('extinguisherId', extinguisherId);
    formData.append('inspectionDate', inspectionDate.toISOString().split('T')[0]);
    formData.append('inspectorName', inspectorName);
    formData.append('notes', notes);
    formData.append('status', status);

    if (photo) {
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }

    try {
      const response = await fetch(`${config.apiUrl}/inspection/2/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Inspection added successfully');
      } else {
        Alert.alert('Error', 'Failed to add inspection');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while adding inspection');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setInspectionDate(selectedDate);
    }
  };

  const selectPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission to access gallery is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setPhoto(pickerResult.assets[0]);
    }
    setModalVisible(false);
  };

  const capturePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setPhoto(pickerResult.assets[0]);
    }
    setModalVisible(false);
  };

  const handleBarCodeScanned = ({ type, data }: BarCodeEvent) => {
    setScanned(true);
    setScannedData(data);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
          {greeting}
        </Animated.Text>
        <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
          Add Inspection Details
        </Animated.Text>

        {/* QR Code Scanner Tab */}
        <TouchableOpacity
          style={styles.qrTab}
          onPress={() => setCameraOpen(true)}
        >
          <MaterialIcons name="qr-code" size={48} color="#2196F3" />
          <Text style={styles.qrText}>Scan any QR code</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Extinguisher ID"
          value={extinguisherId}
          onChangeText={setExtinguisherId}
          keyboardType="numeric"
        />
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text>
            {inspectionDate ? inspectionDate.toISOString().split('T')[0] : 'Select Inspection Date'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={inspectionDate || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Inspector Name"
          value={inspectorName}
          onChangeText={setInspectorName}
        />
        <TextInput
          style={styles.input}
          placeholder="Notes"
          value={notes}
          onChangeText={setNotes}
        />
        <TextInput
          style={styles.input}
          placeholder="Status"
          value={status}
          onChangeText={setStatus}
        />
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Add Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleAddInspection}>
          <Text style={styles.buttonText}>Add Inspection</Text>
        </TouchableOpacity>
        {photo && (
          <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
        )}
      </View>

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Upload Image</Text>
            <Text style={styles.modalSubText}>Choose an option</Text>
            <TouchableOpacity onPress={capturePhoto}>
              <Text style={styles.modalButton}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={selectPhoto}>
              <Text style={styles.modalButton}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  animatedText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2196F3',
    textShadowColor: '#aaa',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    width: '90%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    marginBottom: 15,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    width: '50%',
    backgroundColor: '#007BFF',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalButton: {
    fontSize: 16,
    color: '#007BFF',
    marginBottom: 10,
  },
  qrTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 20,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 10,
    width: '40%',
    height: 100, // Set the desired height
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  qrText: {
    marginTop: 7,
    fontSize: 8,
    fontWeight: '400',
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
});

export default Report;
