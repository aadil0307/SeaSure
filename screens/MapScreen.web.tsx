import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"

import { theme } from "../theme/colors"
import { ZONES, isFishingAllowed } from "../data/zones"
import { fishPredictionService, FishPrediction } from "../services/fishPrediction"
import { maritimeBoundaryService } from "../services/maritimeBoundary"
import { EnhancedCard, ModernButton, ProfessionalBadge, LoadingOverlay } from "../components/modernUI"
import MapComponent from "../components/MapComponent.web"

type MapMode = 'zones' | 'predictions' | 'boundaries'

export default function MapScreen() {
  const [mode, setMode] = useState<MapMode>('zones')
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [fishPredictions, setFishPredictions] = useState<FishPrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [alertsVisible, setAlertsVisible] = useState(false)
  const fadeAnim = useState(new Animated.Value(0))[0]

  const region = {
    latitude: location?.coords.latitude || 19.0760,
    longitude: location?.coords.longitude || 72.8777,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
    
    getCurrentLocation()
    loadInitialData()
  }, [])

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required for fishing features')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setLocation(currentLocation)
    } catch (error) {
      console.error('Error getting location:', error)
      Alert.alert('Location Error', 'Could not get your current location')
    }
  }

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Load fish predictions for default location
      const predictions = await fishPredictionService.generateFishPredictions({
        lat: 19.0760,
        lon: 72.8777
      })
      setFishPredictions(predictions)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (!location) return
    
    setLoading(true)
    try {
      const predictions = await fishPredictionService.generateFishPredictions({
        lat: location.coords.latitude,
        lon: location.coords.longitude
      })
      setFishPredictions(predictions)
    } catch (error) {
      console.error('Error refreshing data:', error)
      Alert.alert('Error', 'Failed to refresh fishing data')
    } finally {
      setLoading(false)
    }
  }

  const getModeColor = (currentMode: MapMode) => {
    switch (currentMode) {
      case 'zones': return '#3B82F6'
      case 'predictions': return '#10B981'
      case 'boundaries': return '#EF4444'
      default: return theme.muted
    }
  }

  const getModeIcon = (currentMode: MapMode) => {
    switch (currentMode) {
      case 'zones': return 'location'
      case 'predictions': return 'analytics'
      case 'boundaries': return 'warning'
      default: return 'map'
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.mapModeContainer}>
          {(['zones', 'predictions', 'boundaries'] as MapMode[]).map((mapMode) => (
            <TouchableOpacity
              key={mapMode}
              style={[
                styles.modeButton,
                { backgroundColor: mode === mapMode ? getModeColor(mapMode) : theme.card }
              ]}
              onPress={() => setMode(mapMode)}
            >
              <Ionicons
                name={getModeIcon(mapMode)}
                size={20}
                color={mode === mapMode ? 'white' : theme.fg}
              />
              <Text style={[
                styles.modeText,
                { color: mode === mapMode ? 'white' : theme.fg }
              ]}>
                {mapMode.charAt(0).toUpperCase() + mapMode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.alertsButton}
          onPress={() => setAlertsVisible(!alertsVisible)}
        >
          <Ionicons name="notifications" size={24} color={theme.primary} />
          <ProfessionalBadge variant="danger" label="3" />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapComponent
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          followsUserLocation={false}
        />
        
        {/* Mode Information Overlay */}
        <View style={styles.modeInfoOverlay}>
          <EnhancedCard style={styles.modeInfoCard}>
            <View style={styles.modeInfoHeader}>
              <Ionicons name={getModeIcon(mode)} size={24} color={getModeColor(mode)} />
              <Text style={styles.modeInfoTitle}>
                {mode === 'zones' && 'Fishing Zones'}
                {mode === 'predictions' && 'AI Fish Predictions'}
                {mode === 'boundaries' && 'Maritime Boundaries'}
              </Text>
            </View>
            <Text style={styles.modeInfoDescription}>
              {mode === 'zones' && 'Discover productive fishing areas based on depth, currents, and historical data.'}
              {mode === 'predictions' && 'AI-powered fish activity predictions using weather, tides, and species patterns.'}
              {mode === 'boundaries' && 'Legal fishing boundaries and restricted areas for compliance and safety.'}
            </Text>
          </EnhancedCard>
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.controlScroll}>
          <ModernButton
            title="Refresh Data"
            icon="refresh"
            onPress={refreshData}
            style={styles.controlButton}
            disabled={loading}
          />
          <ModernButton
            title="My Location"
            icon="locate"
            onPress={getCurrentLocation}
            style={styles.controlButton}
            variant="secondary"
          />
          <ModernButton
            title="Weather"
            icon="cloud"
            onPress={() => Alert.alert('Weather', 'Check the Weather tab for marine conditions')}
            style={styles.controlButton}
            variant="ghost"
          />
        </ScrollView>
      </View>

      {/* Alerts Overlay */}
      {alertsVisible && (
        <View style={styles.alertsOverlay}>
          <EnhancedCard style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Ionicons name="warning" size={24} color={theme.warn} />
              <Text style={styles.alertsTitle}>Active Alerts</Text>
              <TouchableOpacity onPress={() => setAlertsVisible(false)}>
                <Ionicons name="close" size={24} color={theme.muted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.alertItem}>
              <ProfessionalBadge variant="warning" label="Weather" />
              <Text style={styles.alertText}>Strong winds expected at 3 PM</Text>
            </View>
            
            <View style={styles.alertItem}>
              <ProfessionalBadge variant="danger" label="Boundary" />
              <Text style={styles.alertText}>Approaching restricted naval zone</Text>
            </View>
            
            <View style={styles.alertItem}>
              <ProfessionalBadge variant="info" label="Fish" />
              <Text style={styles.alertText}>High tuna activity detected nearby</Text>
            </View>
          </EnhancedCard>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && <LoadingOverlay visible={true} message="Loading fishing data..." />}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.card,
  },
  mapModeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  modeInfoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  modeInfoCard: {
    padding: 16,
  },
  modeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  modeInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.fg,
  },
  modeInfoDescription: {
    fontSize: 14,
    color: theme.muted,
    lineHeight: 20,
  },
  controlPanel: {
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.card,
    paddingVertical: 16,
  },
  controlScroll: {
    paddingHorizontal: 16,
  },
  controlButton: {
    marginRight: 12,
    minWidth: 120,
  },
  alertsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertsCard: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  alertsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.fg,
    flex: 1,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  alertText: {
    fontSize: 16,
    color: theme.fg,
    flex: 1,
  },
});