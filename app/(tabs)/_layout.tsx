import React, { useContext, useEffect, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Image, Animated as RNAnimated, Alert } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

const logos = [
  require('../../assets/images/logo-exo.png'),
  require('../../assets/images/logo.png'),
  require('../../assets/images/cisco_logo.webp'),
];

const AnimatedLogo = () => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % logos.length);
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={styles.logoContainer}>
      <RNAnimated.Image
        source={logos[currentLogoIndex]}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handlePressIn = () => {
    // Optional: Add any press-in animations or effects here
  };

  const handlePressOut = async () => {
    try {
      await logout();
      router.replace('/login' ); // Redirect to LoginScreen after logout
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: { backgroundColor: '#3577f1' },
        headerStyle: { backgroundColor: '#3577f1' },
        headerShown: true,
        tabBarLabelStyle: { color: 'white' },
        headerTitle: () => <AnimatedLogo />,
        
      }}
    >
      <Tabs.Screen
        name="Inspection"
        redirect={user?.role === 'replacer'}
        options={{
          title: 'Inspections',
          tabBarIcon: ({ focused }) => (
            <Icon name="search" size={24} color={focused ? 'white' : 'white'} />
          ),
        }}
      />
      <Tabs.Screen
        name="replacement"
        redirect={user?.role === 'inspector' || user?.role === 'admin'}
        options={{
          title: 'Replacement',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="refresh" color={focused ? 'white' : 'white'} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" color={focused ? 'white' : 'white'} />
          ),
        }}
      />
      
      {/* Tabs Exclusive to Admins */}
      
        <Tabs.Screen
          
          name="User"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="person" color={focused ? 'white' : 'white'} />
            ),
          }}
        />
      
     
      {/* Add more role-based tabs as needed */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 80,
    height: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    marginLeft: 15,
    marginRight: 15,
  },
});
