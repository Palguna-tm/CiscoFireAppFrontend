import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import RNPickerSelect from 'react-native-picker-select';
import config from '../config';

const Add = () => {
  const [location, setLocation] = useState('');
  const [block, setBlock] = useState('');
  const [area, setArea] = useState('');
  const [typeCapacity, setTypeCapacity] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [greeting, setGreeting] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [floor, setFloor] = useState('');
  const [installationYear, setInstallationYear] = useState('');

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

    const requestLocationPermission = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to add an extinguisher.');
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while requesting location permission');
      } finally {
        setLoading(false);
      }
    };

    requestLocationPermission();
  }, [fadeAnim]);

  const handleAdd = async () => {
    if (!location || !block || !area || !typeCapacity || !manufactureYear || !country || !state || !city || !floor || !installationYear) {
      Alert.alert('Error', 'All fields must be filled');
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/extinguisher/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE', // Add your token here
        },
        body: JSON.stringify({
          location,
          block,
          area,
          type_capacity: typeCapacity,
          manufacture_year: parseInt(manufactureYear, 10),
          latitude,
          longitude,
          country,
          state,
          city,
          floor,
          installation_year: installationYear,
        }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        Alert.alert('Success', 'Extinguisher added successfully');
      } else if (data.error === 'Duplicate extinguisher entry') {
        Alert.alert('Location Already Exists', 'This location already has an extinguisher.');
      } else {
        Alert.alert('Error', 'Failed to add extinguisher');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
        {greeting}
      </Animated.Text>
      <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
        Add Fire Extinguisher Details
      </Animated.Text>
      {loading && <ActivityIndicator size="large" color="#007BFF" />}
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Block"
        value={block}
        onChangeText={setBlock}
      />
      <TextInput
        style={styles.input}
        placeholder="Area"
        value={area}
        onChangeText={setArea}
      />
      <TextInput
        style={styles.input}
        placeholder="Type/Capacity"
        value={typeCapacity}
        onChangeText={setTypeCapacity}
      />
      <TextInput
        style={styles.input}
        placeholder="Manufacture Year"
        value={manufactureYear}
        onChangeText={setManufactureYear}
        keyboardType="numeric"
      />
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={(value) => setCountry(value)}
          items={[
            { label: 'India', value: 'India' },
            { label: 'USA', value: 'USA' },
            // Add more countries as needed
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select a country', value: null }}
        />
      </View>
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={(value) => setState(value)}
          items={[
            { label: 'Karnataka', value: 'Karnataka' },
            { label: 'California', value: 'California' },
            // Add more states as needed
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select a state', value: null }}
        />
      </View>
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={(value) => setCity(value)}
          items={[
            { label: 'Bengaluru', value: 'Bengaluru' },
            { label: 'San Francisco', value: 'San Francisco' },
            // Add more cities as needed
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select a city', value: null }}
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Floor"
        value={floor}
        onChangeText={setFloor}
      />
      <TextInput
        style={styles.input}
        placeholder="Installation Year"
        value={installationYear}
        onChangeText={setInstallationYear}
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={loading}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f7',
    justifyContent: 'flex-start',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: 'center',
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
});

const pickerSelectStyles = {
  inputIOS: {
    color: 'black',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputAndroid: {
    color: 'black',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
};

export default Add;