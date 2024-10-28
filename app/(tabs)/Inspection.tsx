import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Animated, Button, Easing, TextInput, ScrollView, Platform } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import config from '../config';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types'; // Adjust the path as necessary
import InspectionTable from '../InspectionTable';
import { useRouter } from 'expo-router'; // Import useRouter
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const navigation = useNavigation(); // Use the hook to get the navigation object
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
      const parsedData = JSON.parse(data);
      if (parsedData.id) {
        const response = await fetch(`${config.apiUrl}/extinguisher/${parsedData.id}`);
        if (response.ok) {
          const info = await response.json();
          setExtinguisherInfo(info);
          setShowOptions(true); // Show options after fetching details
          Alert.alert('Success', 'Extinguisher details fetched successfully');
        } else {
          Alert.alert('Error', 'Failed to fetch extinguisher details');
        }
      } else {
        Alert.alert('Invalid QR Code', 'The QR code does not contain valid extinguisher information.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing the QR code');
    }
  };

  if (addingInspection) {
    return <InspectionForm extinguisherInfo={extinguisherInfo} />;
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
          onPress={() => router.push('/InspectionTable')}
        >
          <Text style={styles.buttonText}>Get Inspection Details</Text>
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

const InspectionForm: React.FC<{ extinguisherInfo: { id: string } }> = ({ extinguisherInfo }) => {
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
  const [showNewForm, setShowNewForm] = useState(false);

  const handleRefilledDateChange = (event: any, selectedDate?: Date) => {
    setShowRefilledDatePicker(false);
    if (selectedDate) {
      setRefilledDate(selectedDate);
    }
  };

  const handleNextRefillDateChange = (event: any, selectedDate?: Date) => {
    setShowNextRefillDatePicker(false);
    if (selectedDate) {
      setNextRefillDate(selectedDate);
    }
  };

  const handleServicedDateChange = (event: any, selectedDate?: Date) => {
    setShowServicedDatePicker(false);
    if (selectedDate) {
      setServicedDate(selectedDate);
    }
  };

  const handleNextServiceDateChange = (event: any, selectedDate?: Date) => {
    setShowNextServiceDatePicker(false);
    if (selectedDate) {
      setNextServiceDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    const inspectionData = {
      cylinder_condition: cylinderCondition,
      hose_condition: hoseCondition,
      stand_condition: standCondition,
      full_weight: fullWeight,
      actual_weight: actualWeight,
      refilled_date: refilledDate ? refilledDate.toISOString().split('T')[0] : '',
      next_refill_date: nextRefillDate ? nextRefillDate.toISOString().split('T')[0] : '',
      serviced_date: servicedDate ? servicedDate.toISOString().split('T')[0] : '',
      next_service_date: nextServiceDate ? nextServiceDate.toISOString().split('T')[0] : '',
      remarks,
    };

    try {
      const response = await fetch(`${config.apiUrl}/extinguisher/${extinguisherInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspectionData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Extinguisher details updated successfully');
        setShowNewForm(true);
      } else {
        Alert.alert('Error', 'Failed to update extinguisher details');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the extinguisher details');
    }
  };

  if (showNewForm) {
    return <NewForm />;
  }

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
        />
        <TextInput
          placeholder="Actual Weight"
          value={actualWeight}
          onChangeText={setActualWeight}
          style={styles.input}
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
        <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};



interface InspectionData {
  extinguisherId: number;
  inspectionDate: string;
  inspectorName: string;
  notes: string;
  status: string;
  next_inspection_date: string;
}

const NewForm: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('loginData');
        if (userData) {
          const { user } = JSON.parse(userData);
          setUserRole(user.role);
          setUserPermissions(user.permissions);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const userData = await AsyncStorage.getItem('loginData');
      let token = '';

      if (userData) {
        const parsedData = JSON.parse(userData);
        token = parsedData.token;
      }

      const response = await fetch(`${config.apiUrl}/inspection/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setInspections(data.inspections);
      } else {
        const errorData = await response.text();
        console.error('Error fetching inspections:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!notes || !status) {
      Alert.alert('Validation Error', 'All fields are mandatory.');
      return;
    }

    const data: InspectionData = {
      extinguisherId: 28,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName: "John Doe",
      notes: notes,
      status: status,
      next_inspection_date: "2024-01-01"
    };

    try {
      const userData = await AsyncStorage.getItem('loginData');
      let token = '';

      if (userData) {
        const parsedData = JSON.parse(userData);
        token = parsedData.token;
      }

      const response = await fetch(`${config.apiUrl}/inspection/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Network response was not ok: ${errorData}`);
      }

      const responseData = await response.json();
      console.log('Success:', responseData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.formContainer1}>
      <TextInput
        placeholder="Status"
        value={status}
        onChangeText={setStatus}
        style={styles.input}
      />
      <TextInput
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
        style={styles.input}
      />
      <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Add Inspection</Text>
      </TouchableOpacity>
    </View>
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
    backgroundColor: '#007BFF',
    borderRadius: 25, // Rounded corners
    paddingVertical: 15,
    width: '90%', // Consistent width with inputs
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InspectionScreen;
