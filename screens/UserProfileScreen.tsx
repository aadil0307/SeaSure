import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Switch,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import { theme } from "../theme/colors"
import { 
  EnhancedCard, 
  ModernButton, 
  ProfessionalBadge,
  LoadingOverlay 
} from "../components/modernUI"
import { authService, UserProfile } from "../services/auth"
import { databaseService } from "../services/database"
import { imageUploadService } from "../services/imageUpload"

const { width, height } = Dimensions.get("window")

interface UserStats {
  totalCatches: number
  totalWeight: number
  favoriteSpecies: string
  fishingDays: number
  recentCatches: any[]
  bestCatch: any
}

interface UserProfileScreenProps {
  onLogout: () => void
  onBack: () => void
}

export default function UserProfileScreen({ onLogout, onBack }: UserProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [editedData, setEditedData] = useState<Partial<UserProfile>>({})
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    loadUserProfile()
    loadUserStats()
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const loadUserProfile = async () => {
    try {
      const user = authService.getCurrentUser()
      if (user) {
        const profile = await authService.getUserProfile(user.uid)
        if (profile) {
          setUserData(profile)
          setEditedData(profile)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      Alert.alert('Error', 'Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        // Load catches from Firestore (without orderBy to avoid index requirement)
        const catchesQuery = query(
          collection(db, 'catches'),
          where('userId', '==', currentUser.uid)
        )
        
        const catchesSnapshot = await getDocs(catchesQuery)
        const catches = catchesSnapshot.docs.map(doc => doc.data())
        
        // Sort client-side by timestamp (descending)
        catches.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        
        // Calculate comprehensive statistics
        const totalCatches = catches.length
        const totalWeight = catches.reduce((sum, catch_) => sum + (catch_.weight * catch_.quantity), 0)
        
        // Find best catch (highest weight)
        let bestCatch = null
        if (catches.length > 0) {
          bestCatch = catches.reduce((best, current) => 
            (current.weight > best.weight) ? current : best
          )
        }
        
        // Find favorite species
        const speciesCount: { [key: string]: number } = {}
        catches.forEach(catch_ => {
          speciesCount[catch_.fishSpecies] = (speciesCount[catch_.fishSpecies] || 0) + 1
        })
        
        const favoriteSpecies = Object.keys(speciesCount).reduce((a, b) => 
          speciesCount[a] > speciesCount[b] ? a : b
        ) || 'None'
        
        // Calculate fishing days (unique dates)
        const uniqueDates = new Set(
          catches.map(catch_ => new Date(catch_.timestamp).toDateString())
        )
        
        // Store statistics
        const statsData: UserStats = {
          totalCatches,
          totalWeight,
          favoriteSpecies,
          fishingDays: uniqueDates.size,
          recentCatches: catches.slice(0, 5),
          bestCatch
        }
        
        setUserStats(statsData)
        
        // Store in AsyncStorage for quick access
        await AsyncStorage.setItem('userStats', JSON.stringify(statsData))
      }
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  const handleSave = async () => {
    if (!userData) return
    
    setIsSaving(true)
    try {
      await authService.updateUserProfile(userData.uid, editedData)
      setUserData({ ...userData, ...editedData })
      setIsEditing(false)
      Alert.alert("Success", "Profile updated successfully!")
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData(userData || {})
    setIsEditing(false)
  }

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true)
        try {
          const imageUrl = await imageUploadService.uploadProfilePicture(
            result.assets[0].uri,
            userData?.uid || ''
          )
          
          if (userData) {
            await authService.updateProfilePicture(userData.uid, imageUrl)
            setUserData({ ...userData, photoURL: imageUrl })
            setEditedData({ ...editedData, photoURL: imageUrl })
            Alert.alert("Success", "Profile picture updated successfully!")
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          Alert.alert('Error', 'Failed to upload image')
        } finally {
          setIsUploadingImage(false)
        }
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to open image picker')
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.signOut()
              onLogout()
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to logout')
            }
          }
        }
      ]
    )
  }

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={theme.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  )

  const ProfileField = React.useCallback(({
    label,
    value,
    onChangeText,
    multiline = false,
    editable = true,
    keyboardType = 'default',
  }: {
    label: string
    value: string
    onChangeText?: (text: string) => void
    multiline?: boolean
    editable?: boolean
    keyboardType?: 'default' | 'email-address' | 'phone-pad'
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType}
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType={multiline ? "default" : "next"}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  ), [isEditing])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <ModernButton
          title="Retry"
          onPress={loadUserProfile}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Profile */}
      <LinearGradient
        colors={[theme.primary, "#0891b2", "#06b6d4"]}
        style={styles.enhancedHeader}
      >
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity onPress={onBack} style={styles.navButton}>
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={isEditing ? handleCancel : () => setIsEditing(true)}
            style={styles.navButton}
          >
            <Ionicons
              name={isEditing ? "close" : "create-outline"}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {/* Enhanced Profile Section */}
        <Animated.View
          style={[
            styles.profileHeroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Picture with Status Ring */}
          <TouchableOpacity onPress={handleImagePicker} style={styles.avatarWrapper}>
            <View style={styles.statusRing}>
              {isUploadingImage ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : (
                <Image
                  source={{
                    uri: userData.photoURL || "https://via.placeholder.com/140x140/0891b2/ffffff?text=" + (userData.displayName?.charAt(0) || "U")
                  }}
                  style={styles.profileAvatar}
                />
              )}
              <View style={styles.editProfileIcon}>
                <Ionicons name="camera" size={22} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{userData.displayName || "Fisher"}</Text>
            <Text style={styles.userEmailText}>{userData.email}</Text>
            
            {/* Status Badges */}
            <View style={styles.statusBadges}>
              <View style={styles.statusBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.badgeText}>{userData.experience?.yearsOfFishing || 0} years</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Bar */}
          <View style={styles.quickStatsBar}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{userStats?.totalCatches || 0}</Text>
              <Text style={styles.quickStatLabel}>Catches</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{userStats?.fishingDays || 0}</Text>
              <Text style={styles.quickStatLabel}>Days</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{userStats?.totalWeight.toFixed(1) || '0.0'}kg</Text>
              <Text style={styles.quickStatLabel}>Total</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Enhanced Content Area */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 10 }}
        >

        {/* Enhanced Profile Information Cards */}
        <EnhancedCard style={StyleSheet.flatten([styles.section, { backgroundColor: '#ffffff', elevation: 3 }])}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={24} color={theme.primary} />
            <Text style={styles.enhancedSectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.profileGrid}>
            <ProfileField
              label="Full Name"
              value={editedData.displayName || userData.displayName}
              onChangeText={(text) => setEditedData({ ...editedData, displayName: text })}
            />
            
            <ProfileField
              label="Email Address"
              value={userData.email}
              editable={false}
            />
            
            <ProfileField
              label="Phone Number"
              value={editedData.phoneNumber || userData.phoneNumber || ''}
              onChangeText={(text) => setEditedData({ ...editedData, phoneNumber: text })}
              keyboardType="phone-pad"
            />
          </View>
        </EnhancedCard>

        {/* Enhanced Location Card */}
        <EnhancedCard style={StyleSheet.flatten([styles.section, { backgroundColor: '#ffffff', elevation: 3 }])}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color={theme.primary} />
            <Text style={styles.enhancedSectionTitle}>Location Details</Text>
          </View>
          
          <View style={styles.profileGrid}>
            <ProfileField
              label="State/Region"
              value={editedData.location?.state || userData.location?.state || ''}
              onChangeText={(text) => setEditedData({ 
                ...editedData, 
                location: { 
                  state: text, 
                  port: editedData.location?.port || userData.location?.port || '' 
                } 
              })}
            />
            
            <ProfileField
              label="Home Port"
              value={editedData.location?.port || userData.location?.port || ''}
              onChangeText={(text) => setEditedData({ 
                ...editedData, 
                location: { 
                  state: editedData.location?.state || userData.location?.state || '',
                  port: text 
                } 
              })}
            />
          </View>
        </EnhancedCard>

        {/* Enhanced Boat Information Card */}
        <EnhancedCard style={StyleSheet.flatten([styles.section, { backgroundColor: '#ffffff', elevation: 3 }])}>
          <View style={styles.cardHeader}>
            <Ionicons name="boat" size={24} color={theme.primary} />
            <Text style={styles.enhancedSectionTitle}>Boat Details</Text>
          </View>
          
          <View style={styles.profileGrid}>
            <ProfileField
              label="Boat Name"
              value={editedData.boatDetails?.name || userData.boatDetails?.name || ''}
              onChangeText={(text) => setEditedData({ 
                ...editedData, 
                boatDetails: { 
                  name: text,
                  registrationNumber: editedData.boatDetails?.registrationNumber || userData.boatDetails?.registrationNumber || '',
                  type: editedData.boatDetails?.type || userData.boatDetails?.type || '',
                  length: editedData.boatDetails?.length || userData.boatDetails?.length || 0
                } 
              })}
            />
            
            <ProfileField
              label="Registration Number"
              value={editedData.boatDetails?.registrationNumber || userData.boatDetails?.registrationNumber || ''}
              onChangeText={(text) => setEditedData({ 
                ...editedData, 
                boatDetails: { 
                  name: editedData.boatDetails?.name || userData.boatDetails?.name || '',
                  registrationNumber: text,
                  type: editedData.boatDetails?.type || userData.boatDetails?.type || '',
                  length: editedData.boatDetails?.length || userData.boatDetails?.length || 0
                } 
              })}
            />
            
            <ProfileField
              label="Boat Type"
              value={editedData.boatDetails?.type || userData.boatDetails?.type || ''}
              onChangeText={(text) => setEditedData({ 
                ...editedData, 
                boatDetails: { 
                  name: editedData.boatDetails?.name || userData.boatDetails?.name || '',
                  registrationNumber: editedData.boatDetails?.registrationNumber || userData.boatDetails?.registrationNumber || '',
                  type: text,
                  length: editedData.boatDetails?.length || userData.boatDetails?.length || 0
                } 
              })}
            />
          </View>
        </EnhancedCard>

        {/* Enhanced Fishing Statistics Card */}
        <EnhancedCard style={StyleSheet.flatten([styles.section, { backgroundColor: '#ffffff', elevation: 3 }])}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={24} color={theme.primary} />
            <Text style={styles.enhancedSectionTitle}>Fishing Statistics</Text>
          </View>
          
          {userStats ? (
            <View style={styles.statisticsGrid}>
              <View style={styles.statsRowEnhanced}>
                <View style={styles.statCardEnhanced}>
                  <Ionicons name="fish" size={28} color={theme.primary} />
                  <Text style={styles.statNumberLarge}>{userStats.totalCatches}</Text>
                  <Text style={styles.statLabelEnhanced}>Total Catches</Text>
                </View>
                
                <View style={styles.statCardEnhanced}>
                  <Ionicons name="barbell" size={28} color={theme.success} />
                  <Text style={styles.statNumberLarge}>{userStats.totalWeight.toFixed(1)}kg</Text>
                  <Text style={styles.statLabelEnhanced}>Total Weight</Text>
                </View>
              </View>
              
              <View style={styles.statsRowEnhanced}>
                <View style={styles.statCardEnhanced}>
                  <Ionicons name="calendar" size={28} color={theme.info} />
                  <Text style={styles.statNumberLarge}>{userStats.fishingDays}</Text>
                  <Text style={styles.statLabelEnhanced}>Fishing Days</Text>
                </View>
                
                <View style={styles.statCardEnhanced}>
                  <Ionicons name="heart" size={28} color={theme.danger} />
                  <Text style={styles.statNumberSmall}>{userStats.favoriteSpecies}</Text>
                  <Text style={styles.statLabelEnhanced}>Favorite Species</Text>
                </View>
              </View>
              
              {userStats.bestCatch && (
                <View style={styles.bestCatchCardEnhanced}>
                  <View style={styles.trophyHeader}>
                    <Ionicons name="trophy" size={24} color="#FFD700" />
                    <Text style={styles.bestCatchTitleEnhanced}>Best Catch Record</Text>
                  </View>
                  <Text style={styles.bestCatchDetailsEnhanced}>
                    {userStats.bestCatch.fishSpecies} • {userStats.bestCatch.weight}kg
                  </Text>
                  <Text style={styles.bestCatchDateEnhanced}>
                    Caught on {new Date(userStats.bestCatch.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loadingStatsEnhanced}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingTextEnhanced}>Loading fishing statistics...</Text>
            </View>
          )}
        </EnhancedCard>

        {/* Enhanced Recent Activity Card */}
        <EnhancedCard style={StyleSheet.flatten([styles.section, { backgroundColor: '#ffffff', elevation: 3 }])}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color={theme.primary} />
            <Text style={styles.enhancedSectionTitle}>Recent Activity</Text>
          </View>
          
          {userStats?.recentCatches && userStats.recentCatches.length > 0 ? (
            <View style={styles.activityListEnhanced}>
              {userStats.recentCatches.map((catch_, index) => (
                <View key={index} style={styles.activityItemEnhanced}>
                  <View style={styles.activityIconEnhanced}>
                    <Ionicons name="fish" size={18} color="#ffffff" />
                  </View>
                  <View style={styles.activityContentEnhanced}>
                    <Text style={styles.activityTitleEnhanced}>{catch_.fishSpecies}</Text>
                    <Text style={styles.activityDetailsEnhanced}>
                      {catch_.quantity} pieces • {catch_.weight}kg each
                    </Text>
                    <Text style={styles.activityDateEnhanced}>
                      {new Date(catch_.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <ProfessionalBadge 
                    label={catch_.status || 'synced'} 
                    variant="success"
                    size="small"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivityEnhanced}>
              <Ionicons name="fish-outline" size={64} color={theme.muted} />
              <Text style={styles.emptyTextEnhanced}>No catches recorded yet</Text>
              <Text style={styles.emptySubtextEnhanced}>Start logging your catches in the logbook to see your activity here!</Text>
            </View>
          )}
        </EnhancedCard>

        {/* Enhanced Action Buttons */}
        <View style={styles.enhancedButtonContainer}>
          {isEditing ? (
            <>
              <ModernButton
                title={isSaving ? "Saving Changes..." : "💾 Save Changes"}
                onPress={handleSave}
                loading={isSaving}
                style={styles.saveButtonEnhanced}
              />
              <ModernButton
                title="❌ Cancel Changes"
                onPress={handleCancel}
                variant="ghost"
                disabled={isSaving}
                style={styles.cancelButton}
              />
            </>
          ) : (
            <ModernButton
              title="🚪 Logout"
              onPress={handleLogout}
              variant="danger"
              style={styles.logoutButtonEnhanced}
            />
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.muted,
  },
  errorText: {
    fontSize: 16,
    color: theme.danger,
    marginBottom: 16,
  },

  // Enhanced Header Styles
  enhancedHeader: {
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  navigationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  navButton: {
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: 'center',
  },

  // Enhanced Profile Section
  profileHeroSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarWrapper: {
    marginBottom: 20,
  },
  statusRing: {
    position: "relative",
    padding: 4,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  editProfileIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: theme.primary,
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  // User Info Styles
  userInfo: {
    alignItems: "center",
    marginBottom: 25,
  },
  displayName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: 'center',
  },
  userEmailText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 15,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Quick Stats Bar
  quickStatsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'space-around',
    minWidth: width * 0.8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: "#ffffff",
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: '500',
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 15,
  },

  // Legacy Header Styles (kept for compatibility)
  header: {
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  avatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Content and Other Styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Enhanced Card Styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E5E7EB',
  },
  enhancedSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.fg,
    marginLeft: 12,
  },
  profileGrid: {
    gap: 16,
  },

  // Enhanced Statistics Styles
  statisticsGrid: {
    marginTop: 16,
  },
  statsRowEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCardEnhanced: {
    backgroundColor: theme.bgCard || '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.border || '#E5E7EB',
  },
  statNumberLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.fg,
    marginTop: 12,
    marginBottom: 6,
  },
  statNumberSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.fg,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  statLabelEnhanced: {
    fontSize: 13,
    color: theme.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  bestCatchCardEnhanced: {
    backgroundColor: '#FFF7ED',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  trophyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestCatchTitleEnhanced: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 8,
  },
  bestCatchDetailsEnhanced: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 4,
    fontWeight: '600',
  },
  bestCatchDateEnhanced: {
    fontSize: 14,
    color: '#A16207',
    fontWeight: '500',
  },
  loadingStatsEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingTextEnhanced: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.muted,
    fontWeight: '500',
  },

  // Enhanced Activity Styles
  activityListEnhanced: {
    marginTop: 16,
  },
  activityItemEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.bgCard || '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: theme.border || '#E5E7EB',
  },
  activityIconEnhanced: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  activityContentEnhanced: {
    flex: 1,
  },
  activityTitleEnhanced: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 2,
  },
  activityDetailsEnhanced: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 2,
  },
  activityDateEnhanced: {
    fontSize: 12,
    color: theme.muted,
    fontWeight: '500',
  },
  emptyActivityEnhanced: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTextEnhanced: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.muted,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtextEnhanced: {
    fontSize: 16,
    color: theme.muted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Enhanced Button Styles
  enhancedButtonContainer: {
    paddingVertical: 30,
    paddingBottom: 50,
    gap: 16,
  },
  saveButtonEnhanced: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: theme.border || '#E5E7EB',
  },
  logoutButtonEnhanced: {
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Legacy Styles (kept for compatibility)
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.fg,
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: theme.muted,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.fg,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.muted,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: theme.fg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 8,
    minHeight: 44,
  },
  fieldInput: {
    fontSize: 16,
    color: theme.fg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.muted,
    minHeight: 44,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  saveButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 20,
  },
  
  // Statistics styles
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: theme.muted,
    textAlign: 'center',
  },
  bestCatchCard: {
    backgroundColor: theme.bgCard,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  bestCatchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 4,
  },
  bestCatchDetails: {
    fontSize: 14,
    color: theme.fg,
    marginBottom: 2,
  },
  bestCatchDate: {
    fontSize: 12,
    color: theme.muted,
  },
  loadingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  // Activity styles
  activityList: {
    marginTop: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.bgCard,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.fg,
  },
  activityDetails: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 2,
  },
  activityDate: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 2,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.muted,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.muted,
    marginTop: 4,
    textAlign: 'center',
  },
})
