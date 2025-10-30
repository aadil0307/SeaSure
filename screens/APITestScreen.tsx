import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import { fishialAPIService } from '../services/fishialAPI';

const APITestScreen: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState({
    mockMode: true,
    baseUrl: 'https://mockapi.fishial.ai',
    apiKey: 'b7fd36488de61c6b050a7550',
    secret: '17492a8c3a76f363cef01efb964e2f0a'
  });

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await fishialAPIService.testAPIConnection();
      setTestResult(result.message);
      
      if (result.success) {
        Alert.alert(
          '✅ API Test Successful!',
          'The API connection is working. You can now disable MOCK_MODE in the service to use real data.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ API Test Failed',
          result.message,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`❌ Test error: ${errorMessage}`);
      Alert.alert('Error', errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const showInstructions = () => {
    Alert.alert(
      '📚 How to Enable Real API',
      `Steps to switch to real Fishial API:

1. Find the correct API endpoint
2. Update BASE_URL in fishialAPI.ts
3. Set MOCK_MODE = false
4. Test using this screen
5. Verify fish detection works

Current Settings:
• Mock Mode: ${currentConfig.mockMode ? 'ON' : 'OFF'}
• Endpoint: ${currentConfig.baseUrl}
• API Key: ${currentConfig.apiKey.substring(0, 8)}...`,
      [{ text: 'Got it!' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flask" size={32} color={theme.primary} />
        <Text style={styles.title}>Fishial API Tester</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Current Configuration</Text>
        <View style={styles.configCard}>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Mode:</Text>
            <View style={[styles.badge, currentConfig.mockMode ? styles.mockBadge : styles.realBadge]}>
              <Text style={styles.badgeText}>
                {currentConfig.mockMode ? 'MOCK' : 'REAL'}
              </Text>
            </View>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Endpoint:</Text>
            <Text style={styles.configValue}>{currentConfig.baseUrl}</Text>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>API Key:</Text>
            <Text style={styles.configValue}>{currentConfig.apiKey.substring(0, 12)}...</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Connection</Text>
        <TouchableOpacity 
          style={[styles.testButton, testing && styles.testButtonDisabled]} 
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="play-circle" size={24} color="#ffffff" />
          )}
          <Text style={styles.testButtonText}>
            {testing ? 'Testing Connection...' : 'Test API Connection'}
          </Text>
        </TouchableOpacity>

        {testResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{testResult}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Instructions</Text>
        <TouchableOpacity style={styles.instructionButton} onPress={showInstructions}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={styles.instructionText}>How to Enable Real API</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Important Notes</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            • Currently running in MOCK mode for development{'\n'}
            • Mock mode returns realistic test data{'\n'}
            • All UI functionality works with mock data{'\n'}
            • Switch to real API when endpoint is confirmed{'\n'}
            • Test connection before disabling mock mode
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginLeft: 12,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  configCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  configValue: {
    fontSize: 14,
    color: theme.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mockBadge: {
    backgroundColor: theme.warning,
  },
  realBadge: {
    backgroundColor: theme.success,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  testButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultText: {
    fontSize: 14,
    color: theme.text,
    fontFamily: 'monospace',
  },
  instructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
  },
  noteCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
  },
  noteText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
});

export default APITestScreen;