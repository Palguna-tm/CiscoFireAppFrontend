import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, TouchableOpacity, Animated, Easing, Alert, ScrollView, TextInput } from 'react-native';
import { CameraView, Camera } from "expo-camera"
import { MaterialIcons } from '@expo/vector-icons';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Collapsible from 'react-native-collapsible';


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
      const parsedData = JSON.parse(data);
      if (parsedData.id && parsedData.location && parsedData.block && parsedData.area) {
        setScannedData(parsedData.id.toString());
        const response = await fetch(`${config.apiUrl}/extinguisher/${parsedData.id}`);
        if (response.ok) {
          const info = await response.json();
          setExtinguisherInfo(info);
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '80%',
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
});

