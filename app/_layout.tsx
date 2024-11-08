import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const logoOpacity = useSharedValue(0);
  const [currentLogo, setCurrentLogo] = useState(0);
  const logos = [
    require('../assets/images/logo-exo.png'),
    require('../assets/images/logo.png'),
    require('../assets/images/cisco_logo.webp'),
  ];

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const animateLogos = async () => {
      while (true) {
        logoOpacity.value = withSpring(1);
        await new Promise(resolve => setTimeout(resolve, 15000)); // Display for 15 seconds
        logoOpacity.value = withSpring(0);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for fade out

        setCurrentLogo((prevLogo) => (prevLogo + 1) % logos.length);
      }
    };

    animateLogos();
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  if (!loaded) {
    return null;
  }

  return (
   
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#3577f1' },
          headerTitle: () => (
            <View style={styles.logoContainer}>
              <Animated.Image
                source={logos[currentLogo]}
                style={[styles.logo, animatedLogoStyle]}
              />
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(login)" options={{ headerShown: false }} />
        <Stack.Screen name="Notifications" options={{ headerShown: true }} />
        <Stack.Screen name="InspectionDetails" options={{ headerShown: true }} />
      </Stack>
    
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
  },
  logo: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
  },
});


