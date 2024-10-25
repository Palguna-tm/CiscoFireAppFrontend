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
import Svg, { Path } from 'react-native-svg';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const iconScale = useSharedValue(1);
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);
  const [projectID, setProjectID] = useState<number | null>(null);

  const fetchProjectID = async () => {
    const userData = await AsyncStorage.getItem('loginData');
    if (userData) {
      const { Project_ID } = JSON.parse(userData);
      setProjectID(Project_ID);
    }
  };

  useEffect(() => {
    fetchProjectID();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");
      await AsyncStorage.removeItem('loginData');
      console.log("User data removed, redirecting to login page...");
      router.replace('./index');
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
        name="Report"
        options={{
          title: 'Report',
          tabBarIcon: ({ focused }) => (
            <Icon
              name="insert-chart"
              size={24}
              color={focused ? 'white' : 'white'}
            />
          ),
        }}
      />
       <Tabs.Screen
        name="Search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'search' : 'search-outline'} color="white" />
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
        name="Add"
        options={{
          title: 'Add',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'add-circle' : 'add-circle-outline'} color="white" />
          ),
        }}
      />
 
      <Tabs.Screen
        name="Update"
        options={{
          title: 'Update',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'sync' : 'sync-outline'} color="white" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#000',
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
