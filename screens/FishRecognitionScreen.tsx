import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { fishRecognition, FishIdentificationResult } from '../services/fishRecognition';
import { fishDatabase } from '../data/fishDatabase';

export default function FishRecognitionScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<FishIdentificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCameraCapture = async () => {
    try {
      console.log('📸 CAMERA BUTTON PRESSED - Starting capture process...');
      setLoading(true);
      const imageUri = await fishRecognition.capturePhoto();
      console.log('📸 CAMERA RESULT:', imageUri ? 'Image captured successfully' : 'No image captured');
      
      if (imageUri) {
        console.log('📸 Setting image URI and calling identifyFish...');
        setSelectedImage(imageUri);
        await identifyFish(imageUri);
        console.log('📸 identifyFish call completed');
      } else {
        console.log('📸 No image to identify - user cancelled or error occurred');
      }
    } catch (error) {
      console.error('📸 CAMERA CAPTURE ERROR:', error);
      Alert.alert('Camera Error', 'Failed to capture photo');
    } finally {
      setLoading(false);
      console.log('📸 Camera capture process finished');
    }
  };

  const handleGalleryPick = async () => {
    try {
      setLoading(true);
      const imageUri = await fishRecognition.pickFromGallery();
      
      if (imageUri) {
        setSelectedImage(imageUri);
        await identifyFish(imageUri);
      }
    } catch (error) {
      Alert.alert('Gallery Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    try {
      console.log('🧪 TEST BUTTON: Starting direct API test...');
      setLoading(true);
      
      // Call the fish recognition with a test image URI
      const result = await fishRecognition.identifyFish('test-image-uri-for-api');
      console.log('🧪 TEST BUTTON: Result:', result);
      setIdentificationResult(result);
      
      if (!result) {
        Alert.alert('API Test', 'No result returned from API test');
      } else {
        Alert.alert('API Test Success', `Species: ${result.species.name}`);
      }
    } catch (error) {
      console.error('🧪 TEST BUTTON: Error:', error);
      Alert.alert('API Test Error', 'Failed to test API');
    } finally {
      setLoading(false);
    }
  };

  const identifyFish = async (imageUri: string) => {
    try {
      console.log('🐟 FishRecognitionScreen: Starting identification...');
      console.log('🐟 Image URI received:', imageUri);
      setLoading(true);
      console.log('🐟 Calling fishRecognition.identifyFish...');
      const result = await fishRecognition.identifyFish(imageUri);
      console.log('🐟 FishRecognitionScreen: Result received:', result);
      setIdentificationResult(result);
      
      if (!result) {
        console.log('🐟 No result returned from fish identification');
        Alert.alert('No Fish Detected', 'Could not identify any fish in the image. Please try another photo.');
      } else {
        console.log('🐟 Fish identified successfully:', result.species.name);
      }
    } catch (error) {
      console.error('🐟 FishRecognitionScreen: Error:', error);
      Alert.alert('Recognition Error', 'Failed to identify fish. Please try again.');
    } finally {
      setLoading(false);
      console.log('🐟 Fish identification process completed');
    }
  };

  const resetIdentification = () => {
    setSelectedImage(null);
    setIdentificationResult(null);
  };

  const renderImageSection = () => {
    if (!selectedImage) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📸</Text>
          <Text style={styles.placeholderText}>Take a photo or select from gallery to identify fish species</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        <TouchableOpacity style={styles.resetButton} onPress={resetIdentification}>
          <Text style={styles.resetButtonText}>Take New Photo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderIdentificationResult = () => {
    if (!identificationResult) return null;

    const { species, confidence, regulations } = identificationResult;
    const marketInfo = fishDatabase.getMarketInfo(species.id);
    const catchRegulations = fishDatabase.getCatchRegulations(species.id);

    return (
      <ScrollView style={styles.resultContainer}>
        <View style={styles.speciesHeader}>
          <Text style={styles.speciesName}>{species.name}</Text>
          {species.localName && (
            <Text style={styles.localName}>({species.localName})</Text>
          )}
          <Text style={styles.scientificName}>{species.scientificName}</Text>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(confidence * 100)}%
            </Text>
            <View style={[styles.confidenceBar, { backgroundColor: confidence > 0.7 ? '#22c55e' : confidence > 0.5 ? '#eab308' : '#ef4444' }]} />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{species.description}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Habitat</Text>
          <Text style={styles.habitatText}>{species.habitat}</Text>
        </View>

        {/* Market Information */}
        <View style={styles.marketSection}>
          <Text style={styles.sectionTitle}>💰 Market Information</Text>
          <View style={styles.marketRow}>
            <Text style={styles.marketLabel}>Price:</Text>
            <Text style={styles.marketValue}>₹{marketInfo.value}/kg</Text>
          </View>
          <View style={styles.marketRow}>
            <Text style={styles.marketLabel}>Demand:</Text>
            <Text style={[styles.marketValue, { 
              color: marketInfo.demand === 'High' ? '#22c55e' : 
                     marketInfo.demand === 'Medium' ? '#eab308' : '#6b7280' 
            }]}>
              {marketInfo.demand}
            </Text>
          </View>
          <Text style={styles.marketDescription}>{marketInfo.description}</Text>
        </View>

        {/* Regulations */}
        <View style={[styles.regulationSection, { 
          backgroundColor: catchRegulations.allowed ? '#f0f9ff' : '#fef2f2',
          borderColor: catchRegulations.allowed ? '#3b82f6' : '#ef4444'
        }]}>
          <Text style={styles.sectionTitle}>
            {catchRegulations.allowed ? '✅' : '⚠️'} Fishing Regulations
          </Text>
          
          {catchRegulations.warnings.map((warning, index) => (
            <View key={index} style={styles.warningRow}>
              <Text style={[styles.warningText, { 
                color: warning.includes('PROTECTED') ? '#dc2626' : '#374151' 
              }]}>
                {warning}
              </Text>
            </View>
          ))}

          {regulations.season && (
            <View style={styles.seasonInfo}>
              <Text style={styles.seasonText}>Best Season: {regulations.season}</Text>
            </View>
          )}
        </View>

        {/* Quick Facts */}
        <View style={styles.quickFacts}>
          <Text style={styles.sectionTitle}>📊 Quick Facts</Text>
          <View style={styles.factGrid}>
            {regulations.minSize && (
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Min Size</Text>
                <Text style={styles.factValue}>{regulations.minSize} cm</Text>
              </View>
            )}
            {regulations.maxCatch && (
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Max Catch</Text>
                <Text style={styles.factValue}>{regulations.maxCatch}/day</Text>
              </View>
            )}
            <View style={styles.factItem}>
              <Text style={styles.factLabel}>Market Price</Text>
              <Text style={styles.factValue}>₹{marketInfo.value}/kg</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐟 Fish Recognition</Text>
        <Text style={styles.subtitle}>Identify fish species instantly using AI</Text>
      </View>

      {renderImageSection()}

      {!identificationResult && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cameraButton]} 
            onPress={handleCameraCapture}
            disabled={loading}
          >
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.galleryButton]} 
            onPress={handleGalleryPick}
            disabled={loading}
          >
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>From Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ff6b35' }]} 
            onPress={testDirectAPI}
            disabled={loading}
          >
            <Text style={styles.buttonIcon}>🧪</Text>
            <Text style={styles.buttonText}>TEST API</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>
            {selectedImage ? 'Identifying fish species...' : 'Loading camera...'}
          </Text>
        </View>
      )}

      {renderIdentificationResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  resetButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButton: {
    backgroundColor: '#3b82f6',
  },
  galleryButton: {
    backgroundColor: '#10b981',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  speciesHeader: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  speciesName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  localName: {
    fontSize: 18,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  scientificName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  confidenceContainer: {
    marginTop: 12,
  },
  confidenceText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  habitatText: {
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  marketSection: {
    backgroundColor: '#fefce8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eab308',
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  marketValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  marketDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  regulationSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  warningRow: {
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
  },
  seasonInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  seasonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  quickFacts: {
    marginBottom: 16,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  factItem: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  factLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  factValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
});