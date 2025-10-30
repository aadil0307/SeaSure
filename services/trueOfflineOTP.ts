import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
import Constants from 'expo-constants'

interface LocalOTPData {
  phoneNumber: string
  deviceId: string
  lastOTPTime: number
  usedOTPs: string[]
  masterSeed: string
}

export class TrueOfflineOTPService {
  private static instance: TrueOfflineOTPService
  private readonly OTP_VALIDITY_MINUTES = 5
  private readonly OTP_LENGTH = 6
  private readonly MAX_USED_OTPS = 50 // Keep last 50 used OTPs to prevent reuse

  static getInstance(): TrueOfflineOTPService {
    if (!this.instance) {
      this.instance = new TrueOfflineOTPService()
    }
    return this.instance
  }

  // Initialize offline OTP for a phone number (call once when setting up)
  async initializeOfflineOTP(phoneNumber: string): Promise<string> {
    try {
      const deviceId = await this.getDeviceId()
      const masterSeed = await this.generateMasterSeed(phoneNumber, deviceId)
      
      const otpData: LocalOTPData = {
        phoneNumber,
        deviceId,
        lastOTPTime: 0,
        usedOTPs: [],
        masterSeed
      }

      await AsyncStorage.setItem(
        `offline_otp_${phoneNumber}`,
        JSON.stringify(otpData)
      )

      console.log('✅ Offline OTP initialized for:', phoneNumber)
      return masterSeed
    } catch (error) {
      console.error('Error initializing offline OTP:', error)
      throw error
    }
  }

  // Generate OTP completely offline
  async generateOfflineOTP(phoneNumber: string): Promise<{
    otp: string
    expiresAt: number
    method: 'offline_deterministic'
  }> {
    try {
      const otpData = await this.getOTPData(phoneNumber)
      if (!otpData) {
        throw new Error('Offline OTP not initialized for this phone number')
      }

      const currentTime = Date.now()
      const timeSlot = Math.floor(currentTime / (this.OTP_VALIDITY_MINUTES * 60 * 1000))
      
      // Generate deterministic OTP based on phone + device + time + master seed
      const otpInput = `${phoneNumber}-${otpData.deviceId}-${timeSlot}-${otpData.masterSeed}`
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        otpInput
      )
      
      // Extract 6 digits from hash
      const otp = this.extractOTPFromHash(hash)
      const expiresAt = (timeSlot + 1) * (this.OTP_VALIDITY_MINUTES * 60 * 1000)

      // Update last OTP time
      otpData.lastOTPTime = currentTime
      await AsyncStorage.setItem(
        `offline_otp_${phoneNumber}`,
        JSON.stringify(otpData)
      )

      console.log(`📱 Generated offline OTP: ${otp} (expires in ${this.OTP_VALIDITY_MINUTES} min)`)

      return {
        otp,
        expiresAt,
        method: 'offline_deterministic'
      }
    } catch (error) {
      console.error('Error generating offline OTP:', error)
      throw error
    }
  }

  // Verify OTP completely offline
  async verifyOfflineOTP(phoneNumber: string, enteredOTP: string): Promise<{
    isValid: boolean
    method: 'offline_deterministic' | 'offline_emergency' | 'none'
    timeRemaining?: number
  }> {
    try {
      const otpData = await this.getOTPData(phoneNumber)
      if (!otpData) {
        return { isValid: false, method: 'none' }
      }

      // Check if OTP was already used
      if (otpData.usedOTPs.includes(enteredOTP)) {
        console.log('🚫 OTP already used')
        return { isValid: false, method: 'none' }
      }

      const currentTime = Date.now()
      const currentTimeSlot = Math.floor(currentTime / (this.OTP_VALIDITY_MINUTES * 60 * 1000))
      const previousTimeSlot = currentTimeSlot - 1

      // Check current and previous time slots (for clock tolerance)
      for (const timeSlot of [currentTimeSlot, previousTimeSlot]) {
        const expectedOTP = await this.generateOTPForTimeSlot(
          phoneNumber, 
          otpData.deviceId, 
          timeSlot, 
          otpData.masterSeed
        )

        if (expectedOTP === enteredOTP) {
          // Mark OTP as used
          otpData.usedOTPs.push(enteredOTP)
          
          // Keep only last 50 used OTPs
          if (otpData.usedOTPs.length > this.MAX_USED_OTPS) {
            otpData.usedOTPs = otpData.usedOTPs.slice(-this.MAX_USED_OTPS)
          }

          await AsyncStorage.setItem(
            `offline_otp_${phoneNumber}`,
            JSON.stringify(otpData)
          )

          const timeRemaining = ((currentTimeSlot + 1) * (this.OTP_VALIDITY_MINUTES * 60 * 1000)) - currentTime

          console.log('✅ Offline OTP verified successfully')
          return {
            isValid: true,
            method: 'offline_deterministic',
            timeRemaining: Math.max(0, timeRemaining)
          }
        }
      }

      // Try emergency daily code as fallback
      const emergencyResult = await this.verifyEmergencyCode(phoneNumber, enteredOTP)
      if (emergencyResult.isValid) {
        return emergencyResult
      }

      console.log('❌ OTP verification failed')
      return { isValid: false, method: 'none' }
    } catch (error) {
      console.error('Error verifying offline OTP:', error)
      return { isValid: false, method: 'none' }
    }
  }

  // Generate emergency daily code (works for 24 hours)
  async generateEmergencyCode(phoneNumber: string): Promise<string> {
    try {
      const otpData = await this.getOTPData(phoneNumber)
      if (!otpData) {
        throw new Error('Offline OTP not initialized')
      }

      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const emergencyInput = `EMERGENCY-${phoneNumber}-${otpData.deviceId}-${today}-${otpData.masterSeed}`
      
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        emergencyInput
      )

      return this.extractOTPFromHash(hash, 8) // 8-digit emergency code
    } catch (error) {
      console.error('Error generating emergency code:', error)
      throw error
    }
  }

  // Check if offline OTP is available for a phone number
  async isOfflineOTPAvailable(phoneNumber: string): Promise<{
    available: boolean
    initialized: boolean
    deviceMatches: boolean
  }> {
    try {
      const otpData = await this.getOTPData(phoneNumber)
      if (!otpData) {
        return { available: false, initialized: false, deviceMatches: false }
      }

      const currentDeviceId = await this.getDeviceId()
      const deviceMatches = otpData.deviceId === currentDeviceId

      return {
        available: deviceMatches,
        initialized: true,
        deviceMatches
      }
    } catch (error) {
      console.error('Error checking offline OTP availability:', error)
      return { available: false, initialized: false, deviceMatches: false }
    }
  }

  // Get current valid OTP without generating new one (for display purposes)
  async getCurrentValidOTP(phoneNumber: string): Promise<{
    otp: string | null
    expiresAt: number | null
    timeRemaining: number | null
  }> {
    try {
      const otpData = await this.getOTPData(phoneNumber)
      if (!otpData) {
        return { otp: null, expiresAt: null, timeRemaining: null }
      }

      const currentTime = Date.now()
      const currentTimeSlot = Math.floor(currentTime / (this.OTP_VALIDITY_MINUTES * 60 * 1000))
      
      const otp = await this.generateOTPForTimeSlot(
        phoneNumber,
        otpData.deviceId,
        currentTimeSlot,
        otpData.masterSeed
      )

      const expiresAt = (currentTimeSlot + 1) * (this.OTP_VALIDITY_MINUTES * 60 * 1000)
      const timeRemaining = expiresAt - currentTime

      return {
        otp: timeRemaining > 0 ? otp : null,
        expiresAt: timeRemaining > 0 ? expiresAt : null,
        timeRemaining: Math.max(0, timeRemaining)
      }
    } catch (error) {
      console.error('Error getting current OTP:', error)
      return { otp: null, expiresAt: null, timeRemaining: null }
    }
  }

  // Private helper methods
  private async getOTPData(phoneNumber: string): Promise<LocalOTPData | null> {
    try {
      const data = await AsyncStorage.getItem(`offline_otp_${phoneNumber}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting OTP data:', error)
      return null
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      // Try to get a consistent device identifier
      let deviceId = await AsyncStorage.getItem('device_id_for_otp')
      
      if (!deviceId) {
        // Generate a unique device ID based on available info
        const sessionId = Constants.sessionId || ''
        const installTime = Date.now().toString()
        const randomSuffix = Math.random().toString(36).substring(2)
        
        deviceId = `${Platform.OS}-${sessionId}-${installTime}-${randomSuffix}`
        await AsyncStorage.setItem('device_id_for_otp', deviceId)
      }
      
      return deviceId
    } catch (error) {
      console.error('Error getting device ID:', error)
      return `fallback-${Platform.OS}-${Date.now()}`
    }
  }

  private async generateMasterSeed(phoneNumber: string, deviceId: string): Promise<string> {
    const seedInput = `MASTER-${phoneNumber}-${deviceId}-${Date.now()}-SEASURE-OTP`
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      seedInput
    )
    return hash
  }

  private async generateOTPForTimeSlot(
    phoneNumber: string,
    deviceId: string,
    timeSlot: number,
    masterSeed: string
  ): Promise<string> {
    const otpInput = `${phoneNumber}-${deviceId}-${timeSlot}-${masterSeed}`
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      otpInput
    )
    return this.extractOTPFromHash(hash)
  }

  private extractOTPFromHash(hash: string, length: number = this.OTP_LENGTH): string {
    // Extract numeric digits from hash
    const digits = hash.replace(/[^0-9]/g, '')
    
    if (digits.length >= length) {
      return digits.substring(0, length)
    }
    
    // If not enough digits, use character codes
    let otp = ''
    for (let i = 0; i < length; i++) {
      const charCode = hash.charCodeAt(i % hash.length)
      otp += (charCode % 10).toString()
    }
    
    return otp
  }

  private async verifyEmergencyCode(phoneNumber: string, code: string): Promise<{
    isValid: boolean
    method: 'offline_emergency' | 'none'
  }> {
    try {
      const expectedCode = await this.generateEmergencyCode(phoneNumber)
      return {
        isValid: expectedCode === code,
        method: expectedCode === code ? 'offline_emergency' : 'none'
      }
    } catch (error) {
      console.error('Error verifying emergency code:', error)
      return { isValid: false, method: 'none' }
    }
  }

  // Cleanup method
  async cleanupExpiredData(phoneNumber: string): Promise<void> {
    try {
      const otpData = await this.getOTPData(phoneNumber)
      if (!otpData) return

      // Keep only recent used OTPs (last 24 hours worth)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
      // Since we don't store timestamps for used OTPs, just limit the array size
      if (otpData.usedOTPs.length > this.MAX_USED_OTPS) {
        otpData.usedOTPs = otpData.usedOTPs.slice(-this.MAX_USED_OTPS)
      }

      await AsyncStorage.setItem(
        `offline_otp_${phoneNumber}`,
        JSON.stringify(otpData)
      )
    } catch (error) {
      console.error('Error cleaning up expired data:', error)
    }
  }
}

export const trueOfflineOTP = TrueOfflineOTPService.getInstance()