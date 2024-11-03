import React from 'react';
import { View, TextInput, Button, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddExtinguisherScreen() {
  const router = useRouter();

  const handleAddExtinguisher = () => {
    // Logic to handle adding extinguisher
  };

  return (
    <View style={styles.addFormContainer}>
      <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Location"
      
      />
      <Button title="Submit" onPress={handleAddExtinguisher} />
    </View>
  );
}

const styles = StyleSheet.create({
  addFormContainer: {
    flex: 1,
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
  backButtonText: {
    color: '#007BFF',
    marginBottom: 20,
    fontSize: 16,
  },
});

