import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from './contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import config from './config';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const buttonScale = useSharedValue(1);


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  useEffect(() => {
    const checkLogin = async () => {
      const storedData = await AsyncStorage.getItem('loginData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.token && parsedData.user && parsedData.session) {
          login(parsedData.user, parsedData.token, parsedData.session);
          router.push('/(tabs)');
        }
      }
    };
    checkLogin();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Login Failed', 'Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (data.token && data.user && data.session) {
        login(data.user, data.token, data.session);
        Alert.alert('Login Successful', 'Welcome back!');
        setTimeout(() => {
          router.push('/(tabs)');
        }, 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred.');
    }
  };

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo-exo.png')} style={styles.logo} />
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Image source={require('../assets/images/cisco_logo.webp')} style={styles.logo} />
        </View>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome Back.</Text>
          <Text style={styles.title}>Log In!</Text>
        </View>
        <View style={styles.inputContainer}>
          <Icon name="person" size={24} color="#3577f1" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={24} color="#3577f1" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={24} color="#3577f1" />
          </TouchableOpacity>
        </View>
        <View style={styles.optionsContainer}>
          <TouchableOpacity>
            {/* Add remember me or any other options here */}
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleLogin}>
          <Animated.View style={[styles.button, animatedStyle]}>
            <Text style={styles.buttonText}>Log in</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 0,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  forgotPassword: {
    color: '#3577f1',
  },
  button: {
    backgroundColor: '#3577f1',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
