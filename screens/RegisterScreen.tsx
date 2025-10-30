import React, { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { theme } from "../theme/colors"
import { authService } from "../services/auth"

const { width, height } = Dimensions.get("window")

interface RegisterScreenProps {
  onRegister: (user: any, phoneNumber?: string) => void
  onNavigateToLogin: () => void
  onPhoneVerificationNeeded?: (phoneNumber: string) => void
}

export default function RegisterScreen({ onRegister, onNavigateToLogin, onPhoneVerificationNeeded }: RegisterScreenProps) {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  React.useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.please_fill_fields'))
      return
    }

    if (!email.includes('@')) {
      Alert.alert(t('common.error'), t('auth.enter_valid_email'))
      return
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwords_no_match'))
      return
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.password_min_length_register'))
      return
    }

    if (!agreedToTerms) {
      Alert.alert(t('common.error'), t('auth.agree_terms'))
      return
    }

    setIsLoading(true)
    
    try {
      const user = await authService.registerWithEmail(
        email,
        password,
        fullName
      )
      
      Alert.alert(
        t('auth.registration_successful'),
        t('auth.account_created_message'),
        [
          {
            text: t('common.ok'),
            onPress: () => onRegister(user)
          }
        ]
      )
    } catch (error: any) {
      console.error('Registration error:', error)
      let errorMessage = t('auth.registration_error')
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('auth.email_already_in_use')
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalid_email')
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('auth.weak_password')
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection."
      }
      
      Alert.alert(t('auth.registration_failed'), errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const buttonScale = useRef(new Animated.Value(1)).current

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#0891b2", theme.primary, "#0e7490"]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onNavigateToLogin}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={50} color="#ffffff" />
              </View>
              <Text style={styles.title}>{t('auth.create_account')}</Text>
              <Text style={styles.subtitle}>Join the SeaSure community</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.full_name')}
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.confirm_password')}
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              <View style={styles.passwordStrength}>
                <Text style={styles.passwordStrengthText}>
                  Password must be at least 6 characters
                </Text>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${Math.min((password.length / 8) * 100, 100)}%`,
                        backgroundColor:
                          password.length < 4
                            ? "#ef4444"
                            : password.length < 6
                            ? "#f59e0b"
                            : "#10b981",
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Terms Agreement */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  {t('auth.i_agree')}{" "}
                  <Text style={styles.termsLink}>{t('auth.terms_service')}</Text>{t('auth.and')}{" "}
                  <Text style={styles.termsLink}>{t('auth.privacy_policy')}</Text>
                </Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                  onPress={() => {
                    animateButton()
                    handleRegister()
                  }}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ["#94a3b8", "#64748b"] : [theme.primary, "#0891b2"]}
                    style={styles.registerButtonGradient}
                  >
                    {isLoading ? (
                      <Animated.View style={styles.loadingContainer}>
                        <Text style={styles.registerButtonText}>{t('auth.creating_account')}</Text>
                      </Animated.View>
                    ) : (
                      <Text style={styles.registerButtonText}>{t('auth.create_account')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.have_account')} </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.footerLink}>{t('auth.sign_in')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 10,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1e293b",
  },
  eyeIcon: {
    padding: 5,
  },
  passwordStrength: {
    marginBottom: 20,
  },
  passwordStrengthText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  termsLink: {
    color: theme.primary,
    fontWeight: "500",
  },
  registerButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  footerLink: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
