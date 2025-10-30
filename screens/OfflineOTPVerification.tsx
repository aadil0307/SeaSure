import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../theme/colors'
import { offlineOTPAuth } from '../services/offlineOTPAuth'
import { useNetworkState } from '../utils/networkState'

const { width } = Dimensions.get('window')

interface VerificationMethod {
  id: 'sms' | 'pregenerated' | 'timebased' | 'emergency'
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  available: boolean
  requiresInternet: boolean
}

interface OfflineOTPVerificationProps {
  phoneNumber: string
  onVerificationSuccess: (method: string) => void
  onCancel: () => void
}

export default function OfflineOTPVerification({
  phoneNumber,
  onVerificationSuccess,
  onCancel
}: OfflineOTPVerificationProps) {
  const [otp, setOtp] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('sms')
  const [isVerifying, setIsVerifying] = useState(false)
  const [authStatus, setAuthStatus] = useState({
    hasTokens: false,
    tokenCount: 0,
    hasDeviceAuth: false,
    canUseEmergency: false
  })
  const [emergencyCode, setEmergencyCode] = useState('')
  
  const { isConnected, refreshNetworkState } = useNetworkState()

  useEffect(() => {
    checkNetworkStatus()
    checkOfflineAuthAvailability()
  }, [])

  const checkNetworkStatus = async () => {
    // Simple connectivity check - you can enhance this
    await refreshNetworkState()
  }

  const checkOfflineAuthAvailability = async () => {
    const status = await offlineOTPAuth.isOfflineAuthAvailable(phoneNumber)
    setAuthStatus(status)
    
    // Auto-select best available method
    if (!isConnected) {
      if (status.hasTokens) {
        setSelectedMethod('pregenerated')
      } else if (status.hasDeviceAuth) {
        setSelectedMethod('timebased')
      } else {
        setSelectedMethod('emergency')
      }
    }
  }

  const generateEmergencyCode = async () => {
    const code = await offlineOTPAuth.generateEmergencyCode(phoneNumber)
    setEmergencyCode(code)
    Alert.alert(
      'Emergency Access Code',
      `Your emergency code is: ${code}\n\nThis code is valid for today only and should be used only when other methods fail.`,
      [{ text: 'OK' }]
    )
  }

  const handleVerification = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the verification code')
      return
    }

    setIsVerifying(true)

    try {
      if (selectedMethod === 'sms' && isConnected) {
        // Handle SMS OTP verification with your existing service
        // This would be your normal SMS verification logic
        await handleSMSVerification()
      } else {
        // Handle offline verification
        const result = await offlineOTPAuth.verifyOfflineOTP(phoneNumber, otp)
        
        if (result.isValid) {
          Alert.alert(
            'Verification Successful',
            `Verified using ${result.method} method${
              result.remainingTokens !== undefined 
                ? `\n\nRemaining tokens: ${result.remainingTokens}` 
                : ''
            }`,
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
            'The code you entered is invalid. Please try again or use a different method.'
          )
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      Alert.alert('Error', 'An error occurred during verification. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSMSVerification = async () => {
    // Implement your SMS verification logic here
    // This is just a placeholder
    Alert.alert('SMS Verification', 'SMS verification would be implemented here')
  }

  const handleRegenerateTokens = async () => {
    if (!isConnected) {
      Alert.alert('No Internet', 'Internet connection required to generate new tokens')
      return
    }

    Alert.alert(
      'Generate Offline Tokens',
      'This will generate new verification tokens for offline use. Make sure you have a stable internet connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            const success = await offlineOTPAuth.preGenerateOfflineTokens(phoneNumber)
            if (success) {
              Alert.alert('Success', 'Offline tokens generated successfully!')
              checkOfflineAuthAvailability()
            } else {
              Alert.alert('Error', 'Failed to generate offline tokens')
            }
          }
        }
      ]
    )
  }

  const verificationMethods: VerificationMethod[] = [
    {
      id: 'sms',
      title: 'SMS OTP',
      description: 'Receive code via SMS',
      icon: 'chatbubble-outline',
      available: isConnected,
      requiresInternet: true
    },
    {
      id: 'pregenerated',
      title: 'Offline Tokens',
      description: `Pre-generated codes (${authStatus.tokenCount} remaining)`,
      icon: 'key-outline',
      available: authStatus.hasTokens,
      requiresInternet: false
    },
    {
      id: 'timebased',
      title: 'Device Authentication',
      description: 'Time-based device verification',
      icon: 'phone-portrait-outline',
      available: authStatus.hasDeviceAuth,
      requiresInternet: false
    },
    {
      id: 'emergency',
      title: 'Emergency Access',
      description: 'Daily emergency bypass code',
      icon: 'shield-checkmark-outline',
      available: true,
      requiresInternet: false
    }
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Phone Number</Text>
      </View>

      {/* Network Status */}
      <View style={[
        styles.networkStatus,
        { backgroundColor: isConnected ? '#D1FAE5' : '#FEF2F2' }
      ]}>
        <Ionicons 
          name={isConnected ? 'checkmark-circle' : 'close-circle'} 
          size={20} 
          color={isConnected ? '#10B981' : '#EF4444'} 
        />
        <Text style={[
          styles.networkStatusText,
          { color: isConnected ? '#10B981' : '#EF4444' }
        ]}>
          {isConnected ? 'Online - All methods available' : 'Offline - Using offline verification'}
        </Text>
      </View>

      {/* Phone Number Display */}
      <View style={styles.phoneDisplay}>
        <Text style={styles.phoneLabel}>Verifying</Text>
        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
      </View>

      {/* Verification Methods */}
      <View style={styles.methodsContainer}>
        <Text style={styles.sectionTitle}>Choose Verification Method</Text>
        
        {verificationMethods.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              !method.available && styles.methodCardDisabled,
              selectedMethod === method.id && styles.methodCardSelected
            ]}
            onPress={() => method.available && setSelectedMethod(method.id)}
            disabled={!method.available}
          >
            <View style={styles.methodIcon}>
              <Ionicons 
                name={method.icon} 
                size={24} 
                color={method.available ? theme.primary : theme.muted} 
              />
            </View>
            
            <View style={styles.methodInfo}>
              <Text style={[
                styles.methodTitle,
                !method.available && styles.methodTitleDisabled
              ]}>
                {method.title}
              </Text>
              <Text style={styles.methodDescription}>
                {method.description}
              </Text>
              {method.requiresInternet && !isConnected && (
                <Text style={styles.requiresInternet}>Requires internet connection</Text>
              )}
            </View>
            
            {selectedMethod === method.id && method.available && (
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Code Generator */}
      {selectedMethod === 'emergency' && (
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>Emergency Access Code</Text>
          <Text style={styles.emergencyDescription}>
            Generate a daily emergency code that works without internet connection.
          </Text>
          
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateEmergencyCode}
          >
            <Ionicons name="shield-checkmark" size={20} color="white" />
            <Text style={styles.generateButtonText}>Generate Emergency Code</Text>
          </TouchableOpacity>
          
          {emergencyCode && (
            <View style={styles.emergencyCodeDisplay}>
              <Text style={styles.emergencyCodeLabel}>Today's Emergency Code:</Text>
              <Text style={styles.emergencyCodeText}>{emergencyCode}</Text>
              <Text style={styles.emergencyCodeNote}>
                Enter this code in the verification field above
              </Text>
            </View>
          )}
        </View>
      )}

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        <Text style={styles.otpLabel}>Enter Verification Code</Text>
        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit code"
          keyboardType="number-pad"
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="sms-otp"
        />
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.verifyButton,
          (!otp.trim() || isVerifying) && styles.verifyButtonDisabled
        ]}
        onPress={handleVerification}
        disabled={!otp.trim() || isVerifying}
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

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        
        {isConnected && authStatus.tokenCount < 5 && (
          <TouchableOpacity style={styles.helpItem} onPress={handleRegenerateTokens}>
            <Ionicons name="refresh" size={20} color={theme.primary} />
            <Text style={styles.helpText}>Generate Offline Tokens</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.helpItem}>
          <Ionicons name="help-circle" size={20} color={theme.primary} />
          <Text style={styles.helpText}>How does offline verification work?</Text>
        </TouchableOpacity>
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
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  networkStatusText: {
    fontSize: 14,
    fontWeight: '600',
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
  methodsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodCardSelected: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(15, 118, 110, 0.05)',
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 4,
  },
  methodTitleDisabled: {
    color: theme.muted,
  },
  methodDescription: {
    fontSize: 14,
    color: theme.muted,
  },
  requiresInternet: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  generateButtonText: {
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
  },
  emergencyCodeNote: {
    fontSize: 12,
    color: theme.muted,
    textAlign: 'center',
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpLabel: {
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
  helpSection: {
    backgroundColor: 'rgba(15, 118, 110, 0.05)',
    padding: 20,
    borderRadius: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  helpText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
})