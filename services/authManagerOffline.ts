// Add this to your existing AuthManager.tsx or create a new file

import { offlineOTPAuth } from '../services/offlineOTPAuth'

export class AuthManagerWithOfflineOTP {
  // Enhanced phone verification with offline support
  static async verifyPhoneWithOfflineSupport(
    phoneNumber: string, 
    otp: string,
    isOnline: boolean = true
  ): Promise<{
    success: boolean
    method: 'sms' | 'pregenerated' | 'timebased' | 'emergency' | 'none'
    message: string
  }> {
    try {
      if (isOnline) {
        // Try SMS verification first when online
        const smsResult = await this.verifySMSOTP(phoneNumber, otp)
        if (smsResult.success) {
          return {
            success: true,
            method: 'sms',
            message: 'Phone verified via SMS'
          }
        }
      }

      // Fall back to offline verification
      const offlineResult = await offlineOTPAuth.verifyOfflineOTP(phoneNumber, otp)
      
      if (offlineResult.isValid) {
        return {
          success: true,
          method: offlineResult.method,
          message: `Phone verified via ${offlineResult.method} method`
        }
      }

      return {
        success: false,
        method: 'none',
        message: 'Invalid verification code'
      }
    } catch (error) {
      console.error('Phone verification error:', error)
      return {
        success: false,
        method: 'none',
        message: 'Verification failed. Please try again.'
      }
    }
  }

  // Prepare user for offline usage (call when they have internet)
  static async prepareOfflineAuth(phoneNumber: string): Promise<boolean> {
    try {
      const success = await offlineOTPAuth.preGenerateOfflineTokens(phoneNumber)
      if (success) {
        console.log('✅ Offline authentication prepared for', phoneNumber)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to prepare offline auth:', error)
      return false
    }
  }

  // Check if user can authenticate offline
  static async canAuthenticateOffline(phoneNumber: string): Promise<{
    canAuthenticate: boolean
    methods: string[]
    tokenCount: number
  }> {
    try {
      const status = await offlineOTPAuth.isOfflineAuthAvailable(phoneNumber)
      
      const availableMethods = []
      if (status.hasTokens) availableMethods.push('pregenerated')
      if (status.hasDeviceAuth) availableMethods.push('timebased')
      if (status.canUseEmergency) availableMethods.push('emergency')

      return {
        canAuthenticate: availableMethods.length > 0,
        methods: availableMethods,
        tokenCount: status.tokenCount
      }
    } catch (error) {
      console.error('Error checking offline auth capability:', error)
      return {
        canAuthenticate: false,
        methods: [],
        tokenCount: 0
      }
    }
  }

  // Placeholder for your existing SMS verification
  private static async verifySMSOTP(phoneNumber: string, otp: string): Promise<{
    success: boolean
  }> {
    // Implement your actual SMS OTP verification here
    // This is just a placeholder
    return { success: false }
  }

  // Generate and show emergency code to user
  static async generateEmergencyCode(phoneNumber: string): Promise<string> {
    return await offlineOTPAuth.generateEmergencyCode(phoneNumber)
  }

  // Cleanup old tokens periodically
  static async cleanupOfflineAuth(phoneNumber: string): Promise<void> {
    await offlineOTPAuth.cleanupExpiredTokens(phoneNumber)
  }
}

// Usage Examples:

/*
// 1. During login when user has internet - prepare for offline use
await AuthManagerWithOfflineOTP.prepareOfflineAuth('+1234567890')

// 2. During verification - automatically try online then offline
const result = await AuthManagerWithOfflineOTP.verifyPhoneWithOfflineSupport(
  '+1234567890', 
  '123456',
  isOnline
)

if (result.success) {
  console.log(`Verified via ${result.method}:`, result.message)
} else {
  console.log('Verification failed:', result.message)
}

// 3. Check if user can authenticate offline before showing UI
const offlineCapability = await AuthManagerWithOfflineOTP.canAuthenticateOffline('+1234567890')
if (offlineCapability.canAuthenticate) {
  console.log('Available offline methods:', offlineCapability.methods)
  console.log('Remaining tokens:', offlineCapability.tokenCount)
}

// 4. Generate emergency code for user
const emergencyCode = await AuthManagerWithOfflineOTP.generateEmergencyCode('+1234567890')
Alert.alert('Emergency Code', `Your code is: ${emergencyCode}`)
*/