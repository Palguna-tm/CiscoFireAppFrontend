// app/components/ProtectedScreen.tsx
import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface ProtectedScreenProps {
  children: React.ReactNode;
  requiredRole: string;
}

const ProtectedScreen = ({ children, requiredRole }: ProtectedScreenProps) => {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        Alert.alert('Access Denied', 'You need to log in to access this screen.');
        router.replace('/');
      } else if (user.role !== requiredRole.toLowerCase()) {
        Alert.alert('Access Denied', 'You do not have permission to access this screen.');
        router.back();
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (user && user.role === requiredRole.toLowerCase()) {
    return <>{children}</>;
  }

  return null;
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProtectedScreen;