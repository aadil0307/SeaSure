import React, { useState, useRef } from "react"
import { View, StyleSheet, Animated } from "react-native"
import LoginScreen from "./LoginScreen"
import RegisterScreen from "./RegisterScreen"
import UserProfileScreen from "./UserProfileScreen"
import TrueOfflineOTPScreen from "./TrueOfflineOTPScreen"
import { User } from "firebase/auth"
import { trueOfflineOTP } from "../services/trueOfflineOTP"

type AuthState = "login" | "register" | "authenticated" | "profile" | "otp_verification"

interface AuthManagerProps {
  onAuthenticated: (user: User) => void
  onBack: () => void
}

export default function AuthManager({ onAuthenticated, onBack }: AuthManagerProps) {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string>("")

  // Animation for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
    
    setTimeout(callback, 200)
  }

  const handleLogin = async (user: User, phoneNumber?: string) => {
    setCurrentUser(user)
    
    // If phone number provided, prepare offline authentication
    if (phoneNumber) {
      try {
        await trueOfflineOTP.initializeOfflineOTP(phoneNumber)
        console.log('✅ Offline authentication prepared for:', phoneNumber)
      } catch (error) {
        console.error('Failed to prepare offline auth:', error)
      }
    }
    
    animateTransition(() => {
      setAuthState("authenticated")
      onAuthenticated(user)
    })
  }

  const handleRegister = async (user: User, phoneNumber?: string) => {
    setCurrentUser(user)
    
    // If phone number provided, prepare offline authentication
    if (phoneNumber) {
      try {
        await trueOfflineOTP.initializeOfflineOTP(phoneNumber)
        console.log('✅ Offline authentication prepared for:', phoneNumber)
      } catch (error) {
        console.error('Failed to prepare offline auth:', error)
      }
    }
    
    animateTransition(() => {
      setAuthState("authenticated")
      onAuthenticated(user)
    })
  }

  const handlePhoneVerificationNeeded = (phoneNumber: string) => {
    setPendingPhoneNumber(phoneNumber)
    animateTransition(() => {
      setAuthState("otp_verification")
    })
  }

  const handleOTPVerificationSuccess = (method: string) => {
    console.log(`Phone verified via ${method} method`)
    
    // Create user session for phone-only authentication
    let userToAuthenticate = currentUser
    
    if (!userToAuthenticate && pendingPhoneNumber) {
      // Create a temporary user object for phone-only authentication
      userToAuthenticate = {
        uid: `phone_${pendingPhoneNumber.replace(/\D/g, '')}`,
        phoneNumber: pendingPhoneNumber,
        displayName: `User ${pendingPhoneNumber.slice(-4)}`,
        email: null,
        emailVerified: false,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        providerData: [{
          providerId: 'phone',
          uid: pendingPhoneNumber,
          displayName: null,
          email: null,
          phoneNumber: pendingPhoneNumber,
          photoURL: null
        }],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      } as User
    }
    
    animateTransition(() => {
      setAuthState("authenticated")
      if (userToAuthenticate) {
        onAuthenticated(userToAuthenticate)
      }
    })
  }

  const handleOTPVerificationCancel = () => {
    setPendingPhoneNumber("")
    animateTransition(() => {
      setAuthState("login")
    })
  }

  const handleLogout = () => {
    setCurrentUser(null)
    animateTransition(() => {
      setAuthState("login")
    })
  }

  const handleForgotPassword = () => {
    // Handle forgot password logic
    console.log("Forgot password requested")
  }

  const navigateToProfile = () => {
    animateTransition(() => {
      setAuthState("profile")
    })
  }

  const navigateToLogin = () => {
    animateTransition(() => {
      setAuthState("login")
    })
  }

  const navigateToRegister = () => {
    animateTransition(() => {
      setAuthState("register")
    })
  }

  const renderScreen = () => {
    switch (authState) {
      case "login":
        return (
          <LoginScreen
            onLogin={handleLogin}
            onNavigateToRegister={navigateToRegister}
            onForgotPassword={handleForgotPassword}
            onPhoneVerificationNeeded={handlePhoneVerificationNeeded}
          />
        )
      case "register":
        return (
          <RegisterScreen
            onRegister={handleRegister}
            onNavigateToLogin={navigateToLogin}
            onPhoneVerificationNeeded={handlePhoneVerificationNeeded}
          />
        )
      case "otp_verification":
        return (
          <TrueOfflineOTPScreen
            phoneNumber={pendingPhoneNumber}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onCancel={handleOTPVerificationCancel}
          />
        )
      case "profile":
        return (
          <UserProfileScreen
            onLogout={handleLogout}
            onBack={onBack}
          />
        )
      default:
        return null
    }
  }

  // If authenticated and not viewing profile, return null (let main app handle)
  if (authState === "authenticated") {
    return null
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>
    </View>
  )
}

// Export the profile navigation function for use in main app
export const useAuthManager = () => {
  const [authManagerRef, setAuthManagerRef] = useState<{
    navigateToProfile: () => void
  } | null>(null)

  return {
    authManagerRef,
    setAuthManagerRef,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
})
