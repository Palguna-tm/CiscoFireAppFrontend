import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Animated } from 'react-native';
import config from '../config';

const UpdateDetails = () => {
  const [location, setLocation] = useState('');
  const [block, setBlock] = useState('');
  const [cylinderCondition, setCylinderCondition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [greeting, setGreeting] = useState('');

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

  const handleUpdate = async () => {
    if (!location || !block || !cylinderCondition || !remarks) {
      Alert.alert('Error', 'All fields must be filled');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.0.127:7000/extinguisher/4', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          block,
          cylinder_condition: cylinderCondition,
          remarks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Extinguisher updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update extinguisher');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
        {greeting}
      </Animated.Text>
      <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
        Update Fire Extinguisher Details
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
        placeholder="Cylinder Condition"
        value={cylinderCondition}
        onChangeText={setCylinderCondition}
      />
      <TextInput
        style={styles.input}
        placeholder="Remarks"
        value={remarks}
        onChangeText={setRemarks}
      />
      <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
        <Text style={styles.buttonText}>Update</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

export default UpdateDetails;