import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import { fishRecognition, FishIdentificationResult } from '../services/fishRecognition';

const { width } = Dimensions.get('window');

interface FishCameraProps {
  onSpeciesDetected: (species: string, confidence: number, details?: any) => void;
  onCancel: () => void;
  visible: boolean;
  style?: any;
}

const FishCamera: React.FC<FishCameraProps> = ({
  onSpeciesDetected,
  onCancel,
  visible,
  style
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<FishIdentificationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleTakePhoto = async () => {
    try {
      console.log('📸 FishCamera: Starting photo capture...');
      setIsAnalyzing(true);
      
      // Capture photo using our fish recognition service
      const imageUri = await fishRecognition.capturePhoto();
      
      if (imageUri) {
        console.log('📸 FishCamera: Photo captured, starting analysis...');
        setCapturedImage(imageUri);
        
        // Analyze the fish
        const result = await fishRecognition.identifyFish(imageUri);
        console.log('🐟 FishCamera: Analysis result:', result);
        
        if (result) {
          setIdentificationResult(result);
          setShowResults(true);
        } else {
          Alert.alert(
            'No Fish Detected',
            'Could not identify any fish in the image. Please try again with a clearer photo.',
            [
              { text: 'Retry', onPress: () => setIsAnalyzing(false) },
              { text: 'Cancel', onPress: handleCancel }
            ]
          );
        }
      } else {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('🚨 FishCamera: Photo capture error:', error);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      console.log('🖼️ FishCamera: Starting gallery pick...');
      setIsAnalyzing(true);
      
      const imageUri = await fishRecognition.pickFromGallery();
      
      if (imageUri) {
        console.log('🖼️ FishCamera: Image selected, starting analysis...');
        setCapturedImage(imageUri);
        
        const result = await fishRecognition.identifyFish(imageUri);
        console.log('🐟 FishCamera: Analysis result:', result);
        
        if (result) {
          setIdentificationResult(result);
          setShowResults(true);
        } else {
          Alert.alert('No Fish Detected', 'Could not identify any fish in the image.');
          setIsAnalyzing(false);
        }
      } else {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('🚨 FishCamera: Gallery error:', error);
      Alert.alert('Gallery Error', 'Failed to select image.');
      setIsAnalyzing(false);
    }
  };

  const confirmDetectedSpecies = () => {
    if (identificationResult) {
      console.log('✅ FishCamera: Confirming detected species:', identificationResult.species.name);
      onSpeciesDetected(
        identificationResult.species.name, 
        identificationResult.confidence,
        identificationResult
      );
      resetCamera();
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setIdentificationResult(null);
    setShowResults(false);
    setIsAnalyzing(false);
  };

  const handleCancel = () => {
    resetCamera();
    onCancel();
  };

  const renderCameraInterface = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🐟 AI Fish Recognition</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>📸 Capture Fish Photo</Text>
        <Text style={styles.instructionText}>
          Take a clear photo of the fish to identify the species automatically
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cameraButton]} 
          onPress={handleTakePhoto}
          disabled={isAnalyzing}
        >
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.galleryButton]} 
          onPress={handlePickFromGallery}
          disabled={isAnalyzing}
        >
          <Ionicons name="images" size={32} color="#fff" />
          <Text style={styles.buttonText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            {capturedImage ? 'Analyzing fish species...' : 'Preparing camera...'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderResults = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 Fish Identified!</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.resultsContainer}>
        {capturedImage && (
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        )}

        {identificationResult && (
          <View style={styles.resultCard}>
            <View style={styles.speciesHeader}>
              <Text style={styles.speciesName}>{identificationResult.species.name}</Text>
              <Text style={styles.confidenceText}>
                {Math.round(identificationResult.confidence * 100)}% confidence
              </Text>
            </View>

            {identificationResult.species.localName && (
              <Text style={styles.localName}>
                Local name: {identificationResult.species.localName}
              </Text>
            )}

            <Text style={styles.description}>
              {identificationResult.description}
            </Text>

            {identificationResult.regulations.minSize && (
              <View style={styles.regulationInfo}>
                <Text style={styles.regulationTitle}>📏 Size Regulations</Text>
                <Text style={styles.regulationText}>
                  Minimum size: {identificationResult.regulations.minSize} cm
                </Text>
              </View>
            )}

            {identificationResult.regulations.protected && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Protected Species - Check local regulations before catching
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.retryButton]}
          onPress={() => {
            setShowResults(false);
            setCapturedImage(null);
            setIdentificationResult(null);
          }}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.buttonText}>Take Another</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.confirmButton]}
          onPress={confirmDetectedSpecies}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.buttonText}>Use This Fish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {showResults ? renderResults() : renderCameraInterface()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.bgCard,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  instructionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 40,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  cameraButton: {
    backgroundColor: theme.primary,
  },
  galleryButton: {
    backgroundColor: '#6366f1',
  },
  retryButton: {
    backgroundColor: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textMuted,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: theme.bgCard,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  confidenceText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  localName: {
    fontSize: 16,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  regulationInfo: {
    backgroundColor: theme.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  regulationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  regulationText: {
    fontSize: 14,
    color: theme.text,
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  warningText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
});

export default FishCamera;