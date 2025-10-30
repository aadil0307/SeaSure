import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../theme/colors'
import { offlineOTPAuth } from '../services/offlineOTPAuth'
import OfflineOTPVerification from '../screens/OfflineOTPVerification'

// Add this component to your SettingsScreen or create a debug menu
export default function OfflineAuthTestPanel() {
  const [testPhoneNumber, setTestPhoneNumber] = useState('+1234567890')
  const [showOTPScreen, setShowOTPScreen] = useState(false)
  const [testResults, setTestResults] = useState('')

  const testGenerateTokens = async () => {
    try {
      const success = await offlineOTPAuth.preGenerateOfflineTokens(testPhoneNumber)
      Alert.alert(
        'Generate Tokens',
        success ? 'Successfully generated offline tokens!' : 'Failed to generate tokens'
      )
    } catch (error: any) {
      Alert.alert('Error', `Failed to generate tokens: ${error?.message || 'Unknown error'}`)
    }
  }

  const testEmergencyCode = async () => {
    try {
      const code = await offlineOTPAuth.generateEmergencyCode(testPhoneNumber)
      Alert.alert(
        'Emergency Code',
        `Today's emergency code: ${code}\n\nThis code can be used for offline verification.`,
        [
          { text: 'Copy Code', onPress: () => setTestResults(code) },
          { text: 'OK' }
        ]
      )
    } catch (error: any) {
      Alert.alert('Error', `Failed to generate emergency code: ${error?.message || 'Unknown error'}`)
    }
  }

  const testTimeBasedOTP = async () => {
    try {
      const otp = await offlineOTPAuth.generateTimeBasedOTP(testPhoneNumber)
      Alert.alert(
        'Time-based OTP',
        `Generated OTP: ${otp}\n\nThis OTP is valid for 5 minutes and works offline.`,
        [
          { text: 'Copy OTP', onPress: () => setTestResults(otp || '') },
          { text: 'OK' }
        ]
      )
    } catch (error: any) {
      Alert.alert('Error', `Failed to generate time-based OTP: ${error?.message || 'Unknown error'}`)
    }
  }

  const checkAuthStatus = async () => {
    try {
      const status = await offlineOTPAuth.isOfflineAuthAvailable(testPhoneNumber)
      Alert.alert(
        'Offline Auth Status',
        `Available tokens: ${status.tokenCount}\nDevice auth: ${status.hasDeviceAuth ? 'Yes' : 'No'}\nEmergency access: ${status.canUseEmergency ? 'Yes' : 'No'}`
      )
    } catch (error: any) {
      Alert.alert('Error', `Failed to check auth status: ${error?.message || 'Unknown error'}`)
    }
  }

  const testVerifyOTP = (otp: string) => {
    setShowOTPScreen(true)
  }

  if (showOTPScreen) {
    return (
      <OfflineOTPVerification
        phoneNumber={testPhoneNumber}
        onVerificationSuccess={(method) => {
          Alert.alert(
            'Verification Success!',
            `Successfully verified using ${method} method`,
            [{ text: 'OK', onPress: () => setShowOTPScreen(false) }]
          )
        }}
        onCancel={() => setShowOTPScreen(false)}
      />
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Offline OTP Testing</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Test Phone Number:</Text>
        <TextInput
          style={styles.input}
          value={testPhoneNumber}
          onChangeText={setTestPhoneNumber}
          placeholder="+1234567890"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={testGenerateTokens}>
          <Ionicons name="key" size={20} color="white" />
          <Text style={styles.buttonText}>Generate Offline Tokens</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testEmergencyCode}>
          <Ionicons name="shield-checkmark" size={20} color="white" />
          <Text style={styles.buttonText}>Get Emergency Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testTimeBasedOTP}>
          <Ionicons name="time" size={20} color="white" />
          <Text style={styles.buttonText}>Generate Time OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={checkAuthStatus}>
          <Ionicons name="information-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Check Auth Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, styles.primaryButton]} 
          onPress={() => setShowOTPScreen(true)}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Test OTP Verification</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsLabel}>Test Result:</Text>
          <Text style={styles.resultsText}>{testResults}</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setTestResults('')}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>💡 How to Test:</Text>
        <Text style={styles.infoText}>
          1. Generate offline tokens first{'\n'}
          2. Get emergency code for today{'\n'}
          3. Generate time-based OTP{'\n'}
          4. Test verification with any code{'\n'}
          5. Try in airplane mode to test offline
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.muted,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
  clearButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  clearButtonText: {
    color: theme.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0891b2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0e7490',
    lineHeight: 20,
  },
})