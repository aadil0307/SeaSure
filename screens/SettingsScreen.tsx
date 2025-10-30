import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from "react-native"
import { Button, Card, SectionTitle } from "../components/ui"
import { Storage } from "../services/storage"
import type { AppSettings } from "../types"
import { theme } from "../theme/colors"
import { trueOfflineOTP } from "../services/trueOfflineOTP"
import { Ionicons } from "@expo/vector-icons"
import LanguageSelector from "../components/LanguageSelector"
import { useTranslation } from 'react-i18next'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<AppSettings>({ lowPowerMode: true, gpsPollSeconds: 60 })
  const [testPhoneNumber, setTestPhoneNumber] = useState("+1234567890")

  useEffect(() => {
    ;(async () => setSettings(await Storage.getSettings()))()
  }, [])

  const update = async (next: Partial<AppSettings>) => {
    const merged = { ...settings, ...next }
    setSettings(merged)
    await Storage.saveSettings(merged)
  }

  const clearCache = async () => {
    await Storage.saveCatches([])
    await Storage.saveTrips([])
    await Storage.saveForecast(null)
    await Storage.saveAlerts([])
    Alert.alert("Cleared", "Offline cache cleared.")
  }

  const syncNow = async () => {
    // TODO: integrate Firebase Firestore sync
    Alert.alert("Sync", "Offline items queued for sync (stub).")
  }

  // Offline OTP Test Functions
  const testInitializeOTP = async () => {
    try {
      await trueOfflineOTP.initializeOfflineOTP(testPhoneNumber)
      Alert.alert("✅ Success", `Offline OTP initialized for ${testPhoneNumber}`)
    } catch (error) {
      Alert.alert("❌ Error", "Failed to initialize offline OTP")
      console.error(error)
    }
  }

  const testGenerateOTP = async () => {
    try {
      const result = await trueOfflineOTP.generateOfflineOTP(testPhoneNumber)
      Alert.alert(
        "📱 OTP Generated", 
        `Code: ${result.otp}\nExpires: ${new Date(result.expiresAt).toLocaleTimeString()}\nMethod: ${result.method}`
      )
    } catch (error) {
      Alert.alert("❌ Error", "Failed to generate OTP. Initialize first.")
      console.error(error)
    }
  }

  const testVerifyOTP = async () => {
    try {
      // First get current OTP
      const current = await trueOfflineOTP.getCurrentValidOTP(testPhoneNumber)
      if (!current.otp) {
        Alert.alert("❌ Error", "No valid OTP available")
        return
      }

      // Verify it
      const result = await trueOfflineOTP.verifyOfflineOTP(testPhoneNumber, current.otp)
      Alert.alert(
        result.isValid ? "✅ Verified" : "❌ Failed",
        `Method: ${result.method}\nTime remaining: ${result.timeRemaining ? Math.floor(result.timeRemaining / 1000) : 0}s`
      )
    } catch (error) {
      Alert.alert("❌ Error", "Verification failed")
      console.error(error)
    }
  }

  const testEmergencyCode = async () => {
    try {
      const code = await trueOfflineOTP.generateEmergencyCode(testPhoneNumber)
      Alert.alert("🚨 Emergency Code", `Code: ${code}\nValid for 24 hours`)
    } catch (error) {
      Alert.alert("❌ Error", "Failed to generate emergency code")
      console.error(error)
    }
  }

  return (
    <View style={styles.container}>
      <SectionTitle>{t('settings.title')}</SectionTitle>

      {/* Language Selector */}
      <Card style={{ marginBottom: 12 }}>
        <LanguageSelector />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Low Power Mode</Text>
        <View style={styles.row}>
          <Text style={styles.help}>Reduces GPS polling to save battery.</Text>
          <Switch value={settings.lowPowerMode} onValueChange={(v) => update({ lowPowerMode: v })} />
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>GPS Poll Interval (seconds)</Text>
        <View style={styles.row}>
          <Button
            title="-30"
            variant="ghost"
            onPress={() => update({ gpsPollSeconds: Math.max(30, settings.gpsPollSeconds - 30) })}
          />
          <Text style={styles.value}>{settings.gpsPollSeconds}</Text>
          <Button
            title="+30"
            variant="ghost"
            onPress={() => update({ gpsPollSeconds: Math.min(300, settings.gpsPollSeconds + 30) })}
          />
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Offline Data</Text>
        <View style={styles.row}>
          <Button title="Clear Cache" variant="danger" onPress={clearCache} />
          <Button title="Sync Now" onPress={syncNow} />
        </View>
      </Card>

      {/* Offline OTP Testing Section */}
      <Card style={{ marginBottom: 12, backgroundColor: '#F0F9FF', borderColor: theme.primary }}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
          <Text style={[styles.label, { color: theme.primary }]}>Offline OTP Testing</Text>
        </View>
        <Text style={[styles.help, { marginTop: 8 }]}>
          Test the offline authentication system with phone: {testPhoneNumber}
        </Text>
        
        <View style={styles.otpButtonGrid}>
          <TouchableOpacity style={styles.otpTestButton} onPress={testInitializeOTP}>
            <Ionicons name="settings" size={16} color={theme.primary} />
            <Text style={styles.otpTestButtonText}>Initialize</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.otpTestButton} onPress={testGenerateOTP}>
            <Ionicons name="refresh" size={16} color={theme.primary} />
            <Text style={styles.otpTestButtonText}>Generate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.otpTestButton} onPress={testVerifyOTP}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
            <Text style={styles.otpTestButtonText}>Verify</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.otpTestButton} onPress={testEmergencyCode}>
            <Ionicons name="warning" size={16} color="#DC2626" />
            <Text style={[styles.otpTestButtonText, { color: '#DC2626' }]}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text style={{ color: "#64748B" }}>
        API and Firebase integration are intentionally stubbed to emphasize the offline-first frontend.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
  label: { fontSize: 16, fontWeight: "700", color: theme.fg },
  help: { color: "#475569", flex: 1, marginRight: 8 },
  value: { fontWeight: "700", color: theme.fg },
  otpButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  otpTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  otpTestButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
})
