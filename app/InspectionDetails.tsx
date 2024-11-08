import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, RefreshControl, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import config from './config';

type Inspection = {
  id: number;
  inspection_date: string;
  inspector_name: string;
  notes: string;
  status: string;
  next_inspection_date: string;
  photos: string[];
  approval_status: string;
};

const InspectionTable = () => {
  const { extinguisherid } = useLocalSearchParams();
  const extinguisherIdNumber = Number(extinguisherid);
  
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      const userData = await AsyncStorage.getItem('loginData');
      let token = '';
  
      if (userData) {
        const parsedData = JSON.parse(userData);
        token = parsedData.token;
      }
  
      const response = await fetch(`${config.apiUrl}/mobile/inspection/${extinguisherIdNumber}/inspections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        const sortedInspections = data.inspections.sort((a: Inspection, b: Inspection) => 
          new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
        );
        setInspections(sortedInspections);
      } else {
        console.error('Error fetching inspections:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInspections();
  }, []);

  const openPhotoModal = (photoUri: string) => {
    setSelectedPhoto(photoUri);
    setModalVisible(true);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setModalVisible(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        {inspections.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Inspection on {new Date(item.inspection_date).toLocaleDateString()}</Text>
              <Text style={styles.cardSubtitle}>By {item.inspector_name}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}><Text style={styles.bold}>Notes:</Text> {item.notes}</Text>
              <Text style={styles.cardText}><Text style={styles.bold}>Status:</Text> {item.status}</Text>
              <Text style={styles.cardText}><Text style={styles.bold}>Next Inspection:</Text> {new Date(item.next_inspection_date).toLocaleDateString()}</Text>
              {item.photos.length > 0 ? (
                <TouchableOpacity onPress={() => openPhotoModal(`${config.apiUrl}${item.photos[0]}`)}>
                  <Image
                    style={styles.photo}
                    source={{
                      uri: `${config.apiUrl}${item.photos[0]}`,
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <Text style={styles.cardText}>No Photo</Text>
              )}
              <Text
                style={[
                  styles.cardText,
                  { color: item.approval_status === 'approved' ? 'green' : 'red' }
                ]}
              >
                <Text style={styles.bold}>Approval Status:</Text> {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closePhotoModal}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              style={styles.fullSizePhoto}
              source={{ uri: selectedPhoto }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardContent: {
    marginTop: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullSizePhoto: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default InspectionTable;
