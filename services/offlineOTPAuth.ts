import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
import Constants from 'expo-constants'

interface OfflineAuthToken {
  token: string
  timestamp: number
  used: boolean
  expiresAt: number
}

interface DeviceFingerprint {
  deviceId: string
  modelName: string
  osVersion: string
  appVersion: string
  installTime: number
}

export class OfflineOTPAuthService {
  private static instance: OfflineOTPAuthService
  private readonly TOKEN_COUNT = 20 // Pre-generate 20 tokens
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
  private readonly EMERGENCY_CODE_VALIDITY = 12 * 60 * 60 * 1000 // 12 hours

  static getInstance(): OfflineOTPAuthService {
    if (!this.instance) {
      this.instance = new OfflineOTPAuthService()
    }
    return this.instance
  }

  // 1. Pre-generate tokens when user has internet connection
  async preGenerateOfflineTokens(phoneNumber: string): Promise<boolean> {
    try {
      const deviceFingerprint = await this.getDeviceFingerprint()
      const tokens: OfflineAuthToken[] = []
      const now = Date.now()

      for (let i = 0; i < this.TOKEN_COUNT; i++) {
        const tokenData = `${phoneNumber}-${deviceFingerprint.deviceId}-${now + i}`
        const token = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          tokenData
        )
        
        tokens.push({
          token: token.substring(0, 6).toUpperCase(),
          timestamp: now + (i * 60000), // 1 minute intervals
          used: false,
          expiresAt: now + this.TOKEN_EXPIRY
        })
      }

      await AsyncStorage.setItem(
        `offline_tokens_${phoneNumber}`,
        JSON.stringify(tokens)
      )

      await AsyncStorage.setItem(
        `device_fingerprint_${phoneNumber}`,
        JSON.stringify(deviceFingerprint)
      )

      console.log(`Generated ${tokens.length} offline tokens for ${phoneNumber}`)
      return true
    } catch (error) {
      console.error('Error generating offline tokens:', error)
      return false
    }
  }

  // 2. Generate time-based OTP that can be verified offline
  async generateTimeBasedOTP(phoneNumber: string): Promise<string | null> {
    try {
      const deviceFingerprint = await this.getDeviceFingerprint()
      const timeSlot = Math.floor(Date.now() / 300000) // 5-minute time slots
      
      const otpData = `${phoneNumber}-${deviceFingerprint.deviceId}-${timeSlot}-seasure`
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        otpData
      )
      
      return hash.substring(0, 6).toUpperCase()
    } catch (error) {
      console.error('Error generating time-based OTP:', error)
      return null
    }
  }

  // 3. Verify OTP offline using multiple methods
  async verifyOfflineOTP(phoneNumber: string, enteredOTP: string): Promise<{
    isValid: boolean
    method: 'pregenerated' | 'timebased' | 'emergency' | 'none'
    remainingTokens?: number
  }> {
    try {
      // Method 1: Check pre-generated tokens
      const pregeneratedResult = await this.verifyPregeneratedToken(phoneNumber, enteredOTP)
      if (pregeneratedResult.isValid) {
        return pregeneratedResult
      }

      // Method 2: Check time-based OTP
      const timeBasedResult = await this.verifyTimeBasedOTP(phoneNumber, enteredOTP)
      if (timeBasedResult.isValid) {
        return timeBasedResult
      }

      // Method 3: Check emergency code
      const emergencyResult = await this.verifyEmergencyCode(phoneNumber, enteredOTP)
      if (emergencyResult.isValid) {
        return emergencyResult
      }

      return { isValid: false, method: 'none' }
    } catch (error) {
      console.error('Error verifying offline OTP:', error)
      return { isValid: false, method: 'none' }
    }
  }

  // 4. Emergency bypass code generation
  async generateEmergencyCode(phoneNumber: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const deviceFingerprint = await this.getDeviceFingerprint()
    
    const emergencyData = `${phoneNumber}-${today}-${deviceFingerprint.deviceId}-emergency-seasure`
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      emergencyData
    )
    
    return hash.substring(0, 8).toUpperCase()
  }

  // 5. Check if offline authentication is available
  async isOfflineAuthAvailable(phoneNumber: string): Promise<{
    hasTokens: boolean
    tokenCount: number
    hasDeviceAuth: boolean
    canUseEmergency: boolean
  }> {
    try {
      const tokensData = await AsyncStorage.getItem(`offline_tokens_${phoneNumber}`)
      const deviceData = await AsyncStorage.getItem(`device_fingerprint_${phoneNumber}`)
      
      let hasTokens = false
      let tokenCount = 0
      
      if (tokensData) {
        const tokens: OfflineAuthToken[] = JSON.parse(tokensData)
        const validTokens = tokens.filter(t => !t.used && t.expiresAt > Date.now())
        hasTokens = validTokens.length > 0
        tokenCount = validTokens.length
      }

      return {
        hasTokens,
        tokenCount,
        hasDeviceAuth: !!deviceData,
        canUseEmergency: true
      }
    } catch (error) {
      console.error('Error checking offline auth availability:', error)
      return {
        hasTokens: false,
        tokenCount: 0,
        hasDeviceAuth: false,
        canUseEmergency: true
      }
    }
  }

  // Private helper methods
  private async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    return {
      deviceId: Constants.sessionId || Platform.OS + '-' + Date.now(),
      modelName: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
      installTime: Date.now()
    }
  }

  private async verifyPregeneratedToken(phoneNumber: string, otp: string): Promise<{
    isValid: boolean
    method: 'pregenerated'
    remainingTokens: number
  }> {
    try {
      const tokensData = await AsyncStorage.getItem(`offline_tokens_${phoneNumber}`)
      if (!tokensData) {
        return { isValid: false, method: 'pregenerated', remainingTokens: 0 }
      }

      const tokens: OfflineAuthToken[] = JSON.parse(tokensData)
      const validTokens = tokens.filter(t => !t.used && t.expiresAt > Date.now())
      
      const matchingToken = validTokens.find(t => t.token === otp.toUpperCase())
      
      if (matchingToken) {
        // Mark token as used
        matchingToken.used = true
        await AsyncStorage.setItem(
          `offline_tokens_${phoneNumber}`,
          JSON.stringify(tokens)
        )
        
        return {
          isValid: true,
          method: 'pregenerated',
          remainingTokens: validTokens.length - 1
        }
      }

      return { isValid: false, method: 'pregenerated', remainingTokens: validTokens.length }
    } catch (error) {
      console.error('Error verifying pregenerated token:', error)
      return { isValid: false, method: 'pregenerated', remainingTokens: 0 }
    }
  }

  private async verifyTimeBasedOTP(phoneNumber: string, otp: string): Promise<{
    isValid: boolean
    method: 'timebased'
  }> {
    try {
      // Check current time slot and previous time slot (for clock skew tolerance)
      const currentTimeSlot = Math.floor(Date.now() / 300000)
      const previousTimeSlot = currentTimeSlot - 1
      
      for (const timeSlot of [currentTimeSlot, previousTimeSlot]) {
        const expectedOTP = await this.generateTimeBasedOTPForSlot(phoneNumber, timeSlot)
        if (expectedOTP === otp.toUpperCase()) {
          return { isValid: true, method: 'timebased' }
        }
      }

      return { isValid: false, method: 'timebased' }
    } catch (error) {
      console.error('Error verifying time-based OTP:', error)
      return { isValid: false, method: 'timebased' }
    }
  }

  private async generateTimeBasedOTPForSlot(phoneNumber: string, timeSlot: number): Promise<string> {
    const deviceFingerprint = await this.getDeviceFingerprint()
    const otpData = `${phoneNumber}-${deviceFingerprint.deviceId}-${timeSlot}-seasure`
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      otpData
    )
    return hash.substring(0, 6).toUpperCase()
  }

  private async verifyEmergencyCode(phoneNumber: string, code: string): Promise<{
    isValid: boolean
    method: 'emergency'
  }> {
    try {
      const expectedCode = await this.generateEmergencyCode(phoneNumber)
      return {
        isValid: expectedCode === code.toUpperCase(),
        method: 'emergency'
      }
    } catch (error) {
      console.error('Error verifying emergency code:', error)
      return { isValid: false, method: 'emergency' }
    }
  }

  // Cleanup expired tokens
  async cleanupExpiredTokens(phoneNumber: string): Promise<void> {
    try {
      const tokensData = await AsyncStorage.getItem(`offline_tokens_${phoneNumber}`)
      if (!tokensData) return

      const tokens: OfflineAuthToken[] = JSON.parse(tokensData)
      const validTokens = tokens.filter(t => t.expiresAt > Date.now())
      
      await AsyncStorage.setItem(
        `offline_tokens_${phoneNumber}`,
        JSON.stringify(validTokens)
      )
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
    }
  }
}

export const offlineOTPAuth = OfflineOTPAuthService.getInstance()