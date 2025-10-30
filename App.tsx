import React, { useState, useEffect } from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar, TouchableOpacity, View, ActivityIndicator } from "react-native"
import MapScreen from "./screens/MapScreen"
import LogbookScreen from "./screens/LogbookScreen"
import WeatherScreen from "./screens/WeatherScreen"
import TripPlannerScreen from "./screens/TripPlannerScreen"
import AlertsScreen from "./screens/AlertsScreen"
import SettingsScreen from "./screens/SettingsScreen"
import AuthManager from "./screens/AuthManager"
import UserProfileScreen from "./screens/UserProfileScreen"
import DemoJudgesPanel from "./components/DemoJudgesPanel"
import AppInitializer from "./utils/AppInitializer"
import { theme } from "./theme/colors"
import { Ionicons } from "@expo/vector-icons"
import { authService } from "./services/auth"
import { User } from "firebase/auth"
import './i18n' // Initialize i18n
import { useTranslation } from 'react-i18next'

const Tab = createBottomTabNavigator()

export default function App() {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user)
      setIsLoading(false)
    })

    // Initialize app services
    AppInitializer.initialize().catch(console.error)

    return unsubscribe
  }, [])

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primary,
      background: theme.bg,
      text: theme.fg,
      card: theme.card,
      border: "#E2E8F0",
      notification: theme.warn,
    },
  }

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser)
  }

  const handleLogout = () => {
    setUser(null)
    setShowProfile(false)
  }

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaProvider>
    )
  }

  // Show auth screens if not authenticated
  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <AuthManager
          onAuthenticated={handleAuthenticated}
          onBack={() => setShowProfile(false)}
        />
      </SafeAreaProvider>
    )
  }

  // Show profile screen if requested
  if (showProfile) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <UserProfileScreen
          onLogout={handleLogout}
          onBack={() => setShowProfile(false)}
        />
      </SafeAreaProvider>
    )
  }

  // Main app navigation
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: "#64748B",
            tabBarStyle: { 
              backgroundColor: "#FFFFFF",
              height: 90, // Increased height
              paddingBottom: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: 4,
            },
            tabBarIconStyle: {
              marginTop: 4,
            },
            // Add profile button to header
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowProfile(true)}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons name="person-circle-outline" size={28} color={theme.primary} />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color, size }) => {
              const iconSize = 26; // Larger icons
              const map: Record<string, React.ReactNode> = {
                Map: <Ionicons name="map" size={iconSize} color={color} />,
                Logbook: <Ionicons name="list" size={iconSize} color={color} />,
                Weather: <Ionicons name="cloud" size={iconSize} color={color} />,
                Trip: <Ionicons name="navigate" size={iconSize} color={color} />,
                Alerts: <Ionicons name="alert-circle" size={iconSize} color={color} />,
                Fish: <Ionicons name="fish" size={iconSize} color={color} />,
                Demo: <Ionicons name="play-circle" size={iconSize} color={color} />,
                Settings: <Ionicons name="settings" size={iconSize} color={color} />,
              }
              return (map[route.name] as any) ?? null
            },
          })}
        >
          <Tab.Screen 
            name="Map" 
            component={MapScreen} 
            options={{ title: t('navigation.map') }} 
          />
          <Tab.Screen 
            name="Logbook" 
            component={LogbookScreen} 
            options={{ title: t('navigation.logbook') }} 
          />
          <Tab.Screen 
            name="Weather" 
            component={WeatherScreen} 
            options={{ 
              headerShown: false,
              title: t('navigation.weather') 
            }} 
          />
          <Tab.Screen 
            name="Trip" 
            component={TripPlannerScreen} 
            options={{ title: t('navigation.trip_planner') }} 
          />
          <Tab.Screen 
            name="Alerts" 
            component={AlertsScreen} 
            options={{ title: t('navigation.alerts') }} 
          />
          <Tab.Screen 
            name="Demo" 
            component={DemoJudgesPanel} 
            options={{ title: t('navigation.demo') }} 
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: t('navigation.settings') }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
