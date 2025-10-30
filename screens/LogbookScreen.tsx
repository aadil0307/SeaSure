import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import { authService } from '../services/auth'
import { theme, palette } from '../theme/colors'
import { 
  EnhancedCard, 
  ModernButton, 
  ProfessionalBadge,
  LoadingOverlay 
} from '../components/modernUI'
import { useTranslation } from 'react-i18next'
import FishCamera from '../components/FishCamera'
import { FishIdentificationResult } from '../services/fishRecognition'

const { width, height } = Dimensions.get('window')

// Comprehensive list of fish species commonly found in Indian waters
const getFishSpecies = (t: any) => [
  // Popular Marine Fish
  { id: 'pomfret', name: t('fish_species.pomfret'), category: 'Marine', emoji: '🐟' },
  { id: 'kingfish', name: t('fish_species.kingfish'), category: 'Marine', emoji: '🎣' },
  { id: 'tuna', name: t('fish_species.tuna'), category: 'Marine', emoji: '🐟' },
  { id: 'mackerel', name: t('fish_species.mackerel'), category: 'Marine', emoji: '🐠' },
  { id: 'sardine', name: t('fish_species.sardine'), category: 'Marine', emoji: '🐟' },
  { id: 'hilsa', name: t('fish_species.hilsa'), category: 'Marine', emoji: '🐟' },
  { id: 'bombay_duck', name: t('fish_species.bombay_duck'), category: 'Marine', emoji: '🦆' },
  { id: 'prawns', name: t('fish_species.prawns'), category: 'Crustacean', emoji: '🦐' },
  { id: 'crab', name: t('fish_species.crab'), category: 'Crustacean', emoji: '🦀' },
  { id: 'squid', name: t('fish_species.squid'), category: 'Cephalopod', emoji: '🦑' },
  
  // Regional Favorites
  { id: 'rohu', name: t('fish_species.rohu'), category: 'Freshwater', emoji: '🐟' },
  { id: 'catla', name: t('fish_species.catla'), category: 'Freshwater', emoji: '🐟' },
  { id: 'mrigal', name: t('fish_species.mrigal'), category: 'Freshwater', emoji: '🐟' },
  { id: 'tilapia', name: t('fish_species.tilapia'), category: 'Freshwater', emoji: '🐠' },
  { id: 'snapper', name: t('fish_species.snapper'), category: 'Marine', emoji: '🐟' },
  { id: 'grouper', name: t('fish_species.grouper'), category: 'Marine', emoji: '🐟' },
  { id: 'barracuda', name: t('fish_species.barracuda'), category: 'Marine', emoji: '🐟' },
  { id: 'anchovy', name: t('fish_species.anchovy'), category: 'Marine', emoji: '🐟' },
]

interface CatchEntry {
  id: string
  fishSpecies: string
  weight: number
  quantity: number
  timestamp: number
  location?: {
    latitude: number
    longitude: number
  }
  status: 'synced' | 'pending'
  userId?: string
}

interface LogbookScreenProps {
  navigation?: any
}

const LogbookScreen: React.FC<LogbookScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  // Get current authenticated user
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())
  
  // Get localized fish species
  const FISH_SPECIES = getFishSpecies(t)
  
  const [selectedFish, setSelectedFish] = useState<typeof FISH_SPECIES[0] | null>(null)
  const [weight, setWeight] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [catchHistory, setCatchHistory] = useState<CatchEntry[]>([])
  const [isOnline, setIsOnline] = useState(true) // Mock as always online for demo
  const [loading, setLoading] = useState(false)
  const [showSpeciesModal, setShowSpeciesModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showFishCamera, setShowFishCamera] = useState(false)
  const [detectedFishData, setDetectedFishData] = useState<FishIdentificationResult | null>(null)
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(height)).current
  const weightAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    initializeScreen()
    checkNetworkStatus()
    syncPendingEntries()
    
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user)
      if (user) {
        syncPendingEntries()
      }
    })
    
    return () => unsubscribe()
  }, [])

  const initializeScreen = () => {
    loadCatchHistory()
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const checkNetworkStatus = () => {
    // Simple network status simulation
    // In production, replace this with @react-native-community/netinfo
    setIsOnline(true) // Mock as always online for demo
    
    if (true) { // Always try to sync in demo
      syncPendingEntries()
    }
  }

  const loadCatchHistory = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      
      if (currentUser) {
        // Load from Firebase Firestore (primary source)
        try {
          const catchesQuery = query(
            collection(db, 'catches'),
            where('userId', '==', currentUser.uid)
          )
          
          const catchesSnapshot = await getDocs(catchesQuery)
          const firebaseCatches = catchesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            status: 'synced' // Firebase entries are always synced
          })) as CatchEntry[]
          
          // Sort by timestamp (newest first)
          firebaseCatches.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          
          // Set Firebase catches as the primary source
          setCatchHistory(firebaseCatches)
          
          // Also update local storage with Firebase data for offline access
          await AsyncStorage.setItem('catch_history', JSON.stringify(firebaseCatches))
          
        } catch (firebaseError) {
          console.error('Error loading from Firebase:', firebaseError)
          
          // Fallback to local storage if Firebase fails
          const stored = await AsyncStorage.getItem('catch_history')
          if (stored) {
            const localCatches = JSON.parse(stored)
            setCatchHistory(localCatches)
          }
        }
      } else {
        // User not logged in, load from local storage only
        const stored = await AsyncStorage.getItem('catch_history')
        if (stored) {
          const localCatches = JSON.parse(stored)
          setCatchHistory(localCatches)
        }
      }
    } catch (error) {
      console.error('Error loading catch history:', error)
    }
  }

  const openHistoryModal = async () => {
    setShowHistory(true)
    // Refresh catch history when modal opens to ensure latest data
    await loadCatchHistory()
  }

  const saveCatchLocally = async (catchEntry: CatchEntry) => {
    try {
      const updatedHistory = [catchEntry, ...catchHistory]
      setCatchHistory(updatedHistory)
      await AsyncStorage.setItem('catch_history', JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Error saving locally:', error)
    }
  }

  const syncToFirestore = async (catchEntry: CatchEntry) => {
    try {
      if (!currentUser) throw new Error('User not authenticated')
      
      const docRef = await addDoc(collection(db, 'catches'), {
        ...catchEntry,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        syncedAt: serverTimestamp(),
      })
      
      // Update local entry as synced
      const updatedHistory = catchHistory.map(entry =>
        entry.id === catchEntry.id ? { ...entry, status: 'synced' as const } : entry
      )
      setCatchHistory(updatedHistory)
      await AsyncStorage.setItem('catch_history', JSON.stringify(updatedHistory))
      
      console.log('Catch synced to Firestore:', docRef.id)
    } catch (error) {
      console.error('Error syncing to Firestore:', error)
      throw error
    }
  }

  const syncPendingEntries = async () => {
    if (!isOnline || !currentUser) return
    
    const pendingEntries = catchHistory.filter(entry => entry.status === 'pending')
    
    for (const entry of pendingEntries) {
      try {
        await syncToFirestore(entry)
      } catch (error) {
        console.error('Failed to sync entry:', entry.id, error)
      }
    }
  }

  const handleSaveCatch = async () => {
    if (!selectedFish || weight <= 0 || quantity <= 0) {
      Alert.alert('Invalid Entry', 'Please fill all fields with valid values')
      return
    }

    setLoading(true)

    try {
      const catchEntry: CatchEntry = {
        id: Date.now().toString(),
        fishSpecies: selectedFish.name,
        weight,
        quantity,
        timestamp: Date.now(),
        status: isOnline ? 'synced' : 'pending',
        userId: currentUser?.uid,
      }

      // Save locally first
      await saveCatchLocally(catchEntry)

      // Try to sync online if connected
      if (isOnline && currentUser) {
        try {
          await syncToFirestore(catchEntry)
          Alert.alert(
            '🎣 Catch Logged!',
            `${quantity}x ${selectedFish.name} (${weight}kg) saved successfully!`,
            [{ text: 'Great!', style: 'default' }]
          )
        } catch (error) {
          Alert.alert(
            '📱 Saved Offline',
            'Catch saved locally. Will sync when connection is restored.',
            [{ text: 'OK' }]
          )
        }
      } else {
        Alert.alert(
          '📱 Saved Offline',
          'Catch saved locally. Will sync when you connect to internet.',
          [{ text: 'OK' }]
        )
      }

      // Reset form
      setSelectedFish(null)
      setWeight(0)
      setQuantity(1)
      
      // Refresh catch history to show the new entry
      await loadCatchHistory()
      
      // Weight animation reset
      Animated.timing(weightAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start()

    } catch (error) {
      Alert.alert('Error', 'Failed to save catch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fish camera handlers
  const handleFishDetected = (species: string, confidence: number, details?: FishIdentificationResult) => {
    console.log('🐟 Fish detected:', species, 'confidence:', confidence)
    
    // Try to find matching fish in our local species list
    const matchedFish = FISH_SPECIES.find(fish => 
      fish.name.toLowerCase().includes(species.toLowerCase()) ||
      species.toLowerCase().includes(fish.name.toLowerCase())
    )
    
    if (matchedFish) {
      setSelectedFish(matchedFish)
      console.log('✅ Matched local fish:', matchedFish.name)
    } else {
      // Create a new fish entry for detected species
      const detectedFishEntry = {
        id: species.toLowerCase().replace(/\s+/g, '_'),
        name: species,
        category: 'Detected',
        emoji: '🐟'
      }
      setSelectedFish(detectedFishEntry)
      console.log('🆕 Using detected fish:', species)
    }
    
    // Store detailed detection data for reference
    if (details) {
      setDetectedFishData(details)
    }
    
    // Close camera modal
    setShowFishCamera(false)
    
    // Show success message with confidence
    Alert.alert(
      '🎯 Fish Identified!',
      `${species} detected with ${Math.round(confidence * 100)}% confidence.\n\nYou can now add weight and quantity to complete your catch entry.`,
      [{ text: 'Great!', style: 'default' }]
    )
  }

  const handleCameraCancel = () => {
    setShowFishCamera(false)
    // Optionally fall back to manual selection
    setShowSpeciesModal(true)
  }

  const openFishCamera = () => {
    setShowFishCamera(true)
  }

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, 999))
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1))

  const handleWeightChange = (newWeight: number) => {
    setWeight(newWeight)
    // Animate weight meter
    Animated.spring(weightAnim, {
      toValue: newWeight / 100, // Scale to 0-1 range
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start()
  }

  const renderSpeciesModal = () => (
    <Modal
      visible={showSpeciesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSpeciesModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🐟 {t('logbook.select_species')}</Text>
            <TouchableOpacity onPress={() => setShowSpeciesModal(false)}>
              <Ionicons name="close" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={FISH_SPECIES}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.speciesItem}
                onPress={() => {
                  setSelectedFish(item)
                  setShowSpeciesModal(false)
                }}
              >
                <Text style={styles.speciesEmoji}>{item.emoji}</Text>
                <View style={styles.speciesInfo}>
                  <Text style={styles.speciesName}>{item.name}</Text>
                  <Text style={styles.speciesCategory}>{item.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )

  const renderHistoryModal = () => (
    <Modal
      visible={showHistory}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowHistory(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.enhancedModalContent}>
          <View style={styles.enhancedModalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="time" size={28} color={theme.primary} />
              <Text style={styles.enhancedModalTitle}>Catch History</Text>
            </View>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Statistics Summary */}
          <View style={styles.historySummary}>
            <View style={styles.historySummaryCard}>
              <Text style={styles.summaryNumber}>{catchHistory.length}</Text>
              <Text style={styles.historySummaryLabel}>Total Catches</Text>
            </View>
            <View style={styles.historySummaryCard}>
              <Text style={styles.summaryNumber}>
                {catchHistory.reduce((sum, catch_) => sum + (catch_.weight * catch_.quantity), 0).toFixed(1)}kg
              </Text>
              <Text style={styles.historySummaryLabel}>Total Weight</Text>
            </View>
            <View style={styles.historySummaryCard}>
              <Text style={styles.summaryNumber}>
                {new Set(catchHistory.map(catch_ => new Date(catch_.timestamp).toDateString())).size}
              </Text>
              <Text style={styles.historySummaryLabel}>Fishing Days</Text>
            </View>
          </View>
          
          {catchHistory.length === 0 ? (
            <View style={styles.enhancedEmptyState}>
              <Ionicons name="fish-outline" size={80} color={theme.muted} />
              <Text style={styles.enhancedEmptyTitle}>No catches recorded yet</Text>
              <Text style={styles.enhancedEmptyText}>Start logging your catches to build your fishing history!</Text>
            </View>
          ) : (
            <FlatList
              data={catchHistory}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.historyList}
              renderItem={({ item }) => (
                <View style={styles.enhancedHistoryItem}>
                  <View style={styles.historyIconContainer}>
                    <Text style={styles.historyEmoji}>
                      {FISH_SPECIES.find(fish => fish.name === item.fishSpecies)?.emoji || '🐟'}
                    </Text>
                  </View>
                  
                  <View style={styles.historyContentContainer}>
                    <View style={styles.historyMainInfo}>
                      <Text style={styles.enhancedHistoryFishName}>{item.fishSpecies}</Text>
                      <Text style={styles.enhancedHistoryDate}>
                        {new Date(item.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.historyMetrics}>
                      <View style={styles.metricItem}>
                        <Ionicons name="barbell" size={16} color={theme.primary} />
                        <Text style={styles.metricValue}>{item.weight.toFixed(1)} kg each</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Ionicons name="fish" size={16} color={theme.success} />
                        <Text style={styles.metricValue}>{item.quantity} pieces</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Ionicons name="calculator" size={16} color={theme.info} />
                        <Text style={styles.metricTotal}>{(item.weight * item.quantity).toFixed(1)} kg total</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.historyStatusContainer}>
                    <ProfessionalBadge 
                      label={item.status === 'synced' ? 'Synced' : 'Pending'} 
                      variant={item.status === 'synced' ? 'success' : 'warning'} 
                      size="small"
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  )

  const WeightMeter = () => (
    <EnhancedCard style={styles.weightCard}>
      <Text style={styles.sectionTitle}>⚖️ Weight (kg)</Text>
      
      <View style={styles.weightMeterContainer}>
        <View style={styles.weightDisplay}>
          <Text style={styles.weightValue}>{weight.toFixed(1)}</Text>
          <Text style={styles.weightUnit}>kg</Text>
        </View>
        
        <View style={styles.weightMeterBar}>
          <Animated.View 
            style={[
              styles.weightFill, 
              { 
                width: weightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
        
        <View style={styles.weightControls}>
          <TouchableOpacity 
            style={styles.weightButton} 
            onPress={() => handleWeightChange(Math.max(weight - 0.5, 0))}
          >
            <Ionicons name="remove" size={20} color={theme.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.weightButton} 
            onPress={() => handleWeightChange(weight + 0.5)}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weightPresets}>
          {[0.5, 1.0, 2.5, 5.0, 10.0].map(preset => (
            <TouchableOpacity
              key={preset}
              style={styles.presetButton}
              onPress={() => handleWeightChange(preset)}
            >
              <Text style={styles.presetText}>{preset}kg</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </EnhancedCard>
  )

  const pendingCount = catchHistory.filter(entry => entry.status === 'pending').length

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LoadingOverlay visible={loading} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📖 {t('logbook.title')}</Text>
        <View style={styles.headerActions}>
          {pendingCount > 0 && (
            <ProfessionalBadge 
              label={`${pendingCount} pending`} 
              variant="warning" 
            />
          )}
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={openHistoryModal}
          >
            <Ionicons name="time" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Status */}
      <View style={[styles.networkStatus, { backgroundColor: isOnline ? '#4CAF50' : '#ff9500' }]}>
        <Ionicons 
          name={isOnline ? "wifi" : "wifi-outline"} 
          size={16} 
          color="white" 
        />
        <Text style={styles.networkText}>
          {isOnline ? t('logbook.online_sync') : t('logbook.offline_sync')}
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          
          {/* Fish Species Selection */}
          <EnhancedCard style={styles.card}>
            <Text style={styles.sectionTitle}>🐟 {t('logbook.fish_species')}</Text>
            
            {/* AI Camera Detection Button */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={openFishCamera}
            >
              <View style={styles.cameraContent}>
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={24} color="#ffffff" />
                </View>
                <View style={styles.cameraText}>
                  <Text style={styles.cameraTitle}>📸 AI Fish Detection</Text>
                  <Text style={styles.cameraSubtitle}>Take a photo to identify species automatically</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={theme.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Manual Selection */}
            <TouchableOpacity
              style={styles.speciesSelector}
              onPress={() => setShowSpeciesModal(true)}
            >
              {selectedFish ? (
                <View style={styles.selectedSpecies}>
                  <Text style={styles.selectedEmoji}>{selectedFish.emoji}</Text>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{selectedFish.name}</Text>
                    <Text style={styles.selectedCategory}>{selectedFish.category}</Text>
                    {detectedFishData && (
                      <View style={styles.aiDetectedBadge}>
                        <Ionicons name="camera" size={12} color={theme.success} />
                        <Text style={styles.aiDetectedText}>
                          AI Detected ({Math.round(detectedFishData.confidence * 100)}%)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.placeholderText}>{t('logbook.select_species_manual')}</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </EnhancedCard>

          {/* Weight Meter */}
          <WeightMeter />

          {/* Quantity */}
          <EnhancedCard style={styles.card}>
            <Text style={styles.sectionTitle}>🔢 Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
                <Ionicons name="remove-circle" size={30} color={theme.primary} />
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Text style={styles.quantityUnit}>pieces</Text>
              </View>
              
              <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                <Ionicons name="add-circle" size={30} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </EnhancedCard>

          {/* Summary */}
          {selectedFish && weight > 0 && (
            <EnhancedCard style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📝 Catch Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Species:</Text>
                <Text style={styles.summaryValue}>{selectedFish.emoji} {selectedFish.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Weight:</Text>
                <Text style={styles.summaryValue}>{weight.toFixed(1)} kg</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity:</Text>
                <Text style={styles.summaryValue}>{quantity} pieces</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total:</Text>
                <Text style={styles.summaryTotal}>{(weight * quantity).toFixed(1)} kg total</Text>
              </View>
            </EnhancedCard>
          )}

          {/* Save Button */}
          <ModernButton
            title={`🎣 ${t('logbook.log_catch')}`}
            onPress={handleSaveCatch}
            style={styles.saveButton}
            disabled={!selectedFish || weight <= 0 || quantity <= 0}
          />

        </Animated.View>
      </ScrollView>

      {/* Modals */}
      {renderSpeciesModal()}
      {renderHistoryModal()}
      
      {/* Fish Camera */}
      <FishCamera
        visible={showFishCamera}
        onSpeciesDetected={handleFishDetected}
        onCancel={handleCameraCancel}
      />
      
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyButton: {
    padding: 8,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  networkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 15,
  },
  
  // Species Selection
  speciesSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedSpecies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedEmoji: {
    fontSize: 24,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  selectedCategory: {
    fontSize: 12,
    color: theme.textMuted,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.textMuted,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  speciesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  speciesEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  speciesCategory: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  
  // Weight Meter
  weightCard: {
    marginBottom: 20,
  },
  weightMeterContainer: {
    alignItems: 'center',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.primary,
  },
  weightUnit: {
    fontSize: 18,
    color: theme.textMuted,
    marginLeft: 5,
  },
  weightMeterBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  weightControls: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  weightButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
  },
  presetText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  
  // Quantity
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  quantityButton: {
    padding: 10,
  },
  quantityDisplay: {
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
  },
  quantityUnit: {
    fontSize: 12,
    color: theme.textMuted,
  },
  
  // Summary
  summaryCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  
  // Save Button
  saveButton: {
    marginBottom: 30,
  },

  // History Modal Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyFish: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  historyFishName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  historyDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  historyMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyValue: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  historyTotal: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: 'bold',
  },

  // Enhanced Modal Styles
  enhancedModalContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 10,
    marginTop: 60,
    borderRadius: 20,
    maxHeight: '85%',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  enhancedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },

  // History Summary Styles
  historySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historySummaryCard: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 4,
  },
  historySummaryLabel: {
    fontSize: 12,
    color: theme.muted,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Enhanced Empty State
  enhancedEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  enhancedEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.muted,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  enhancedEmptyText: {
    fontSize: 16,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Enhanced History List Styles
  historyList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  enhancedHistoryItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyContentContainer: {
    flex: 1,
  },
  historyMainInfo: {
    marginBottom: 8,
  },
  enhancedHistoryFishName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 2,
  },
  enhancedHistoryDate: {
    fontSize: 13,
    color: theme.muted,
    fontWeight: '500',
  },
  historyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    color: theme.fg,
    fontWeight: '500',
    marginLeft: 6,
  },
  metricTotal: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '700',
    marginLeft: 6,
  },
  historyStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  // Fish Camera Styles
  cameraButton: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cameraContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cameraIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  cameraText: {
    flex: 1,
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  cameraSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    marginHorizontal: 16,
    textTransform: 'uppercase',
  },
  selectedInfo: {
    flex: 1,
  },
  aiDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  aiDetectedText: {
    fontSize: 11,
    color: theme.success,
    fontWeight: '600',
    marginLeft: 4,
  },
})

export default LogbookScreen
