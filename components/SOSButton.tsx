import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Animated,
  Vibration,
  Dimensions,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../theme/colors';
import { emergencyService } from '../services/emergencyService';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: number;
}

interface SOSButtonProps {
  emergencyContacts?: string[];
  customMessage?: string;
  onLocationRetrieved?: (location: LocationData) => void;
  onEmergencyTriggered?: (location: LocationData) => void;
  style?: any;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  emergencyContacts = [],
  customMessage,
  onLocationRetrieved,
  onEmergencyTriggered,
  style
}) => {
  const { t } = useTranslation();
  const defaultMessage = customMessage || t('emergency.emergency_message');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Animation references
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Pulse animation effect
  useEffect(() => {
    const createPulse = () => {
      return Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]);
    };

    const pulseLoop = Animated.loop(createPulse());
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  // Request location permissions
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          t('emergency.no_location_permission'),
          t('emergency.no_location_permission'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return false;
    }
  };

  // Get current location
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setLocationError(t('emergency.location_services_disabled'));
        return null;
      }

      // Request permissions
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError('Location permission denied.');
        return null;
      }

      // Get high-accuracy location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        timestamp: location.timestamp,
      };

      console.log('📍 Location retrieved:', locationData);
      return locationData;

    } catch (error: any) {
      console.error('❌ Location error:', error);
      let errorMessage = 'Failed to get location. ';
      
      switch (error.code) {
        case 'E_LOCATION_TIMEOUT':
          errorMessage += 'Location request timed out. Please try again.';
          break;
        case 'E_LOCATION_UNAVAILABLE':
          errorMessage += 'Location is currently unavailable.';
          break;
        case 'E_LOCATION_SETTINGS_UNSATISFIED':
          errorMessage += 'Location settings need to be adjusted.';
          break;
        default:
          errorMessage += 'Please check your location settings and try again.';
      }
      
      setLocationError(errorMessage);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle SOS button press
  const handleSOSPress = async () => {
    console.log('🚨 SOS button pressed!');
    
    // Visual and haptic feedback
    Vibration.vibrate([100, 50, 100]);
    
    // Button press animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      // Ripple effect
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Get location and show modal
    const location = await getCurrentLocation();
    
    if (location) {
      setCurrentLocation(location);
      onLocationRetrieved?.(location);
      onEmergencyTriggered?.(location);
      
      // Trigger emergency service
      try {
        await emergencyService.triggerEmergency(location, 'sos', defaultMessage);
      } catch (error) {
        console.error('❌ Failed to trigger emergency service:', error);
      }
    }
    
    // Show modal regardless of location success/failure
    setIsModalVisible(true);
    
    // Modal slide animation
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Close modal
  const closeModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
      setCurrentLocation(null);
      setLocationError(null);
    });
  };

  // Share location via SMS or other apps
  const shareLocation = async () => {
    if (!currentLocation) return;

    const locationText = `${customMessage}\n\nLatitude: ${currentLocation.latitude.toFixed(6)}\nLongitude: ${currentLocation.longitude.toFixed(6)}\n\nGoogle Maps: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}\n\nSent at: ${new Date().toLocaleString()}`;

    try {
      const canOpen = await Linking.canOpenURL('sms:');
      if (canOpen) {
        Linking.openURL(`sms:?body=${encodeURIComponent(locationText)}`);
      } else {
        // Fallback to sharing via other apps
        Alert.alert('Share Location', locationText);
      }
    } catch (error) {
      console.error('❌ Share error:', error);
      Alert.alert('Location Details', locationText);
    }
  };

  // Call emergency services
  const callEmergency = () => {
    Alert.alert(
      'Emergency Call',
      'Do you want to call emergency services?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 112', 
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112')
        }
      ]
    );
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lng'): string => {
    const direction = type === 'lat' 
      ? (coord >= 0 ? 'N' : 'S') 
      : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const formatAccuracy = (accuracy?: number): string => {
    if (!accuracy) return 'Unknown';
    return accuracy < 10 ? 'High' : accuracy < 50 ? 'Medium' : 'Low';
  };

  return (
    <>
      {/* Floating SOS Button */}
      <View style={[styles.sosButtonContainer, style]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSOSPress}
          activeOpacity={0.8}
          disabled={isGettingLocation}
        >
          <Animated.View 
            style={[
              styles.sosButtonInner,
              { 
                transform: [
                  { scale: scaleAnim },
                  { scale: pulseAnim }
                ] 
              }
            ]}
          >
            {/* Ripple effect */}
            <Animated.View 
              style={[
                styles.ripple,
                {
                  opacity: rippleAnim,
                  transform: [{ scale: rippleAnim }]
                }
              ]} 
            />
            
            <Text style={styles.sosText}>SOS</Text>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.emergencyIcon}>
                <Ionicons name="warning" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>🚨 Emergency Location</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {isGettingLocation ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                    <Ionicons name="location" size={48} color={theme.primary} />
                  </Animated.View>
                  <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
              ) : locationError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="location-outline" size={48} color="#FF4444" />
                  <Text style={styles.errorText}>{locationError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={async () => {
                      const location = await getCurrentLocation();
                      if (location) setCurrentLocation(location);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : currentLocation ? (
                <View style={styles.locationContainer}>
                  <View style={styles.coordinatesCard}>
                    <View style={styles.coordinateRow}>
                      <Ionicons name="navigate" size={20} color={theme.primary} />
                      <View>
                        <Text style={styles.coordinateLabel}>Latitude</Text>
                        <Text style={styles.coordinateValue}>
                          {formatCoordinate(currentLocation.latitude, 'lat')}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.coordinateRow}>
                      <Ionicons name="compass" size={20} color={theme.primary} />
                      <View>
                        <Text style={styles.coordinateLabel}>Longitude</Text>
                        <Text style={styles.coordinateValue}>
                          {formatCoordinate(currentLocation.longitude, 'lng')}
                        </Text>
                      </View>
                    </View>

                    {currentLocation.accuracy && (
                      <View style={styles.accuracyRow}>
                        <Ionicons name="radio-button-on" size={16} color={theme.success} />
                        <Text style={styles.accuracyText}>
                          Accuracy: {formatAccuracy(currentLocation.accuracy)} ({currentLocation.accuracy.toFixed(0)}m)
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.shareButton]}
                      onPress={shareLocation}
                    >
                      <Ionicons name="share" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Share Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.callButton]}
                      onPress={callEmergency}
                    >
                      <Ionicons name="call" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Call 112</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Google Maps Link */}
                  <TouchableOpacity 
                    style={styles.mapsButton}
                    onPress={() => {
                      const mapsUrl = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
                      Linking.openURL(mapsUrl);
                    }}
                  >
                    <Ionicons name="map" size={16} color={theme.primary} />
                    <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  sosButton: {
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    transform: [{ scale: 1.5 }],
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textMuted,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationContainer: {
    gap: 20,
  },
  coordinatesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coordinateLabel: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 2,
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  accuracyText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  shareButton: {
    backgroundColor: theme.primary,
  },
  callButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    gap: 8,
  },
  mapsButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SOSButton;