import React, { useReducer, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import { Country, State, City } from 'country-state-city';
import { 
  TextInput, 
  Button, 
  Title, 
  Snackbar 
} from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Location from 'expo-location';

// Define form state and actions
type FormState = {
  location: string;
  block: string;
  area: string;
  type_capacity: string;
  manufacture_year: string;
  installation_year: string;
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  city: string;
  floor: string;
};

type Action =
  | { type: 'UPDATE_FIELD'; field: keyof FormState; value: string }
  | { type: 'RESET' };

const initialFormState: FormState = {
  location: '',
  block: '',
  area: '',
  type_capacity: '',
  manufacture_year: '',
  installation_year: '',
  latitude: 0,
  longitude: 0,
  country: '',
  state: '',
  city: '',
  floor: '',
};

// Reducer for form state management
const formReducer = (state: FormState, action: Action): FormState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return initialFormState;
    default:
      return state;
  }
};

export default function AddExtinguisherModal() {
  const router = useRouter();
  const [formData, dispatch] = useReducer(formReducer, initialFormState);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: (currentYear - i).toString(),
  }));

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = selectedState && selectedCountry ? City.getCitiesOfState(selectedCountry, selectedState) : [];

  const [openDropdowns, setOpenDropdowns] = useState({
    manufactureYear: false,
    installationYear: false,
    country: false,
    state: false,
    city: false,
  });

  const handleInputChange = (field: keyof FormState, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    handleInputChange('country', value);
    handleInputChange('state', '');
    handleInputChange('city', '');
    setSelectedState('');
    setSelectedCity('');
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    handleInputChange('state', value);
    handleInputChange('city', '');
    setSelectedCity('');
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    handleInputChange('city', value);
  };

  const validateFormData = (): boolean => {
    const requiredFields: (keyof FormState)[] = [
      'location',
      'block',
      'area',
      'type_capacity',
      'manufacture_year',
      'country',
      'state',
      'city',
      'floor',
      'installation_year',
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => {
        switch (field) {
          case 'type_capacity':
            return 'Type/Capacity';
          case 'manufacture_year':
            return 'Manufacture Year';
          case 'installation_year':
            return 'Installation Year';
          default:
            return field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
        }
      });
      setSnackbarMessage(`Missing fields: ${fieldNames.join(', ')}`);
      setVisible(true);
      return false;
    }

    if (isNaN(Number(formData.manufacture_year)) || isNaN(Number(formData.installation_year))) {
      setSnackbarMessage('Year fields must be numeric');
      setVisible(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateFormData()) {
      return;
    }

    try {
      const userData = await AsyncStorage.getItem('loginData');
      const token = userData ? JSON.parse(userData).token : '';

      const dataToSubmit = {
        ...formData,
        manufacture_year: parseInt(formData.manufacture_year) || null,
        installation_year: parseInt(formData.installation_year) || new Date().getFullYear(),
      };

      const response = await fetch(`${config.apiUrl}/mobile/extinguisher/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error === "Duplicate extinguisher entry"
          ? 'Duplicate extinguisher entry'
          : 'Failed to add extinguisher';
        setSnackbarMessage(errorMessage);
        setVisible(true);
      } else {
        const responseData = await response.json();
        console.log('Success:', responseData);
        setSnackbarMessage('Extinguisher added successfully');
        setVisible(true);
        dispatch({ type: 'RESET' });
        setSelectedCountry('');
        setSelectedState('');
        setSelectedCity('');
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('An unexpected error occurred');
      setVisible(true);
    }
  };

  useEffect(() => {
    const getLocation = async () => {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSnackbarMessage('Permission to access location was denied');
        setVisible(true);
        return;
      }

      // Get the current location
      const location = await Location.getCurrentPositionAsync({});
      handleInputChange('latitude', location.coords.latitude.toString());
      handleInputChange('longitude', location.coords.longitude.toString());
    };

    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.modalScrollContent}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Title style={styles.modalTitle}>Add Extinguisher</Title>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <TextInput
              label="Location"
              mode="outlined"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              style={styles.input}
              left={<TextInput.Icon icon="map-marker-outline" />}
              outlineStyle={styles.inputOutline}
              theme={{ colors: { primary: '#2563eb' } }}
            />
            
            <View style={styles.row}>
              <TextInput
                label="Block"
                mode="outlined"
                value={formData.block}
                onChangeText={(text) => handleInputChange('block', text)}
                style={[styles.input, styles.halfInput]}
                left={<TextInput.Icon icon="office-building" />}
                outlineStyle={styles.inputOutline}
                theme={{ colors: { primary: '#2563eb' } }}
              />
              
              <TextInput
                label="Floor"
                mode="outlined"
                value={formData.floor}
                onChangeText={(text) => handleInputChange('floor', text)}
                style={[styles.input, styles.halfInput]}
                left={<TextInput.Icon icon="stairs" />}
                outlineStyle={styles.inputOutline}
                theme={{ colors: { primary: '#2563eb' } }}
              />
            </View>

            <TextInput
              label="Area"
              mode="outlined"
              value={formData.area}
              onChangeText={(text) => handleInputChange('area', text)}
              style={styles.input}
              left={<TextInput.Icon icon="square-outline" />}
              outlineStyle={styles.inputOutline}
              theme={{ colors: { primary: '#2563eb' } }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extinguisher Details</Text>
            <TextInput
              label="Type/Capacity"
              mode="outlined"
              value={formData.type_capacity}
              onChangeText={(text) => handleInputChange('type_capacity', text)}
              style={styles.input}
              left={<TextInput.Icon icon="fire" />}
              outlineStyle={styles.inputOutline}
              theme={{ colors: { primary: '#2563eb' } }}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <DropdownPicker
                  label="Manufacture Year"
                  items={yearOptions}
                  value={formData.manufacture_year}
                  onChangeValue={(value) => handleInputChange('manufacture_year', value)}
                  placeholder="Manufacture Year"
                  open={openDropdowns.manufactureYear}
                  setOpen={() => setOpenDropdowns(prev => ({ ...prev, manufactureYear: !prev.manufactureYear }))}
                  zIndex={5000}
                />
              </View>
              <View style={styles.halfInput}>
                <DropdownPicker
                  label="Installation Year"
                  items={yearOptions}
                  value={formData.installation_year}
                  onChangeValue={(value) => handleInputChange('installation_year', value)}
                  placeholder="Installation Year"
                  open={openDropdowns.installationYear}
                  setOpen={() => setOpenDropdowns(prev => ({ ...prev, installationYear: !prev.installationYear }))}
                  zIndex={4000}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.dropdownSection}>
              <DropdownPicker
                label="Country"
                items={countries.map(country => ({
                  label: country.name,
                  value: country.isoCode,
                }))}
                value={selectedCountry}
                onChangeValue={handleCountryChange}
                placeholder="Select Country"
                searchable={true}
                open={openDropdowns.country}
                setOpen={() => setOpenDropdowns(prev => ({ ...prev, country: !prev.country }))}
                zIndex={3000}
              />
            </View>

            <View style={styles.dropdownSection}>
              <DropdownPicker
                label="State"
                items={states.map(state => ({
                  label: state.name,
                  value: state.isoCode,
                }))}
                value={selectedState}
                onChangeValue={handleStateChange}
                placeholder="Select State"
                searchable={true}
                disabled={!selectedCountry}
                open={openDropdowns.state}
                setOpen={() => setOpenDropdowns(prev => ({ ...prev, state: !prev.state }))}
                zIndex={2000}
              />
            </View>

            <View style={styles.dropdownSection}>
              <DropdownPicker
                label="City"
                items={cities.map(city => ({
                  label: city.name,
                  value: city.name,
                }))}
                value={selectedCity}
                onChangeValue={handleCityChange}
                placeholder="Select City"
                searchable={true}
                disabled={!selectedState}
                open={openDropdowns.city}
                setOpen={() => setOpenDropdowns(prev => ({ ...prev, city: !prev.city }))}
                zIndex={1000}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={handleSubmit} 
              style={styles.submitButton}
              icon="send"
              contentStyle={styles.buttonContent}
            >
              Submit
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => router.back()} 
              style={styles.cancelButton}
              icon="close"
              contentStyle={styles.buttonContent}
            >
              Cancel
            </Button>
          </View>
        </View>

        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={3000}
          action={{
            label: 'Close',
            onPress: () => setVisible(false),
          }}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAwareScrollView>
    </View>
  );
}

// DropdownPicker Component
const DropdownPicker = ({
  label,
  items,
  value,
  onChangeValue,
  placeholder,
  searchable = false,
  disabled = false,
  open,
  setOpen,
  zIndex = 1000,
}: {
  label: string;
  items: { label: string; value: string }[];
  value: string;
  onChangeValue: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
  disabled?: boolean;
  open: boolean;
  setOpen: () => void;
  zIndex?: number;
}) => {
  return (
    <View style={{ zIndex, marginBottom: 15 }}>
      <DropDownPicker
        open={open}
        setOpen={setOpen}
        items={items}
        value={value}
        setValue={(callback) => onChangeValue(callback(value))}
        onSelectItem={(item) => onChangeValue(item.value ?? '')}
        placeholder={placeholder}
        searchable={searchable}
        searchPlaceholder="Search..."
        disabled={disabled}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        listMode="MODAL"
        modalProps={{
          animationType: "slide",
        }}
        modalTitle={label}
        showTickIcon={true}
        maxHeight={300}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalScrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1f2937',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    height: 50,
  },
  dropdownContainer: {
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  cancelButton: {
    borderColor: '#2563eb',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: '#1f2937',
  },
  dropdownSection: {
    marginBottom: 16,
    zIndex: 1000,
  },
});