// Integration Example for App.tsx

import React, { useState, useEffect } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import AuthManager from './screens/AuthManager'
import MainApp from './MainApp' // Your main app component
import { offlineOTPAuth } from './services/offlineOTPAuth'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsLoading(false)
      
      if (user) {
        // User is signed in
        console.log('User authenticated:', user.email)
        setShowAuth(false)
        
        // If user has phone number, prepare offline tokens
        if (user.phoneNumber) {
          prepareOfflineAuth(user.phoneNumber)
        }
      } else {
        // User is signed out
        console.log('User not authenticated')
        setShowAuth(true)
      }
    })

    return unsubscribe
  }, [])

  const prepareOfflineAuth = async (phoneNumber: string) => {
    try {
      const status = await offlineOTPAuth.isOfflineAuthAvailable(phoneNumber)
      
      if (status.tokenCount < 5) {
        console.log('📱 Preparing offline authentication for maritime use...')
        await offlineOTPAuth.preGenerateOfflineTokens(phoneNumber)
        console.log('✅ Offline authentication ready!')
        
        // Optionally show a non-intrusive notification to user
        // Alert.alert(
        //   'Offline Mode Ready',
        //   'Your phone has been prepared for offline verification when you\'re in remote fishing areas.',
        //   [{ text: 'OK' }]
        // )
      }
    } catch (error) {
      console.error('Failed to prepare offline auth:', error)
    }
  }

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser)
    setShowAuth(false)
  }

  const handleShowAuth = () => {
    setShowAuth(true)
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (showAuth || !user) {
    return (
      <AuthManager
        onAuthenticated={handleAuthenticated}
        onBack={() => setShowAuth(false)}
      />
    )
  }

  // User is authenticated, show main app
  return (
    <MainApp 
      user={user}
      onShowAuth={handleShowAuth}
    />
  )
}

/*
Example usage in your existing components:

1. In LoginScreen.tsx - Phone login button:
```tsx
<TouchableOpacity
  style={styles.phoneLoginButton}
  onPress={() => {
    // This will trigger OTP verification screen
    onPhoneVerificationNeeded(phoneNumber)
  }}
>
  <Text>Login with Phone (Offline Support)</Text>
</TouchableOpacity>
```

2. In SettingsScreen.tsx - Offline preparation:
```tsx
import { offlineOTPAuth } from '../services/offlineOTPAuth'

const SettingsScreen = () => {
  const prepareForOfflineUse = async () => {
    if (user.phoneNumber) {
      const success = await offlineOTPAuth.preGenerateOfflineTokens(user.phoneNumber)
      Alert.alert(
        success ? 'Success' : 'Error',
        success 
          ? 'Your device is now prepared for offline verification in remote areas!'
          : 'Failed to prepare offline verification. Please check your internet connection.'
      )
    }
  }

  return (
    <TouchableOpacity onPress={prepareForOfflineUse}>
      <Text>Prepare for Offshore Use</Text>
    </TouchableOpacity>
  )
}
```

3. In any screen where user might need to re-authenticate:
```tsx
import OfflineOTPVerification from '../screens/OfflineOTPVerification'

const [showOTPVerification, setShowOTPVerification] = useState(false)

// When user needs to verify identity for sensitive operations
if (showOTPVerification) {
  return (
    <OfflineOTPVerification
      phoneNumber={user.phoneNumber}
      onVerificationSuccess={(method) => {
        console.log(`Verified via ${method}`)
        setShowOTPVerification(false)
        // Proceed with sensitive operation
      }}
      onCancel={() => setShowOTPVerification(false)}
    />
  )
}
```

4. Testing the offline functionality:
```tsx
// Add to your SettingsScreen for testing
const testOfflineAuth = async () => {
  const phoneNumber = '+1234567890' // Your test number
  
  // 1. Generate emergency code
  const emergencyCode = await offlineOTPAuth.generateEmergencyCode(phoneNumber)
  console.log('Emergency code:', emergencyCode)
  
  // 2. Test time-based OTP
  const timeOTP = await offlineOTPAuth.generateTimeBasedOTP(phoneNumber)
  console.log('Time-based OTP:', timeOTP)
  
  // 3. Check offline auth status
  const status = await offlineOTPAuth.isOfflineAuthAvailable(phoneNumber)
  console.log('Offline auth status:', status)
  
  Alert.alert(
    'Offline Auth Test',
    `Emergency: ${emergencyCode}\nTime-based: ${timeOTP}\nTokens: ${status.tokenCount}`
  )
}
```
*/