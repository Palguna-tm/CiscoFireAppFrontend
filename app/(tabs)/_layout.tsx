import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const iconScale = useSharedValue(1);
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);
  const [projectID, setProjectID] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const fetchUserData = async () => {
    const userData = await AsyncStorage.getItem('loginData');
    if (userData) {
      const { user } = JSON.parse(userData);
      setUserRole(user.role);
      setUserPermissions(user.permissions);
      setProjectID(user.project_id);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");
      await AsyncStorage.removeItem('loginData');
      console.log("User data removed, redirecting to login page...");
      router.replace('/LoginScreen');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn = () => {
    iconScale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    iconScale.value = withSpring(1);
    router.push('/');
  };

  return (
    
      
       
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: { backgroundColor: '#3577f1' },
        headerStyle: { backgroundColor: '#3577f1' },
        headerShown: true,
        tabBarLabelStyle: { color: 'white' },
        headerTitle: () => (
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo-exo.png')}
              style={styles.logo}
            />
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.notificationIcon}>
              <Animated.View style={animatedStyle}>
                <TabBarIcon name="notifications" color="white" />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
              <View style={styles.logoutButton}>
                <Icon name="power-settings-new" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        ),
      }}>

      <Tabs.Screen
        name="Inspection"
        options={{
          title: 'Inspection',
          tabBarIcon: ({ focused }) => (
            <Icon
              name="search"
              size={24}
              color={focused ? 'white' : 'white'}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color="white" />
          ),
        }}
      />
      <Tabs.Screen
        name="User"
        options={{
          title: 'User',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color="white" />
          ),
        }}
      />
       

    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#fff',
    padding: 0,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  logo: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
  },
  notificationIcon: {
    marginRight: 15,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    marginLeft: 15,
    marginRight: 15,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'red',
    borderRadius: 20,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
