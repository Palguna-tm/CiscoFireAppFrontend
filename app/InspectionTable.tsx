import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await AsyncStorage.getItem('loginData');
      if (userData) {
        const { user } = JSON.parse(userData);
        setUserRole(user.role);
        setUserPermissions(user.permissions);
      }
    };

    fetchUserData();
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const userData = await AsyncStorage.getItem('loginData');
      let token = '';
  
      if (userData) {
        const parsedData = JSON.parse(userData);
        token = parsedData.token; // Assuming token is stored in loginData as `token`
      }
  
      const response = await fetch('http://192.168.0.52:7001/inspection/28/inspections', {
        headers: {
          'Authorization': `Bearer ${token}`, // Add Bearer token here
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        setInspections(data.inspections);
      } else {
        console.error('Error fetching inspections:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ScrollView horizontal>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>Date</Text>
          <Text style={styles.headerCell}>Inspector</Text>
          <Text style={styles.headerCell}>Notes</Text>
          <Text style={styles.headerCell}>Status</Text>
          <Text style={styles.headerCell}>Next Date</Text>
          <Text style={styles.headerCell}>Photo</Text>
          <Text style={styles.headerCell}>Approval Status</Text>
        </View>
        <FlatList
          data={inspections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.cell}>{new Date(item.inspection_date).toLocaleDateString()}</Text>
              <Text style={styles.cell}>{item.inspector_name}</Text>
              <Text style={styles.cell}>{item.notes}</Text>
              <Text style={styles.cell}>{item.status}</Text>
              <Text style={styles.cell}>{new Date(item.next_inspection_date).toLocaleDateString()}</Text>
              {item.photos.length > 0 ? (
                <Image
                  style={styles.photo}
                  source={{ uri: `http://192.168.0.52:7001${item.photos[0]}` }}
                />
              ) : (
                <Text style={styles.cell}>No Photo</Text>
              )}
              <Text
                style={[
                  styles.cell,
                  styles.approvalStatus,
                  { color: item.approval_status === 'approved' ? 'green' : 'red' }
                ]}
              >
                {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
              </Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCell: {
    width: 120,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    color: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cell: {
    width: 120,
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  approvalStatus: {
    width: 120,
    textAlign: 'center',
  },
});

export default InspectionTable;
