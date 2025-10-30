import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../theme/colors'
import { trueOfflineOTP } from '../services/trueOfflineOTP'

const { width } = Dimensions.get('window')

interface TrueOfflineOTPProps {
  phoneNumber: string
  onVerificationSuccess: (method: string) => void
  onCancel: () => void
}

export default function TrueOfflineOTPScreen({
  phoneNumber,
  onVerificationSuccess,
  onCancel
}: TrueOfflineOTPProps) {
  const [enteredOTP, setEnteredOTP] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentOTP, setCurrentOTP] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [emergencyCode, setEmergencyCode] = useState<string>('')
  const [showEmergencyCode, setShowEmergencyCode] = useState(false)
  const [otpStatus, setOtpStatus] = useState<{
    available: boolean
    initialized: boolean
    deviceMatches: boolean
  }>({ available: false, initialized: false, deviceMatches: false })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    initializeOfflineOTP()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (timeRemaining > 0) {
      const progress = timeRemaining / (5 * 60 * 1000) // 5 minutes
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start()
    }
  }, [timeRemaining])

  const initializeOfflineOTP = async () => {
    try {
      // Check if already initialized
      const status = await trueOfflineOTP.isOfflineOTPAvailable(phoneNumber)
      setOtpStatus(status)

      if (!status.initialized) {
        // Initialize for the first time
        console.log('🔧 Initializing offline OTP for first use...')
        await trueOfflineOTP.initializeOfflineOTP(phoneNumber)
        const newStatus = await trueOfflineOTP.isOfflineOTPAvailable(phoneNumber)
        setOtpStatus(newStatus)
      }

      if (status.available || !status.initialized) {
        // Generate initial OTP and start timer
        await generateNewOTP()
        startOTPTimer()
      }
    } catch (error) {
      console.error('Error initializing offline OTP:', error)
      Alert.alert(
        'Initialization Error',
        'Could not initialize offline OTP system. Please try again.'
      )
    }
  }

  const generateNewOTP = async () => {
    try {
      const result = await trueOfflineOTP.generateOfflineOTP(phoneNumber)
      setCurrentOTP(result.otp)
      setTimeRemaining(result.expiresAt - Date.now())
      console.log('📱 New OTP generated:', result.otp)
      
      // Immediately show the OTP to the user
      Alert.alert(
        '📱 Your Verification Code',
        `Your OTP is: ${result.otp}\n\nThis code was generated locally on your device without requiring internet connection.\n\nPlease enter this code in the field below to continue.`,
        [
          { 
            text: 'Got it!', 
            style: 'default'
          }
        ]
      )
    } catch (error) {
      console.error('Error generating OTP:', error)
      Alert.alert('Error', 'Could not generate OTP. Please try emergency code.')
    }
  }

  const startOTPTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(async () => {
      const current = await trueOfflineOTP.getCurrentValidOTP(phoneNumber)
      
      if (current.timeRemaining && current.timeRemaining > 0) {
        setTimeRemaining(current.timeRemaining)
        if (current.otp !== currentOTP) {
          setCurrentOTP(current.otp)
        }
      } else {
        // Generate new OTP when current expires
        await generateNewOTP()
      }
    }, 1000)
  }

  const handleVerifyOTP = async () => {
    if (!enteredOTP.trim()) {
      Alert.alert('Error', 'Please enter the verification code')
      return
    }

    setIsVerifying(true)

    try {
      const result = await trueOfflineOTP.verifyOfflineOTP(phoneNumber, enteredOTP.trim())
      
      if (result.isValid) {
        Alert.alert(
          'Verification Successful! 🎉',
          `Verified using ${result.method} method.\n\nYou can now access your SeaSure account offline.`,
          [
            {
              text: 'Continue',
              onPress: () => onVerificationSuccess(result.method)
            }
          ]
        )
      } else {
        Alert.alert(
          'Verification Failed',
          'The code you entered is invalid or expired. Please try again or use the emergency code.'
        )
        setEnteredOTP('')
      }
    } catch (error) {
      console.error('Verification error:', error)
      Alert.alert('Error', 'An error occurred during verification. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGenerateEmergencyCode = async () => {
    try {
      const code = await trueOfflineOTP.generateEmergencyCode(phoneNumber)
      setEmergencyCode(code)
      setShowEmergencyCode(true)
      
      Alert.alert(
        'Emergency Access Code Generated 🚨',
        `Your emergency code is: ${code}\n\nThis code works for 24 hours and should only be used when the regular OTP system fails.\n\nEnter this code in the verification field above.`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Error generating emergency code:', error)
      Alert.alert('Error', 'Could not generate emergency code. Please try again.')
    }
  }

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!otpStatus.initialized) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="settings" size={48} color={theme.primary} />
          <Text style={styles.loadingText}>Setting up offline authentication...</Text>
        </View>
      </View>
    )
  }

  if (!otpStatus.deviceMatches) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Device Mismatch</Text>
          <Text style={styles.errorText}>
            This phone number was set up for offline authentication on a different device. 
            Please use the original device or contact support.
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Offline Verification</Text>
      </View>

      {/* Offline Status */}
      <View style={styles.offlineStatus}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <Text style={styles.offlineStatusText}>
          🔒 Secure offline authentication - No internet required
        </Text>
      </View>

      {/* Phone Number Display */}
      <View style={styles.phoneDisplay}>
        <Text style={styles.phoneLabel}>Verifying</Text>
        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
      </View>

      {/* Current OTP Display */}
      {currentOTP && (
        <View style={styles.otpDisplayContainer}>
          <View style={styles.otpDisplayHeader}>
            <Ionicons name="key" size={24} color={theme.primary} />
            <Text style={styles.otpDisplayLabel}>Your Verification Code</Text>
          </View>
          <View style={styles.otpDisplay}>
            <Text style={styles.otpDisplayCode}>{currentOTP}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Alert.alert('Code Copied', `OTP ${currentOTP} ready to paste!`)
              }}
            >
              <Ionicons name="copy-outline" size={20} color={theme.primary} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={theme.muted} />
            <Text style={styles.timerText}>Expires in: {formatTime(timeRemaining)}</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Refresh Button */}
      {currentOTP && (
        <TouchableOpacity style={styles.refreshButton} onPress={generateNewOTP}>
          <Ionicons name="refresh" size={20} color={theme.primary} />
          <Text style={styles.refreshButtonText}>Generate New Code</Text>
        </TouchableOpacity>
      )}

      {/* OTP Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Enter Verification Code</Text>
        <TextInput
          style={styles.otpInput}
          value={enteredOTP}
          onChangeText={setEnteredOTP}
          placeholder="Enter 6-digit code"
          keyboardType="number-pad"
          maxLength={8} // Allow emergency codes too
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.verifyButton,
          (!enteredOTP.trim() || isVerifying) && styles.verifyButtonDisabled
        ]}
        onPress={handleVerifyOTP}
        disabled={!enteredOTP.trim() || isVerifying}
      >
        {isVerifying ? (
          <Text style={styles.verifyButtonText}>Verifying...</Text>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Emergency Section */}
      <View style={styles.emergencySection}>
        <Text style={styles.emergencyTitle}>Need Emergency Access?</Text>
        <Text style={styles.emergencyDescription}>
          If the regular OTP is not working, you can generate a 24-hour emergency code.
        </Text>
        
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleGenerateEmergencyCode}
        >
          <Ionicons name="warning" size={20} color="white" />
          <Text style={styles.emergencyButtonText}>Generate Emergency Code</Text>
        </TouchableOpacity>
        
        {showEmergencyCode && emergencyCode && (
          <View style={styles.emergencyCodeDisplay}>
            <Text style={styles.emergencyCodeLabel}>Emergency Code:</Text>
            <Text style={styles.emergencyCodeText}>{emergencyCode}</Text>
            <Text style={styles.emergencyCodeNote}>
              Enter this code above. Valid for 24 hours.
            </Text>
          </View>
        )}
      </View>

      {/* How it Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.howItWorksTitle}>🔧 How Offline OTP Works</Text>
        <View style={styles.howItWorksList}>
          <View style={styles.howItWorksItem}>
            <Ionicons name="phone-portrait" size={16} color={theme.primary} />
            <Text style={styles.howItWorksText}>
              Codes are generated locally on your device using secure algorithms
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Ionicons name="time" size={16} color={theme.primary} />
            <Text style={styles.howItWorksText}>
              Each code is valid for 5 minutes and automatically refreshes
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
            <Text style={styles.howItWorksText}>
              No internet connection required - perfect for offshore fishing
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.muted,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.fg,
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  offlineStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    flex: 1,
  },
  phoneDisplay: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  phoneLabel: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
  },
  otpDisplayContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpDisplayLabel: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 12,
    textAlign: 'center',
  },
  otpDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpDisplayCode: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 8,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerContainer: {
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    color: theme.muted,
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 12,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    padding: 18,
    borderRadius: 16,
    marginBottom: 32,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  emergencySection: {
    backgroundColor: '#FEF2F2',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 16,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyCodeDisplay: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyCodeLabel: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 8,
  },
  emergencyCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 4,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emergencyCodeNote: {
    fontSize: 12,
    color: theme.muted,
    textAlign: 'center',
  },
  howItWorksSection: {
    backgroundColor: 'rgba(15, 118, 110, 0.05)',
    padding: 20,
    borderRadius: 16,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 16,
  },
  howItWorksList: {
    gap: 12,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  howItWorksText: {
    flex: 1,
    fontSize: 14,
    color: theme.muted,
    lineHeight: 18,
  },
  cancelButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for enhanced OTP display
  otpDisplayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
})