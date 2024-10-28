import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Add = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [greeting, setGreeting] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

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

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userData = await AsyncStorage.getItem('loginData');
        if (userData) {
          const { user } = JSON.parse(userData);
          setUserInfo(user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [fadeAnim]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
        {greeting}
      </Animated.Text>
      <Animated.Text style={[styles.animatedText, { opacity: fadeAnim }]}>
        User Information
      </Animated.Text>
      {loading && <ActivityIndicator size="large" color="#007BFF" />}
      {userInfo && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.infoText}>Username: {userInfo.username}</Text>
          <Text style={styles.infoText}>Email: {userInfo.email}</Text>
          <Text style={styles.infoText}>Role: {userInfo.role}</Text>
          <Text style={styles.infoText}>Permissions: {userInfo.permissions.join(', ')}</Text>
        </View>
      )}
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
  userInfoContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
});

export default Add;
