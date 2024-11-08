import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Animated, Button, Easing, TextInput, ScrollView, Platform, Image, Modal } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import config from '../config';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types'; // Adjust the path as necessary
import {  useRouter } from 'expo-router'; // Import useRouter
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Define the navigation prop type
type InspectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'index' // or the appropriate screen name
>;

// Define the props type for InspectionScreen
type InspectionScreenProps = {
  navigation: InspectionScreenNavigationProp;
  userRole?: string; // Optional prop with default value
  userPermissions?: string[]; // Optional prop with default value
};

const InspectionScreen: React.FC<InspectionScreenProps> = ({ userRole = 'User', userPermissions = [] }) => {
  
  const router = useRouter(); // Initialize router
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannerSize, setScannerSize] = useState(250);
  const [extinguisherInfo, setExtinguisherInfo] = useState<any | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [addingInspection, setAddingInspection] = useState(false);

  const greeting = "Welcome to the Inspection Screen";

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (cameraOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [cameraOpen]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setCameraOpen(false);

    try {
      const response = await fetch(`${config.apiUrl}/mobile/extinguisher/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData: data }),
      });

      if (response.ok) {
        const info = await response.json();
        setExtinguisherInfo(info);
        setShowOptions(true); // Show options after fetching details
        Alert.alert('Success', 'Extinguisher details fetched successfully');
      } else {
        Alert.alert('Error', 'Failed to fetch extinguisher details');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing the QR code');
    }
  };

  if (addingInspection) {
    return <InspectionForm extinguisherInfo={extinguisherInfo} setAddingInspection={setAddingInspection} />;
  }

  if (showOptions) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => setAddingInspection(true)}
        >
          <Text style={styles.buttonText}>Add Inspection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => {
            if (extinguisherInfo && extinguisherInfo.id) {
              console.log('Extinguisher ID:', extinguisherInfo.id);
              router.push({ pathname: '/InspectionDetails', params: { extinguisherid: extinguisherInfo.id } });
            } else {
              Alert.alert('Error', 'Extinguisher information is not available.');
            }
          }}
        >
          <Text style={styles.buttonText}>Get Inspection Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => {
            setScanned(false);
            setCameraOpen(true);
            setShowOptions(false);
          }}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>

      <TouchableOpacity
        style={styles.qrTab}
        onPress={() => {
          setScanned(false);
          setCameraOpen(true);
        }}
      >
        <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
        <Text style={styles.qrText}>Scan QR code</Text>
      </TouchableOpacity>

     
      {cameraOpen && (
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleOverlay}>
              <View style={styles.sideOverlay} />
              <View style={[styles.focused, { width: scannerSize, height: scannerSize }]}>
                <Animated.View
                  style={[
                    styles.animatedLine,
                    {
                      transform: [
                        {
                          translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, scannerSize],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Back" onPress={() => setCameraOpen(false)} color="#841584" />
          </View>
        </View>
      )}
    </View>
  );
};

const InspectionForm: React.FC<{ extinguisherInfo: { id: string }, setAddingInspection: React.Dispatch<React.SetStateAction<boolean>> }> = ({ extinguisherInfo, setAddingInspection }) => {
  const navigation = useNavigation();
  const [cylinderCondition, setCylinderCondition] = useState('');
  const [hoseCondition, setHoseCondition] = useState('');
  const [standCondition, setStandCondition] = useState('');
  const [fullWeight, setFullWeight] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  const [refilledDate, setRefilledDate] = useState<Date | null>(null);
  const [nextRefillDate, setNextRefillDate] = useState<Date | null>(null);
  const [servicedDate, setServicedDate] = useState<Date | null>(null);
  const [nextServiceDate, setNextServiceDate] = useState<Date | null>(null);
  const [showRefilledDatePicker, setShowRefilledDatePicker] = useState(false);
  const [showNextRefillDatePicker, setShowNextRefillDatePicker] = useState(false);
  const [showServicedDatePicker, setShowServicedDatePicker] = useState(false);
  const [showNextServiceDatePicker, setShowNextServiceDatePicker] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track submission status

  const handleSubmit = async () => {
    // Validate all fields
    if (!cylinderCondition || !hoseCondition || !standCondition || !fullWeight || !actualWeight || !notes || !status || !image) {
      Alert.alert('Validation Error', 'All fields are mandatory.');
      return;
    }

    // Validate numeric fields
    if (isNaN(Number(fullWeight)) || isNaN(Number(actualWeight))) {
      Alert.alert('Validation Error', 'Full Weight and Actual Weight must be numeric.');
      return;
    }

    setIsSubmitting(true); // Disable the button

    const formData = new FormData();
    formData.append('extinguisherId', extinguisherInfo.id);
    formData.append('inspectionDate', new Date().toISOString().split('T')[0]);
    formData.append('notes', notes);
    formData.append('status', status);
    const currentDate = new Date();
    const nextInspectionDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3)).toISOString().split('T')[0];
    formData.append('next_inspection_date', nextInspectionDate);
    formData.append('photo', {
      uri: image,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    const updates = {
      cylinder_condition: cylinderCondition,
      hose_condition: hoseCondition,
      stand_condition: standCondition,
      full_weight: fullWeight,
      actual_weight: actualWeight,
      refilled_date: refilledDate ? refilledDate.toISOString().split('T')[0] : '',
      next_refill_date: nextRefillDate ? nextRefillDate.toISOString().split('T')[0] : '',
      serviced_date: servicedDate ? servicedDate.toISOString().split('T')[0] : '',
      next_service_date: nextServiceDate ? nextServiceDate.toISOString().split('T')[0] : '',
    };

    formData.append('updates', JSON.stringify(updates));

    try {
      const userData = await AsyncStorage.getItem('loginData');
      let token = '';

      if (userData) {
        const parsedData = JSON.parse(userData);
        token = parsedData.token;
      }

      const response = await fetch(`${config.apiUrl}/mobile/inspection/update-and-add-inspection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

     
      const responseData = await response.json();
      console.log('Success:', responseData);

      if (response.status === 400 && responseData.status === 'Approve Pending') {
        Alert.alert('Alert', responseData.message);
        return;
        
      }
      if (!response.ok && responseData.status !== 'Approve Pending') {
        const errorData = await response.text();
        throw new Error(`Network response was not ok: ${errorData}`);
        
      }

      

      Alert.alert('Success', 'Extinguisher updated and inspection added successfully.');
      setAddingInspection(false); // Reset the state to go back to the main inspection page
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while adding the inspection.');
    } finally {
      setIsSubmitting(false); // Re-enable the button
    }
  };

  const pickImage = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to capture images.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disable cropping
      quality: 0.7, // Adjust quality to reduce size without significant degradation
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleNextServiceDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowNextServiceDatePicker(false);
    if (selectedDate) {
      setNextServiceDate(selectedDate);
    }
  };

  const handleNextRefillDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowNextRefillDatePicker(false);
    if (selectedDate) {
      setNextRefillDate(selectedDate);
    }
  };

  const handleServicedDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowServicedDatePicker(false);
    if (selectedDate) {
      setServicedDate(selectedDate);
    }
  };

  const handleRefilledDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowRefilledDatePicker(false);
    if (selectedDate) {
      setRefilledDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formContainer}>
        <TextInput
          placeholder="Cylinder Condition"
          value={cylinderCondition}
          onChangeText={setCylinderCondition}
          style={styles.input}
        />
        <TextInput
          placeholder="Hose Condition"
          value={hoseCondition}
          onChangeText={setHoseCondition}
          style={styles.input}
        />
        <TextInput
          placeholder="Stand Condition"
          value={standCondition}
          onChangeText={setStandCondition}
          style={styles.input}
        />
        <TextInput
          placeholder="Full Weight"
          value={fullWeight}
          onChangeText={setFullWeight}
          style={styles.input}
          keyboardType="numeric" // Set keyboard type to numeric
        />
        <TextInput
          placeholder="Actual Weight"
          value={actualWeight}
          onChangeText={setActualWeight}
          style={styles.input}
          keyboardType="numeric" // Set keyboard type to numeric
        />
        <TouchableOpacity onPress={() => setShowRefilledDatePicker(true)} style={styles.datePicker}>
          <Text style={styles.dateText}>
            {refilledDate ? refilledDate.toDateString() : 'Refilled Date'}
          </Text>
          <Ionicons name="calendar" size={24} color="black" />
        </TouchableOpacity>
        {showRefilledDatePicker && (
          <DateTimePicker
            value={refilledDate || new Date()}
            mode="date"
            display="default"
            onChange={handleRefilledDateChange}
          />
        )}
        <TouchableOpacity onPress={() => setShowNextRefillDatePicker(true)} style={styles.datePicker}>
          <Text style={styles.dateText}>
            {nextRefillDate ? nextRefillDate.toDateString() : 'Select Next Refill Date'}
          </Text>
          <Ionicons name="calendar" size={24} color="black" />
        </TouchableOpacity>
        {showNextRefillDatePicker && (
          <DateTimePicker
            value={nextRefillDate || new Date()}
            mode="date"
            display="default"
            onChange={handleNextRefillDateChange}
          />
        )}
        <TouchableOpacity onPress={() => setShowServicedDatePicker(true)} style={styles.datePicker}>
          <Text style={styles.dateText}>
            {servicedDate ? servicedDate.toDateString() : 'Select Serviced Date'}
          </Text>
          <Ionicons name="calendar" size={24} color="black" />
        </TouchableOpacity>
        {showServicedDatePicker && (
          <DateTimePicker
            value={servicedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleServicedDateChange}
          />
        )}
        <TouchableOpacity onPress={() => setShowNextServiceDatePicker(true)} style={styles.datePicker}>
          <Text style={styles.dateText}>
            {nextServiceDate ? nextServiceDate.toDateString() : 'Select Next Service Date'}
          </Text>
          <Ionicons name="calendar" size={24} color="black" />
        </TouchableOpacity>
        {showNextServiceDatePicker && (
          <DateTimePicker
            value={nextServiceDate || new Date()}
            mode="date"
            display="default"
            onChange={handleNextServiceDateChange}
          />
        )}
        <TextInput
          placeholder="Remarks"
          value={remarks}
          onChangeText={setRemarks}
          style={styles.input}
        />
        <TextInput
          placeholder="Notes"
          value={notes}
          onChangeText={setNotes}
          style={styles.input}
        />
        <TextInput
          placeholder="Status"
          value={status}
          onChangeText={setStatus}
          style={styles.input}
        />
        <TouchableOpacity onPress={pickImage} style={styles.button}>
          <Text style={styles.buttonText}>Capture Image</Text>
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} style={styles.image} />}
        <TouchableOpacity onPress={() => setAddingInspection(false)} style={styles.button}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.updateButton, isSubmitting && { backgroundColor: '#ccc' }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Aligns content to the top
    alignItems: 'center',
    paddingTop: 20, // Adds some space from the top
  },

  formContainer1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },

  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#007BFF', // Example color
    borderRadius: 25, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginBottom: 20, // Adds space below the header
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#28a745', // Vibrant green color
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  qrText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#fff', // White text for contrast
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  focused: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  animatedLine: {
    height: 2,
    backgroundColor: 'red',
    width: '100%',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  formContainer: {
    width: '90%',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  button: {
    backgroundColor: '#28A745',
    borderRadius: 25,
    paddingVertical: 15,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    width: '100%',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#808080', // Set to grey color
    // Removed fontWeight to make the text not bold
  },
  updateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
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
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },

 
 
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  iconButton: {
    padding: 10,
  },
});

export default InspectionScreen;
