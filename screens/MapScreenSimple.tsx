import React, { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Dimensions,
  SafeAreaView
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { LinearGradient } from 'expo-linear-gradient'

import { theme } from "../theme/colors"

const { width, height } = Dimensions.get('window')

// Enhanced design system
const designSystem = {
  spacing: {
    xs: width * 0.01,
    sm: width * 0.02,
    md: width * 0.04,
    lg: width * 0.06,
    xl: width * 0.08,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  typography: {
    h1: Math.min(width * 0.07, 28),
    h2: Math.min(width * 0.055, 22),
    h3: Math.min(width * 0.045, 18),
    body: Math.min(width * 0.04, 16),
    caption: Math.min(width * 0.035, 14),
    small: Math.min(width * 0.03, 12),
  },
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  colors: {
    primary: '#0F766E',
    primaryLight: '#14B8A6',
    secondary: '#0891B2',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
  }
}

interface Position {
  lat: number
  lon: number
}

export default function MapScreenSimple() {
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
    
    getLocation()
  }, [])

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required for fishing zones.")
        return
      }

      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High,
      })
      
      setPosition({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude
      })
    } catch (error) {
      console.error("Location error:", error)
      // Default to Mumbai coast
      setPosition({ lat: 19.0760, lon: 72.8777 })
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Modern Header with Location */}
          <LinearGradient
            colors={[designSystem.colors.primary, designSystem.colors.primaryLight]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>SeaSure</Text>
            <Text style={styles.headerSubtitle}>
              {position 
                ? `${position.lat.toFixed(4)}°N, ${position.lon.toFixed(4)}°E`
                : "Getting location..."
              }
            </Text>
          </LinearGradient>

          {/* Enhanced Map Container */}
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={['#E0F2FE', '#F0F9FF']}
              style={styles.mapPlaceholder}
            >
              <View style={styles.mapIconContainer}>
                <Ionicons name="map" size={designSystem.typography.h1 * 2} color={designSystem.colors.primary} />
              </View>
              <Text style={styles.mapTitle}>Interactive Fishing Map</Text>
              
              {/* Modern Control Buttons */}
              <View style={styles.controlButtonsContainer}>
                <TouchableOpacity style={styles.controlButton}>
                  <LinearGradient
                    colors={[designSystem.colors.primary, designSystem.colors.primaryLight]}
                    style={styles.gradientButton}
                  >
                    <Ionicons name="layers" size={18} color="#FFFFFF" />
                    <Text style={styles.controlButtonActiveText}>Zones</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.controlButton}>
                  <View style={styles.outlineButton}>
                    <Ionicons name="fish" size={18} color={designSystem.colors.primary} />
                    <Text style={styles.controlButtonText}>Fish AI</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.controlButton}>
                  <View style={styles.outlineButton}>
                    <Ionicons name="shield-checkmark" size={18} color={designSystem.colors.primary} />
                    <Text style={styles.controlButtonText}>Safety</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.refreshButton}>
                  <Ionicons name="refresh" size={18} color={designSystem.colors.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Modern Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[designSystem.colors.success, '#34D399']}
                style={styles.statIconContainer}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Active Zones</Text>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={[designSystem.colors.secondary, '#38BDF8']}
                style={styles.statIconContainer}
              >
                <Ionicons name="analytics" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Predictions</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>+3</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={[designSystem.colors.accent, '#FCD34D']}
                style={styles.statIconContainer}
              >
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statNumber}>29.5</Text>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statUnit}>km</Text>
            </View>
          </View>

          {/* Fish Information Cards */}
          <View style={styles.fishInfoContainer}>
            <View style={styles.fishCard}>
              <View style={styles.fishCardHeader}>
                <Text style={styles.fishName}>Oil Sardine</Text>
                <View style={styles.probabilityBadge}>
                  <Text style={styles.probabilityText}>65%</Text>
                </View>
              </View>
              <Text style={styles.fishTime}>04:20</Text>
              <Text style={styles.fishMethod}>gillnet</Text>
            </View>
            
            <View style={styles.fishCard}>
              <View style={styles.fishCardHeader}>
                <Text style={styles.fishName}>Indian Mackerel</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>6</Text>
                </View>
              </View>
              <Text style={styles.fishTime}>22:20</Text>
              <Text style={styles.fishMethod}>gillnet</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.primaryActionButton}>
              <LinearGradient
                colors={[designSystem.colors.primary, designSystem.colors.primaryLight]}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Plan Trip to This Zone</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading fishing data...</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: designSystem.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.surfaceSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: designSystem.typography.h1,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: designSystem.typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  mapContainer: {
    height: height * 0.45,
    marginHorizontal: designSystem.spacing.md,
    marginVertical: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.xl,
    overflow: 'hidden',
    ...designSystem.shadows.medium,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.lg,
  },
  mapIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  mapTitle: {
    fontSize: designSystem.typography.h2,
    fontWeight: '700',
    color: designSystem.colors.text,
    marginBottom: designSystem.spacing.lg,
    textAlign: 'center',
  },
  controlButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.sm,
  },
  controlButton: {
    borderRadius: designSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    minWidth: width * 0.2,
    justifyContent: 'center',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surface,
    borderWidth: 1.5,
    borderColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.lg,
    minWidth: width * 0.2,
    justifyContent: 'center',
  },
  controlButtonActiveText: {
    fontSize: designSystem.typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controlButtonText: {
    fontSize: designSystem.typography.caption,
    fontWeight: '600',
    color: designSystem.colors.primary,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designSystem.colors.surface,
    borderWidth: 1.5,
    borderColor: designSystem.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: designSystem.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    gap: designSystem.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.sm,
    alignItems: 'center',
    ...designSystem.shadows.light,
    minHeight: height * 0.14,
    justifyContent: 'center',
    position: 'relative',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  statNumber: {
    fontSize: designSystem.typography.h2,
    fontWeight: '800',
    color: designSystem.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: designSystem.typography.small,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  statUnit: {
    fontSize: designSystem.typography.small,
    color: designSystem.colors.textLight,
    fontWeight: '400',
  },
  statBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: designSystem.colors.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fishInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    gap: designSystem.spacing.sm,
  },
  fishCard: {
    flex: 1,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    ...designSystem.shadows.light,
  },
  fishCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  fishName: {
    fontSize: designSystem.typography.body,
    fontWeight: '700',
    color: designSystem.colors.text,
    flex: 1,
  },
  probabilityBadge: {
    backgroundColor: designSystem.colors.accent,
    borderRadius: designSystem.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  probabilityText: {
    fontSize: designSystem.typography.small,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: designSystem.colors.textSecondary,
    borderRadius: designSystem.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: {
    fontSize: designSystem.typography.small,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fishTime: {
    fontSize: designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  fishMethod: {
    fontSize: designSystem.typography.small,
    color: designSystem.colors.textLight,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.lg,
  },
  primaryActionButton: {
    borderRadius: designSystem.borderRadius.lg,
    overflow: 'hidden',
    ...designSystem.shadows.medium,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.lg,
  },
  primaryActionText: {
    fontSize: designSystem.typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: designSystem.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
})