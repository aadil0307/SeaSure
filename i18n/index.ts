import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import translation files
import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'
import ta from './locales/ta.json'

const LANGUAGES = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  ta: { translation: ta },
}

// Initialize with synchronous setup first
i18n
  .use(initReactI18next)
  .init({
    resources: LANGUAGES,
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: false, // Disable debug to reduce console noise
    
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'translation',
  })

// Async language detection and loading
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user-language')
    if (savedLanguage && Object.keys(LANGUAGES).includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage)
    }
  } catch (error) {
    console.log('Could not load saved language:', error)
  }
}

// Load saved language after initialization
loadSavedLanguage()

export default i18n