import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
  children?: React.ReactNode;
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChange?: (region: any) => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
}

// Web-compatible map component
export default function MapComponent({ 
  children, 
  style, 
  initialRegion,
  onRegionChange,
  showsUserLocation,
  followsUserLocation,
  ...props 
}: MapComponentProps) {
  return (
    <View style={[styles.mapContainer, style]} {...props}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>SeaSure Map</Text>
        <Text style={styles.mapSubtitle}>Web View</Text>
        
        {initialRegion && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              📍 {initialRegion.latitude.toFixed(4)}°N, {initialRegion.longitude.toFixed(4)}°E
            </Text>
          </View>
        )}
        
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>🎣 Fishing Zones</Text>
          <Text style={styles.featureItem}>🐟 AI Fish Predictions</Text>
          <Text style={styles.featureItem}>🚢 Maritime Boundaries</Text>
          <Text style={styles.featureItem}>⚠️ Weather Alerts</Text>
        </View>
        
        <Text style={styles.webNote}>
          📱 For full map features, use the mobile app
        </Text>
      </View>
      
      {/* Render any child components */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#E3F2FD',
  },
  mapTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 18,
    color: theme.muted,
    marginBottom: 24,
  },
  locationInfo: {
    backgroundColor: theme.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 16,
    color: theme.fg,
    fontWeight: '500',
  },
  featureList: {
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    fontSize: 16,
    color: theme.fg,
    textAlign: 'center',
  },
  webNote: {
    fontSize: 14,
    color: theme.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});