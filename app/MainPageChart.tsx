import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

const fetchDataFromAPI = async (): Promise<{ [key: string]: number }> => {
  const userData = await AsyncStorage.getItem('loginData');
  if (!userData) {
    console.error('User data not found');
    return {};
  }

  const { ID: userID, Project_ID: projectID } = JSON.parse(userData);

  const response = await fetch(`http://zenapi.co.in:3000/mobile/deviceconsumption?UserID=${userID}&ProjectID=${projectID}`);
  const data = await response.json();
  const aggregatedData: { [key: string]: number } = {};

  data.forEach((device: any) => {
    Object.entries(device.datewise_consumption).forEach(([date, consumption]) => {
      const consumptionValue = parseFloat(consumption as string);
      if (!aggregatedData[date]) aggregatedData[date] = 0;
      aggregatedData[date] += consumptionValue;
    });
  });

  return aggregatedData;
};

export default function MainPageChart() {
  const [data, setData] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      const apiData = await fetchDataFromAPI();
      setData(apiData);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ThemedView style={styles.container}>
      <View>
        {/* You can add any other UI components here */}
        <TouchableOpacity onPress={() => Alert.alert('Data Loaded', 'Data has been successfully loaded.')}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Show Data</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    backgroundColor: '#3577f1',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
