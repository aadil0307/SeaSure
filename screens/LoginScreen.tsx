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

interface LoginScreenProps {
  onLogin: (user: any, phoneNumber?: string) => void
  onNavigateToRegister: () => void
  onForgotPassword: () => void
  onPhoneVerificationNeeded?: (phoneNumber: string) => void
}

export default function LoginScreen({ onLogin, onNavigateToRegister, onForgotPassword, onPhoneVerificationNeeded }: LoginScreenProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.please_fill_fields'))
      return
    }

    if (!email.includes('@')) {
      Alert.alert(t('common.error'), t('auth.enter_valid_email'))
      return
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.password_min_length'))
      return
    }

    setIsLoading(true)
    
    try {
      const user = await authService.signInWithEmail(email, password)
      Alert.alert(t('common.success'), t('auth.login_successful'))
      onLogin(user)
    } catch (error: any) {
      console.error('Login error:', error)
      let errorMessage = t('auth.login_error')
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.user_not_found')
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('auth.wrong_password')
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalid_email')
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.too_many_requests')
      }
      
      Alert.alert(t('auth.login_failed'), errorMessage)
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
        colors={[theme.primary, "#0891b2", "#0e7490"]}
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
              <View style={styles.logoContainer}>
                <Ionicons name="boat" size={60} color="#ffffff" />
              </View>
              <Text style={styles.title}>{t('auth.app_title')}</Text>
              <Text style={styles.subtitle}>{t('auth.app_subtitle')}</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
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

              <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={() => {
                    animateButton()
                    handleLogin()
                  }}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ["#94a3b8", "#64748b"] : [theme.primary, "#0891b2"]}
                    style={styles.loginButtonGradient}
                  >
                    {isLoading ? (
                      <Animated.View style={styles.loadingContainer}>
                        <Text style={styles.loginButtonText}>{t('auth.signing_in')}</Text>
                      </Animated.View>
                    ) : (
                      <Text style={styles.loginButtonText}>{t('auth.sign_in')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.no_account')} </Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.footerLink}>{t('auth.signup')}</Text>
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
    justifyContent: "center",
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
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
    padding: 30,
    marginBottom: 30,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
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
