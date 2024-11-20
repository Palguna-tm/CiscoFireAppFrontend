import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, TouchableOpacity, Animated, Alert, ScrollView, Easing, Linking } from 'react-native';
import { CameraView, Camera } from "expo-camera"
import { MaterialIcons } from '@expo/vector-icons';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';



export default function HomeScreen() {
  const router = useRouter();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [greeting, setGreeting] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [extinguisherInfo, setExtinguisherInfo] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('location');
  const animatedValue = new Animated.Value(0);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
    })();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await AsyncStorage.getItem('loginData');
      if (userData) {
        const { user } = JSON.parse(userData);
        setUserRole(user.role);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good Morning 🌞');
    } else if (hours < 18) {
      setGreeting('Good Afternoon ☀️');
    } else {
      setGreeting('Good Evening 🌜');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (cameraOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear, // Now this will work
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear, // Now this will work
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [cameraOpen]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setCameraOpen(false);
    
    const splitData = data.split('/').pop();
    try {
      const response = await fetch(`${config.apiUrl}/mobile/extinguisher/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData: splitData }),
      });

      if (response.ok) {
        const info = await response.json();
        console.log(info.data);
        setExtinguisherInfo(info.data);
        const url = `https://www.google.com/maps/search/?api=1&query=${info.data.latitude},${info.data.longitude}`;
        setGoogleMapsUrl(url);
      } else {
        Alert.alert('Error', 'Failed to decrypt QR code');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing the QR code');
    }
  };

  const handleScanQRCodePress = () => {
    setScanned(false);
    setCameraOpen(true);
    setExtinguisherInfo(null);
    setGoogleMapsUrl(null);
  };

  const openAddExtinguisherModal = () => {
    router.push('/modal/add-extinguisher');
  };

  const renderTabContent = () => {
    if (activeTab === 'location') {
      return (
        <View style={modernStyles.tabContent}>
          {/* Location Overview Card */}
          <View style={modernStyles.overviewCard}>
            <View style={modernStyles.overviewHeader}>
              <MaterialIcons name="location-on" size={28} color="#4A00E0" />
              <Text style={modernStyles.overviewTitle}>Primary Location</Text>
            </View>
            <View style={modernStyles.overviewContent}>
              <Text style={modernStyles.locationText}>{extinguisherInfo.location}</Text>
              <Text style={modernStyles.subLocationText}>
                {extinguisherInfo.block} • {extinguisherInfo.area} • Floor {extinguisherInfo.floor}
              </Text>
            </View>
          </View>

          {/* Location Grid */}
          <View style={modernStyles.gridContainer}>
            <View style={modernStyles.gridItem}>
              <View style={[modernStyles.iconBadge, { backgroundColor: '#F0F4FF' }]}>
                <MaterialIcons name="public" size={22} color="#4A00E0" />
              </View>
              <Text style={modernStyles.gridLabel}>Country</Text>
              <Text style={modernStyles.gridValue}>{extinguisherInfo.country}</Text>
            </View>

            <View style={modernStyles.gridItem}>
              <View style={[modernStyles.iconBadge, { backgroundColor: '#FFF0F0' }]}>
                <MaterialIcons name="flag" size={22} color="#E04A00" />
              </View>
              <Text style={modernStyles.gridLabel}>State</Text>
              <Text style={modernStyles.gridValue}>{extinguisherInfo.state}</Text>
            </View>

            <View style={modernStyles.gridItem}>
              <View style={[modernStyles.iconBadge, { backgroundColor: '#F0FFF4' }]}>
                <MaterialIcons name="location-city" size={22} color="#00E04A" />
              </View>
              <Text style={modernStyles.gridLabel}>City</Text>
              <Text style={modernStyles.gridValue}>{extinguisherInfo.city}</Text>
            </View>
          </View>

          {/* Timeline Section */}
          <View style={modernStyles.timelineSection}>
            <Text style={modernStyles.sectionTitle}>Timeline</Text>
            <View style={modernStyles.timelineItem}>
              <View style={modernStyles.timelineDot} />
              <View style={modernStyles.timelineContent}>
                <Text style={modernStyles.timelineLabel}>Manufactured</Text>
                <Text style={modernStyles.timelineValue}>{extinguisherInfo.manufacture_year}</Text>
              </View>
            </View>
            <View style={modernStyles.timelineItem}>
              <View style={modernStyles.timelineDot} />
              <View style={modernStyles.timelineContent}>
                <Text style={modernStyles.timelineLabel}>Installed</Text>
                <Text style={modernStyles.timelineValue}>{extinguisherInfo.installation_year}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    } else if (activeTab === 'details') {
      return (
        <View style={modernStyles.tabContent}>
          {/* Status Card */}
          <View style={modernStyles.statusCard}>
            <View style={modernStyles.statusHeader}>
              <Text style={modernStyles.statusTitle}>Equipment Status</Text>
              <View style={[modernStyles.statusBadge, { backgroundColor: '#E8FFF3' }]}>
                <Text style={[modernStyles.statusText, { color: '#00B464' }]}>Active</Text>
              </View>
            </View>
            
            <View style={modernStyles.statusDetails}>
              <Text style={modernStyles.typeLabel}> Type / Capacity: {extinguisherInfo.type_capacity}</Text>
            </View>
          </View>

          {/* Weight Information */}
          <View style={modernStyles.weightContainer}>
            <View style={modernStyles.weightGauge}>
              <Text style={modernStyles.weightValue}>{extinguisherInfo.actual_weight}</Text>
              <Text style={modernStyles.weightUnit}>kg</Text>
              <Text style={modernStyles.weightLabel}>Current Weight</Text>
            </View>
            <View style={modernStyles.weightInfo}>
              <View style={modernStyles.weightMetric}>
                <Text style={modernStyles.metricLabel}>Full Weight</Text>
                <Text style={modernStyles.metricValue}>{extinguisherInfo.full_weight} kg</Text>
              </View>
              <View style={modernStyles.weightMetric}>
                <Text style={modernStyles.metricLabel}>Weight Status</Text>
                <View style={modernStyles.statusIndicator}>
                  <MaterialIcons name="check-circle" size={16} color="#00B464" />
                  <Text style={modernStyles.statusIndicatorText}>Normal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Condition Cards */}
          <View style={modernStyles.conditionGrid}>
            <View style={modernStyles.conditionCard}>
              <MaterialIcons name="check-circle" size={24} color="#00B464" />
              <Text style={modernStyles.conditionLabel}>Cylinder</Text>
              <Text style={modernStyles.conditionValue}>{extinguisherInfo.cylinder_condition}</Text>
            </View>
            <View style={modernStyles.conditionCard}>
              <MaterialIcons name="check-circle" size={24} color="#00B464" />
              <Text style={modernStyles.conditionLabel}>Hose</Text>
              <Text style={modernStyles.conditionValue}>{extinguisherInfo.hose_condition}</Text>
            </View>
            <View style={modernStyles.conditionCard}>
              <MaterialIcons name="check-circle" size={24} color="#00B464" />
              <Text style={modernStyles.conditionLabel}>Stand</Text>
              <Text style={modernStyles.conditionValue}>{extinguisherInfo.stand_condition}</Text>
            </View>
          </View>

          {/* Service Schedule */}
          <View style={modernStyles.scheduleCard}>
            <Text style={modernStyles.scheduleTitle}>Maintenance Schedule</Text>
            <View style={modernStyles.scheduleGrid}>
              <View style={modernStyles.scheduleItem}>
                <Text style={modernStyles.scheduleLabel}>Next Service</Text>
                <Text style={modernStyles.scheduleDate}>
                  {new Date(extinguisherInfo.next_service_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={modernStyles.scheduleItem}>
                <Text style={modernStyles.scheduleLabel}>Next Refill</Text>
                <Text style={modernStyles.scheduleDate}>
                  {new Date(extinguisherInfo.next_refill_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  const openInGoogleMaps = () => {
    if (!extinguisherInfo?.latitude || !extinguisherInfo?.longitude) return;
    
    const url = `https://www.google.com/maps/search/?api=1&query=${extinguisherInfo.latitude},${extinguisherInfo.longitude}`;
    Linking.openURL(url).catch((err) => Alert.alert('Error', 'Could not open Google Maps'));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Requesting for camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={modernStyles.headerSection}>
          <View style={modernStyles.greetingWrapper}>
            <Text style={modernStyles.greetingLabel}>Welcome Back</Text>
            <Text style={modernStyles.greetingText}>{greeting}</Text>
          </View>

          <View style={modernStyles.actionButtons}>
            {userRole === 'admin' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#4A00E0' }]} 
                onPress={openAddExtinguisherModal}
              >
                <LinearGradient
                  colors={['#4A00E0', '#8E2DE2']}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.actionButtonGradient}
                >
                  <MaterialIcons name="add-circle-outline" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Add Extinguisher</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#00B4DB' }]}
              onPress={handleScanQRCodePress}
            >
              <LinearGradient
                colors={['#00B4DB', '#0083B0']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="qr-code-scanner" size={24} color="white" />
                <Text style={styles.actionButtonText}>Scan QR</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {cameraOpen && (
          <View style={styles.cameraContainer}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.futuristicOutline}>
              <Text style={styles.guidanceText}>Align QR code within the frame</Text>
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Back" onPress={() => setCameraOpen(false)} color="#841584" />
            </View>
          </View>
        )}

        {extinguisherInfo && (
          <View style={styles.card}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'location' && styles.activeTab]}
                onPress={() => setActiveTab('location')}
              >
                <Text style={styles.tabText}>Location Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
                onPress={() => setActiveTab('details')}
              >
                <Text style={styles.tabText}>Extinguisher Details</Text>
              </TouchableOpacity>
            </View>
            {renderTabContent()}
          </View>
        )}

        {extinguisherInfo && (
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={openInGoogleMaps}
          >
            <LinearGradient
              colors={['#4A00E0', '#8E2DE2']}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.mapButtonGradient}
            >
              <MaterialIcons name="map" size={24} color="white" />
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const modernStyles = StyleSheet.create({
  headerSection: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  greetingWrapper: {
    marginBottom: 24,
  },
  greetingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 20,
    marginBottom: 10,
  },
  tabContent: {
    padding: 16,
    gap: 20,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  overviewContent: {
    gap: 8,
  },
  locationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subLocationText: {
    fontSize: 16,
    color: '#666',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  gridItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weightContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  weightGauge: {
    alignItems: 'center',
    flex: 1,
  },
  weightValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  conditionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  scheduleItem: {
    flex: 1,
  },
  // Add other necessary styles...

  // Timeline styles
  timelineSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A00E0',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666',
  },
  timelineValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  // Status styles
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusDetails: {
    marginTop: 12,
  },
  typeLabel: {
    fontSize: 16,
    color: '#666',
  },

  // Weight styles
  weightUnit: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  weightLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  weightInfo: {
    flex: 1,
    gap: 16,
  },
  weightMetric: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicatorText: {
    fontSize: 14,
    color: '#00B464',
    fontWeight: '500',
  },

  // Condition styles
  conditionLabel: {
    fontSize: 14,
    color: '#666',
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  // Schedule styles
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  container: {
    flex: 1,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  futuristicOutline: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 0, 0.9)',
    borderRadius: 15,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidanceText: {
    position: 'absolute',
    bottom: -30,
    color: 'rgba(0, 255, 0, 1)',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 15,
  },
  infoGroup: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weightCard: {
    flexDirection: 'column',
    gap: 12,
  },
  weightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  mapContainer: {
    width: '95%',
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 5,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
  },
  mapButton: {
    width: '90%',
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});