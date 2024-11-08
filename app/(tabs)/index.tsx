import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, TouchableOpacity, Animated, Easing, Alert, ScrollView, TextInput, Modal, Dimensions, Linking } from 'react-native';
import { CameraView, Camera } from "expo-camera"
import { MaterialIcons } from '@expo/vector-icons';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import Collapsible from 'react-native-collapsible';
import { Picker } from '@react-native-picker/picker';
import { Country, State, City } from 'country-state-city';
import { LinearGradient } from 'expo-linear-gradient';



export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  const [greeting, setGreeting] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [extinguisherInfo, setExtinguisherInfo] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLocationCollapsed, setIsLocationCollapsed] = useState(true);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);
  const animatedValue = new Animated.Value(0);
  const animatedLocationArrow = new Animated.Value(0);
  const animatedDetailsArrow = new Animated.Value(0);

  const defaultFormData = {
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
    installation_year: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('location');

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    if (isModalVisible) {
      // Clear form data when closing the modal
      setFormData(defaultFormData);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        console.log('Retrieved location:', location);
        setFormData((prevData) => ({
          ...prevData,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      } catch (error) {
        console.error('Error retrieving location:', error);
        Alert.alert('Error', 'Failed to retrieve location');
      }
    })();
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const validateFormData = () => {
    const {
      location,
      block,
      area,
      type_capacity,
      manufacture_year,
      country,
      state,
      city,
      floor,
      installation_year,
    } = formData;

    const missingFields = [];

    if (!location) missingFields.push('Location');
    if (!block) missingFields.push('Block');
    if (!area) missingFields.push('Area');
    if (!type_capacity) missingFields.push('Type/Capacity');
    if (!manufacture_year) missingFields.push('Manufacture Year');
    if (!country) missingFields.push('Country');
    if (!state) missingFields.push('State');
    if (!city) missingFields.push('City');
    if (!floor) missingFields.push('Floor');
    if (!installation_year) missingFields.push('Installation Year');

    // Ensure that manufacture_year and installation_year are not empty strings
    if (manufacture_year === '') missingFields.push('Manufacture Year');
    if (installation_year === '') missingFields.push('Installation Year');

    if (missingFields.length > 0) {
      Alert.alert('Validation Error', `The following fields are missing: ${missingFields.join(', ')}`);
      return false;
    }

    if (isNaN(Number(manufacture_year)) || isNaN(Number(installation_year))) {
      Alert.alert('Validation Error', 'Year fields must be numeric');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateFormData()) {
      return;
    }

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

      const response = await fetch(`${config.apiUrl}/mobile/extinguisher/add`, {
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
        
        // Clear form data and close the modal
        setFormData(defaultFormData);
        setIsModalVisible(false);
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

        // Generate Google Maps URL and store it in state
        const url = `https://www.google.com/maps/search/?api=1&query=${info.latitude},${info.longitude}`;
        setGoogleMapsUrl(url);
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

  const handleScanQRCodePress = () => {
    setScanned(false);
    setCameraOpen(true);
    setExtinguisherInfo(null);
    setGoogleMapsUrl(null);
  };

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry as string) : [];
  const cities = selectedState && selectedCountry ? City.getCitiesOfState(selectedCountry as string, selectedState as string) : [];

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setFormData((prevData) => ({
      ...prevData,
      country: value,
      state: '', // Reset state and city when country changes
      city: '',
    }));
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setFormData((prevData) => ({
      ...prevData,
      state: value,
      city: '', // Reset city when state changes
    }));
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setFormData((prevData) => ({
      ...prevData,
      city: value,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); // Formats the date to a readable string
  };

  const renderTabContent = () => {
    if (activeTab === 'location') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.infoText}>
            <MaterialIcons name="place" size={20} color="#FF6347" /> Location: {extinguisherInfo.location}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="location-city" size={20} color="#4682B4" /> Block: {extinguisherInfo.block}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="map" size={20} color="#32CD32" /> Area: {extinguisherInfo.area}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="layers" size={20} color="#FFD700" /> Floor: {extinguisherInfo.floor}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="public" size={20} color="#8A2BE2" /> Country: {extinguisherInfo.country}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="flag" size={20} color="#FF4500" /> State: {extinguisherInfo.state}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="location-city" size={20} color="#1E90FF" /> City: {extinguisherInfo.city}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="precision-manufacturing" size={20} color="#FF1493" /> Installation Year: {extinguisherInfo.installation_year}
          </Text>
        </View>
      );
    } else if (activeTab === 'details') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.infoText}>
            <MaterialIcons name="fire-extinguisher" size={20} color="#FF6347" /> Type/Capacity: {extinguisherInfo.type_capacity}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="factory" size={20} color="#4682B4" /> Manufacture Year: {extinguisherInfo.manufacture_year}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="check-circle" size={20} color="#32CD32" /> Cylinder Condition: {extinguisherInfo.cylinder_condition}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="check-circle" size={20} color="#FFD700" /> Hose Condition: {extinguisherInfo.hose_condition}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="check-circle" size={20} color="#8A2BE2" /> Stand Condition: {extinguisherInfo.stand_condition}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="scale" size={20} color="#FF4500" /> Full Weight: {extinguisherInfo.full_weight}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="scale" size={20} color="#1E90FF" /> Actual Weight: {extinguisherInfo.actual_weight}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="calendar-today" size={20} color="#FF1493" /> Refilled Date: {formatDate(extinguisherInfo.refilled_date)}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="event-available" size={20} color="#FF6347" /> Next Refill Date: {formatDate(extinguisherInfo.next_refill_date)}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="calendar-today" size={20} color="#4682B4" /> Serviced Date: {formatDate(extinguisherInfo.serviced_date)}
          </Text>
          <Text style={styles.infoText}>
            <MaterialIcons name="schedule" size={20} color="#32CD32" /> Next Service Date: {formatDate(extinguisherInfo.next_service_date)}
          </Text>
        </View>
      );
    }
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

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: (currentYear - i).toString(),
  }));

  const pickerContainerStyle = {
    width: Dimensions.get('window').width * 0.68,
    height: 50,
    marginBottom: 15,
    borderRadius: 25,
    overflow: 'hidden' as 'hidden',
  };

  const handleBackButtonPress = () => {
    // Clear form data and close the modal
    setFormData(defaultFormData);
    setIsModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFDEE9', '#B5FFFC']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.greetingContainer}
        >
          <Text style={styles.greeting}>
            {greeting} <MaterialIcons name="wb-sunny" size={24} color="#FFD700" />
          </Text>
        </LinearGradient>

        {userRole === 'Admin' && (
          <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
            <Text style={styles.buttonText}>Add Extinguisher</Text>
          </TouchableOpacity>
        )}

        {/* Modal for adding extinguisher */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={toggleModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                <Text style={styles.modalTitle}>Add Extinguisher</Text>
                {/* Form fields for extinguisher details */}
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
                <Picker
                  selectedValue={formData.manufacture_year}
                  onValueChange={(itemValue) => handleInputChange('manufacture_year', itemValue)}
                  style={styles.pickerContainer}
                >
                  <Picker.Item label="Select Manufacture Year" value="" />
                  {yearOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
                <TextInput
                  style={styles.input}
                  placeholder="Floor"
                  value={formData.floor}
                  onChangeText={(text) => handleInputChange('floor', text)}
                />
                <Picker
                  selectedValue={formData.country}
                  onValueChange={(itemValue) => handleCountryChange(itemValue)}
                  style={styles.pickerContainer}
                >
                  <Picker.Item label="Select Country" value="" />
                  {countries.map((country) => (
                    <Picker.Item key={country.isoCode} label={country.name} value={country.isoCode} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={formData.state}
                  onValueChange={(itemValue) => handleStateChange(itemValue)}
                  style={styles.pickerContainer}
                >
                  <Picker.Item label="Select State" value="" />
                  {states.map((state) => (
                    <Picker.Item key={state.isoCode} label={state.name} value={state.isoCode} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={formData.city}
                  onValueChange={(itemValue) => handleCityChange(itemValue)}
                  style={styles.pickerContainer}
                >
                  <Picker.Item label="Select City" value="" />
                  {cities.map((city) => (
                    <Picker.Item key={city.name} label={city.name} value={city.name} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={formData.installation_year}
                  onValueChange={(itemValue) => handleInputChange('installation_year', itemValue)}
                  style={styles.pickerContainer}
                >
                  <Picker.Item label="Select Installation Year" value="" />
                  {yearOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
                <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={toggleModal}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={styles.qrTab}
          onPress={handleScanQRCodePress}
        >
          <LinearGradient
            colors={['#00c6ff', '#0072ff']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.qrButtonGradient}
          >
            <MaterialIcons name="qr-code-scanner" size={28} color="white" />
            <Text style={styles.qrText}>Scan QR Code</Text>
          </LinearGradient>
        </TouchableOpacity>

        {cameraOpen && (
          <View style={styles.cameraContainer}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.futuristicOutline}>
              <Text style={styles.guidanceText}>Align QR code within the frame</Text>
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Back" onPress={() => setCameraOpen(false)} color="#841584" />
            </View>
          </View>
        )}

        {extinguisherInfo && (
          <View style={styles.card}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'location' && styles.activeTab]}
                onPress={() => setActiveTab('location')}
              >
                <Text style={styles.tabText}>Location Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
                onPress={() => setActiveTab('details')}
              >
                <Text style={styles.tabText}>Extinguisher Details</Text>
              </TouchableOpacity>
            </View>
            {renderTabContent()}
          </View>
        )}

        {googleMapsUrl && (
          <View style={styles.mapButtonContainer}>
            <Button
              title="View Location in Google Maps"
              onPress={() => {
                Linking.openURL(googleMapsUrl).catch(err => {
                  console.error('Failed to open Google Maps:', err);
                  Alert.alert('Error', 'Failed to open Google Maps');
                });
              }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
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
    justifyContent: 'center',
  },
  inputAndroid: {
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
    justifyContent: 'center',
  },
  iconContainer: {
    top: 15,
    right: 15,
  },
});

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  container: {
    flex: 1,
    paddingTop: 10,
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
  // greeting: {
  //   fontSize: 20, // Smaller size
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '80%',
    marginVertical: 10,
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
  qrTab: {
    marginTop: 20,
    borderRadius: 30,
    overflow: 'hidden',
    width: '80%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  qrButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  qrText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  futuristicOutline: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 0, 0.9)', // Bright green for a futuristic look
    borderRadius: 15, // Rounded corners for a modern look
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidanceText: {
    position: 'absolute',
    bottom: -30,
    color: 'rgba(0, 255, 0, 1)',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
    color: '#333',
    fontFamily: 'Roboto',
    lineHeight: 24,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
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
    backgroundColor: 'linear-gradient(90deg, rgba(255,0,150,1) 0%, rgba(0,204,255,1) 100%)',
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
    color: '#fff',
    lineHeight: 26,
    letterSpacing: 0.7,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%', // Ensure the modal doesn't exceed the screen height
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalScrollContent: {
    paddingVertical: 20, // Add padding to the top and bottom
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '95%',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  mapButtonContainer: {
    paddingBottom: 20, // Add padding to the bottom
    paddingHorizontal: 10, // Optional: Add horizontal padding for better spacing
    marginTop: 10, // Optional: Add margin to the top for spacing from other elements
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 10,
  },
  greetingContainer: {
    width: '80%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pickerContainer: {
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
    justifyContent: 'center', // Center the picker text
  },
});

