import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

type ExtinguisherInfo = {
  id: number;
  // Add other relevant fields as needed
};

const ReplacementScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<
    'scanOriginal' | 'scanReplacement' | 'fillForm' | 'review'
  >('scanOriginal');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [originalExtinguisher, setOriginalExtinguisher] = useState<ExtinguisherInfo | null>(null);
  const [replacementExtinguisher, setReplacementExtinguisher] = useState<ExtinguisherInfo | null>(null);
  const [originalCondition, setOriginalCondition] = useState({
    cylinder_condition: '',
    hose_condition: '',
    stand_condition: '',
    full_weight: '',
    actual_weight: '',
  });
  const [replacementCondition, setReplacementCondition] = useState({
    cylinder_condition: '',
    hose_condition: '',
    stand_condition: '',
    full_weight: '',
    actual_weight: '',
  });
  const [notes, setNotes] = useState('');
  const router = useRouter();

  // Function to decrypt QR code data
  const decryptQRCode = async (data: string): Promise<ExtinguisherInfo | null> => {
    const splitData = data.split('/').pop();
    try {
      const response = await fetch('https://devcisco.zenapi.co.in/mobile/extinguisher/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData: splitData }),
      });

      if (response.ok) {
        const info = await response.json();
        return info.data;
      } else {
        Alert.alert('Error', 'Failed to decrypt QR code');
        return null;
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing the QR code');
      return null;
    }
  };

  // Updated handleBarCodeScanned to handle duplicate IDs during replacement scanning
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    const extinguisherInfo = await decryptQRCode(data);
    if (extinguisherInfo) {
      if (currentStep === 'scanOriginal') {
        setOriginalExtinguisher(extinguisherInfo);
        Alert.alert('Success', 'Original extinguisher QR code scanned successfully');
        setCameraOpen(false);
        setCurrentStep('scanReplacement');
      } else if (currentStep === 'scanReplacement') {
        // **Duplicate ID Check**
        if (originalExtinguisher && extinguisherInfo.id === originalExtinguisher.id) {
          Alert.alert('Error', 'Replacement extinguisher cannot be the same as the original.');
          setReplacementExtinguisher(null);
          setCameraOpen(false); // Close the scanner
          setScanned(false); // Reset scanned state
          // Current step remains 'scanReplacement' to show the scanning prompt again
          return;
        }
        setReplacementExtinguisher(extinguisherInfo);
        Alert.alert('Success', 'Replacement extinguisher QR code scanned successfully');
        setCameraOpen(false);
        setCurrentStep('fillForm');
      }
    }
  };

  // Handler for initiating scan
  const startScan = () => {
    setCameraOpen(true);
    setScanned(false);
  };

  // **Add Validation Function**
  const validateForm = (): boolean => {
    // Check Original Condition Fields
    for (const key in originalCondition) {
      const value = originalCondition[key as keyof typeof originalCondition];
      if (value.trim() === '') {
        Alert.alert('Error', 'Please fill all original condition fields.');
        return false;
      }
    }

    // Check Replacement Condition Fields
    for (const key in replacementCondition) {
      if (
        replacementCondition[key as keyof typeof replacementCondition].trim() === ''
      ) {
        Alert.alert('Error', 'Please fill all replacement condition fields.');
        return false;
      }
    }

    // Check Notes
    if (notes.trim() === '') {
      Alert.alert('Error', 'Please enter notes.');
      return false;
    }

    return true;
  };

  // Handler for form submission
  const handleSubmit = async () => {
    if (!originalExtinguisher || !replacementExtinguisher) {
      Alert.alert('Error', 'Both extinguishers must be scanned');
      return;
    }

    const payload = {
      originalExtinguisherId: originalExtinguisher.id,
      replacementExtinguisherId: replacementExtinguisher.id,
      originalCondition: {
        ...originalCondition,
        full_weight: parseFloat(originalCondition.full_weight),
        actual_weight: parseFloat(originalCondition.actual_weight),
      },
      replacementCondition: {
        ...replacementCondition,
        full_weight: parseFloat(replacementCondition.full_weight),
        actual_weight: parseFloat(replacementCondition.actual_weight),
      },
      notes,
    };

    try {
      const userData = await AsyncStorage.getItem('loginData');
      const token = userData ? JSON.parse(userData).token : '';

      const response = await fetch(`${config.apiUrl}/mobile/extinguisher/replace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Success', 'Replacement recorded successfully');
        router.navigate('/');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to record replacement');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Render the QR Code Scanner with Overlay
  const renderScanner = () => (
    <View style={styles.scannerContainer}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.cameraView}
      />
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>Align the QR code within the box</Text>
        </View>
        <View style={styles.middleOverlay}>
          <View style={styles.sideOverlay} />
          <View style={styles.qrBox} />
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.instructionText}>Place the QR code here</Text>
        </View>
      </View>
    </View>
  );

  // Render the condition input form
  const renderForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.formContainer}
    >
      <ScrollView contentContainerStyle={styles.formContent}>
        <Text style={styles.label}>Original Condition</Text>
        <TextInput
          placeholder="Cylinder Condition"
          value={originalCondition.cylinder_condition}
          onChangeText={(text) =>
            setOriginalCondition({ ...originalCondition, cylinder_condition: text })
          }
          style={styles.input}
        />
        <TextInput
          placeholder="Hose Condition"
          value={originalCondition.hose_condition}
          onChangeText={(text) =>
            setOriginalCondition({ ...originalCondition, hose_condition: text })
          }
          style={styles.input}
        />
        <TextInput
          placeholder="Stand Condition"
          value={originalCondition.stand_condition}
          onChangeText={(text) =>
            setOriginalCondition({ ...originalCondition, stand_condition: text })
          }
          style={styles.input}
        />
        <TextInput
          placeholder="Full Weight (kg)"
          value={originalCondition.full_weight}
          onChangeText={(text) =>
            setOriginalCondition({ ...originalCondition, full_weight: text })
          }
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Actual Weight (kg)"
          value={originalCondition.actual_weight}
          onChangeText={(text) =>
            setOriginalCondition({ ...originalCondition, actual_weight: text })
          }
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Replacement Condition</Text>
        <TextInput
          placeholder="Cylinder Condition"
          value={replacementCondition.cylinder_condition}
          onChangeText={(text) =>
            setReplacementCondition({ ...replacementCondition, cylinder_condition: text })
          }
          style={styles.input}
        />
        <TextInput
          placeholder="Hose Condition"
          value={replacementCondition.hose_condition}
          onChangeText={(text) =>
            setReplacementCondition({ ...replacementCondition, hose_condition: text })
          }
          style={styles.input}
        />
        <TextInput
          placeholder="Stand Condition"
          value={replacementCondition.stand_condition}
          onChangeText={(text) =>
            setReplacementCondition({ ...replacementCondition, stand_condition: text })
          }
          style={styles.input}
        />
        <TextInput
          placeholder="Full Weight (kg)"
          value={replacementCondition.full_weight}
          onChangeText={(text) =>
            setReplacementCondition({ ...replacementCondition, full_weight: text })
          }
          style={styles.input}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Actual Weight (kg)"
          value={replacementCondition.actual_weight}
          onChangeText={(text) =>
            setReplacementCondition({ ...replacementCondition, actual_weight: text })
          }
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          placeholder="Enter notes here"
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
        />

        {/* **Review Submission Button** */}
        <TouchableOpacity
          onPress={() => {
            if (validateForm()) {
              setCurrentStep('review');
            }
          }}
          style={styles.reviewButton}
        >
          <Text style={styles.reviewButtonText}>Review Submission</Text>
        </TouchableOpacity>

        {/* **Back to Replacement Scanning Button (Conditionally Rendered)** */}
        {!cameraOpen && (
          <TouchableOpacity
            onPress={() => setCurrentStep('scanReplacement')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Replacement Scan</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Render the review screen
  const renderReview = () => (
    <ScrollView contentContainerStyle={styles.reviewContainer}>
      <Text style={styles.reviewTitle}>Review Replacement Details</Text>
      <Text style={styles.reviewSubtitle}>Original Condition:</Text>
      <Text style={styles.reviewText}>Cylinder Condition: {originalCondition.cylinder_condition}</Text>
      <Text style={styles.reviewText}>Hose Condition: {originalCondition.hose_condition}</Text>
      <Text style={styles.reviewText}>Stand Condition: {originalCondition.stand_condition}</Text>
      <Text style={styles.reviewText}>Full Weight: {originalCondition.full_weight} kg</Text>
      <Text style={styles.reviewText}>Actual Weight: {originalCondition.actual_weight} kg</Text>

      <Text style={styles.reviewSubtitle}>Replacement Condition:</Text>
      <Text style={styles.reviewText}>Cylinder Condition: {replacementCondition.cylinder_condition}</Text>
      <Text style={styles.reviewText}>Hose Condition: {replacementCondition.hose_condition}</Text>
      <Text style={styles.reviewText}>Stand Condition: {replacementCondition.stand_condition}</Text>
      <Text style={styles.reviewText}>Full Weight: {replacementCondition.full_weight} kg</Text>
      <Text style={styles.reviewText}>Actual Weight: {replacementCondition.actual_weight} kg</Text>

      <Text style={styles.reviewSubtitle}>Notes:</Text>
      <Text style={styles.reviewText}>{notes}</Text>

      <View style={styles.reviewButtonsContainer}>
        <TouchableOpacity
          onPress={() => setCurrentStep('fillForm')}
          style={styles.modifyButton}
        >
          <Text style={styles.modifyButtonText}>Modify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>Submit Replacement</Text>
        </TouchableOpacity>
      </View>

      {/* **Navigation Buttons (Conditionally Rendered)** */}
      {!cameraOpen && (
        <View style={styles.navigationButtonsContainer}>
          <TouchableOpacity
            onPress={() => setCurrentStep('scanOriginal')}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>Back to Original Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentStep('scanReplacement')}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>Back to Replacement Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* **Scan Again Button (Conditionally Rendered)** */}
      {!cameraOpen && (
        <TouchableOpacity
          onPress={() => {
            setCurrentStep('scanOriginal');
            setOriginalExtinguisher(null);
            setReplacementExtinguisher(null);
            setOriginalCondition({
              cylinder_condition: '',
              hose_condition: '',
              stand_condition: '',
              full_weight: '',
              actual_weight: '',
            });
            setReplacementCondition({
              cylinder_condition: '',
              hose_condition: '',
              stand_condition: '',
              full_weight: '',
              actual_weight: '',
            });
            setNotes('');
          }}
          style={styles.scanAgainButton}
        >
          <Text style={styles.scanAgainButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // Render the main content based on the current step
  const renderContent = () => {
    switch (currentStep) {
      case 'scanOriginal':
        return (
          <View style={styles.scannerContainer}>
            <Text style={styles.instructions}>Scan Original Extinguisher QR Code</Text>
            <TouchableOpacity onPress={startScan} style={styles.scanButton}>
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
            {cameraOpen && renderScanner()}
          </View>
        );
      case 'scanReplacement':
        return (
          <View style={styles.scannerContainer}>
            <Text style={styles.instructions}>Scan Replacement Extinguisher QR Code</Text>
            <TouchableOpacity onPress={startScan} style={styles.scanButton}>
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
            {cameraOpen && renderScanner()}

            {/* **Back to Original Scanning Button (Conditionally Rendered)** */}
            {!cameraOpen && (
              <TouchableOpacity
                onPress={() => setCurrentStep('scanOriginal')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Back to Original Scan</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'fillForm':
        return renderForm();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const { width } = Dimensions.get('window');
const QR_BOX_SIZE = width * 0.6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  instructions: {
    fontSize: 18,
    marginVertical: 20,
    color: '#333',
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 25,
    marginBottom: 20,
    width: '60%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
    width: '40%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formContent: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  reviewContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f7f7f7',
  },
  reviewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewSection: {
    fontSize: 16,
    marginBottom: 10,
  },
  reviewSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 16,
    marginBottom: 5,
  },
  reviewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  modifyButton: {
    backgroundColor: '#ffc107',
    padding: 15,
    borderRadius: 25,
    flex: 0.45,
    alignItems: 'center',
  },
  modifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 25,
    flex: 0.45,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanAgainButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    alignSelf: 'center',
    width: '60%',
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  navButton: {
    backgroundColor: '#17a2b8',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  reviewButton: {
    backgroundColor: '#17a2b8',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
    alignSelf: 'center',
    width: '60%',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Overlay Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 50,
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 50,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
  },
  middleOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideOverlay: {
    width: (width - QR_BOX_SIZE) / 2,
    height: QR_BOX_SIZE,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  qrBox: {
    width: QR_BOX_SIZE,
    height: QR_BOX_SIZE,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 10,
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default ReplacementScreen;