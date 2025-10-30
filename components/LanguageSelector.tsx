import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { theme } from '../theme/colors'

const { width } = Dimensions.get('window')

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
]

interface LanguageSelectorProps {
  style?: any
  showLabel?: boolean
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  style, 
  showLabel = true 
}) => {
  const { t, i18n } = useTranslation()
  const [modalVisible, setModalVisible] = useState(false)

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0]

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode)
      setModalVisible(false)
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === i18n.language && styles.selectedLanguageItem
      ]}
      onPress={() => changeLanguage(item.code)}
    >
      <Text style={styles.languageFlag}>{item.flag}</Text>
      <View style={styles.languageTextContainer}>
        <Text style={[
          styles.languageName,
          item.code === i18n.language && styles.selectedLanguageName
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.languageNativeName,
          item.code === i18n.language && styles.selectedLanguageNativeName
        ]}>
          {item.nativeName}
        </Text>
      </View>
      {item.code === i18n.language && (
        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
      )}
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{currentLanguage.flag}</Text>
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('settings.language')}</Text>
            <Text style={styles.currentLanguage}>{currentLanguage.nativeName}</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  currentLanguage: {
    fontSize: 12,
    color: theme.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
    gap: 16,
  },
  selectedLanguageItem: {
    backgroundColor: theme.primaryLight + '20',
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  languageFlag: {
    fontSize: 28,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: theme.primary,
  },
  languageNativeName: {
    fontSize: 14,
    color: theme.textMuted,
  },
  selectedLanguageNativeName: {
    color: theme.primary,
  },
})

export default LanguageSelector