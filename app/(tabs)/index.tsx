import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, TouchableOpacity, Animated, Easing, Alert, ScrollView, TextInput } from 'react-native';
import { CameraView, Camera } from "expo-camera"
import { MaterialIcons } from '@expo/vector-icons';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import Collapsible from 'react-native-collapsible';
import RNPickerSelect from 'react-native-picker-select';
import { Country, State, City } from 'country-state-city';


export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [extinguisherInfo, setExtinguisherInfo] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLocationCollapsed, setIsLocationCollapsed] = useState(true);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);
  const animatedValue = new Animated.Value(0);
  const animatedLocationArrow = new Animated.Value(0);
  const animatedDetailsArrow = new Animated.Value(0);

  const [formData, setFormData] = useState({
    location: '',
    block: '',
    area: '',
    type_capacity: '',
    manufacture_year: '',
    latitude: 0,
    longitude: 0,
    country: '',
    state: '',
    city: '',
    floor: '',
  });

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setFormData((prevData) => ({
        ...prevData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    })();
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const userData = await AsyncStorage.getItem('loginData');
      let token = '';

      if (userData) {
        const parsedData = JSON.parse(userData);
        token = parsedData.token;
      }

      const dataToSubmit = {
        ...formData,
        manufacture_year: formData.manufacture_year ? parseInt(formData.manufacture_year) : null,
        installation_year: new Date().getFullYear(),
      };

      const response = await fetch('http://192.168.0.52:7001/extinguisher/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "Duplicate extinguisher entry") {
          Alert.alert('Error', 'Duplicate extinguisher entry');
        } else {
          console.error('Error:', errorData);
          Alert.alert('Error', 'Failed to add extinguisher');
        }
      } else {
        const responseData = await response.json();
        console.log('Success:', responseData);
        Alert.alert('Success', 'Extinguisher added successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await AsyncStorage.getItem('loginData');
      if (userData) {
        const { user } = JSON.parse(userData);
        setUserRole(user.role);
        setUserPermissions(user.permissions);
      }
    };

    fetchUserData();
  }, []);

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
        const response = await fetch('http://192.168.0.52:7001/extinguisher/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ encryptedData: data }),
        });

        if (response.ok) {
            const info = await response.json();
            setExtinguisherInfo(info);
        } else {
            Alert.alert('Error', 'Failed to decrypt QR code');
        }
    } catch (error) {
        Alert.alert('Error', 'An error occurred while processing the QR code');
    }
  };


  const toggleLocationCollapse = () => {
    Animated.timing(animatedLocationArrow, {
      toValue: isLocationCollapsed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsLocationCollapsed(!isLocationCollapsed);
  };

  const toggleDetailsCollapse = () => {
    Animated.timing(animatedDetailsArrow, {
      toValue: isDetailsCollapsed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsDetailsCollapsed(!isDetailsCollapsed);
  };

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
        {(userRole === 'Admin' && userPermissions.includes('Full read and write')) && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(!showAddForm)}>
            <Text style={styles.buttonText}>Add Extinguisher</Text>
          </TouchableOpacity>
        )}
      </View>

      {userRole === 'Inspector' && (
        <ScrollView 
          contentContainerStyle={styles.addFormContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.inputLabel}>Add Fire Extinguisher Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Block"
            value={formData.block}
            onChangeText={(text) => handleInputChange('block', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Area"
            value={formData.area}
            onChangeText={(text) => handleInputChange('area', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Type/Capacity"
            value={formData.type_capacity}
            onChangeText={(text) => handleInputChange('type_capacity', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Manufacture Year"
            keyboardType="numeric"
            value={formData.manufacture_year}
            onChangeText={(text) => handleInputChange('manufacture_year', text)}
          />

          <RNPickerSelect
            onValueChange={(value) => {
              setSelectedCountry(value);
              handleInputChange('country', value ?? '');
            }}
            items={Country.getAllCountries().map((country) => ({
              label: country.name,
              value: country.isoCode,
            }))}
            placeholder={{ label: "Select a country", value: null }}
            style={{
              ...pickerSelectStyles,
              inputIOS: {
                ...pickerSelectStyles.inputIOS,
                borderRadius: 50,
              },
              inputAndroid: {
                ...pickerSelectStyles.inputAndroid,
                borderRadius: 50,
              },
            }}
          />

          <RNPickerSelect
            onValueChange={(value) => {
              setSelectedState(value);
              handleInputChange('state', value ?? '');
            }}
            items={selectedCountry ? State.getStatesOfCountry(selectedCountry).map((state) => ({
              label: state.name,
              value: state.isoCode,
            })) : []}
            placeholder={{ label: "Select a state", value: null }}
            style={pickerSelectStyles}
          />

          <RNPickerSelect
            onValueChange={(value) => {
              setSelectedCity(value);
              handleInputChange('city', value ?? '');
            }}
            items={
              selectedCountry && selectedState
                ? City.getCitiesOfState(selectedCountry, selectedState).map((city) => ({
                    label: city.name,
                    value: city.name,
                  }))
                : []
            }
            placeholder={{ label: "Select a city", value: null }}
            style={pickerSelectStyles}
          />

          <TextInput
            style={styles.input}
            placeholder="Floor"
            value={formData.floor}
            onChangeText={(text) => handleInputChange('floor', text)}
          />
          <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {userRole === 'Admin' && (
        <TouchableOpacity
          style={styles.qrTab}
          onPress={() => {
            setScanned(false);
            setCameraOpen(true);
          }}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="black" />
          <Text style={styles.qrText}>Scan QR code</Text>
        </TouchableOpacity>
      )}

      {cameraOpen && userRole === 'Admin' && (
        
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
              <View style={styles.focused}>
                <Animated.View
                  style={[
                    styles.animatedLine,
                    {
                      transform: [
                        {
                          translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
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

      {extinguisherInfo && (
        <ScrollView style={styles.infoContainer}>
          <TouchableOpacity onPress={toggleLocationCollapse} style={styles.collapsibleHeaderContainer}>
            <Text style={styles.collapsibleHeader}>Extinguisher Location details:</Text>
            <Animated.View style={{ transform: [{ rotate: animatedLocationArrow.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="black" />
            </Animated.View>
          </TouchableOpacity>
          <Collapsible collapsed={isLocationCollapsed}>
            <View style={styles.collapsibleContent}>
              <Text style={styles.infoText}>Location: {extinguisherInfo.location}</Text>
              <Text style={styles.infoText}>Block: {extinguisherInfo.block}</Text>
              <Text style={styles.infoText}>Area: {extinguisherInfo.area}</Text>
              <Text style={styles.infoText}>Floor: {extinguisherInfo.floor}</Text>
              <Text style={styles.infoText}>Country: {extinguisherInfo.country}</Text>
              <Text style={styles.infoText}>State: {extinguisherInfo.state}</Text>
              <Text style={styles.infoText}>City: {extinguisherInfo.city}</Text>
              <Text style={styles.infoText}>Installation Year: {new Date(extinguisherInfo.installation_year).toLocaleDateString()}</Text>
            </View>
          </Collapsible>

          <TouchableOpacity onPress={toggleDetailsCollapse} style={styles.collapsibleHeaderContainer}>
            <Text style={styles.collapsibleHeader}>Extinguisher Details:</Text>
            <Animated.View style={{ transform: [{ rotate: animatedDetailsArrow.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="black" />
            </Animated.View>
          </TouchableOpacity>
          <Collapsible collapsed={isDetailsCollapsed}>
            <View style={styles.collapsibleContent}>
              <Text style={styles.infoText}>Type/Capacity: {extinguisherInfo.type_capacity}</Text>
              <Text style={styles.infoText}>Manufacture Year: {extinguisherInfo.manufacture_year}</Text>
              <Text style={styles.infoText}>Cylinder Condition: {extinguisherInfo.cylinder_condition}</Text>
              <Text style={styles.infoText}>Hose Condition: {extinguisherInfo.hose_condition}</Text>
              <Text style={styles.infoText}>Stand Condition: {extinguisherInfo.stand_condition}</Text>
              <Text style={styles.infoText}>Full Weight: {extinguisherInfo.full_weight}</Text>
              <Text style={styles.infoText}>Actual Weight: {extinguisherInfo.actual_weight}</Text>
              <Text style={styles.infoText}>Refilled Date: {extinguisherInfo.refilled_date ? new Date(extinguisherInfo.refilled_date).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.infoText}>Next Refill Date: {extinguisherInfo.next_refill_date ? new Date(extinguisherInfo.next_refill_date).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.infoText}>Serviced Date: {extinguisherInfo.serviced_date ? new Date(extinguisherInfo.serviced_date).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.infoText}>Next Service Date: {extinguisherInfo.next_service_date ? new Date(extinguisherInfo.next_service_date).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </Collapsible>

          <TouchableOpacity style={[styles.button, { marginBottom: 10 }]} onPress={() => {/* Navigate to update screen */}}>
            <Text style={styles.buttonText}>Update Information</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { marginBottom: 40 }]} onPress={() => {/* Navigate to inspection screen */}}>
            <Text style={styles.buttonText}>Start Inspection</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      
    </View>
  );
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
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
  inputAndroid: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 20, // Smaller size
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
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
    width: '60%',
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
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleOverlay: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  focused: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  animatedLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'red',
  },
  bottomOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  infoContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    width: '95%',
    alignSelf: 'center',
    marginBottom: 40,
    
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFormContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  collapsibleHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 5,
  },
  collapsibleContent: {
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 10,
  },
  collapsibleHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '95%',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    width: '90%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  dateText: {
    flex: 1,
  },
});

