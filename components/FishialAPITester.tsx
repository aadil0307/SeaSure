import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { fishialAPIService } from '../services/fishialAPI';

export const FishialAPITester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testAPI = async () => {
    setTesting(true);
    setResult('Testing API connection...');
    
    try {
      const testResult = await fishialAPIService.testAPIConnection();
      setResult(testResult.message);
      
      if (testResult.success) {
        Alert.alert(
          'API Test Success ✅',
          testResult.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'API Test Failed ❌',
          testResult.message,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Test failed: ${errorMsg}`);
      Alert.alert('Test Error', errorMsg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐠 Fishial API Tester</Text>
      
      <Text style={styles.info}>
        Current Mode: {fishialAPIService.MOCK_MODE ? 'MOCK (Demo Data)' : 'LIVE (Real AI)'}
      </Text>
      
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testAPI}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? '🔄 Testing...' : '🧪 Test API Connection'}
        </Text>
      </TouchableOpacity>
      
      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>💡 Instructions:</Text>
        <Text style={styles.instructionsText}>
          • MOCK MODE: Uses demo data for testing{'\n'}
          • LIVE MODE: Uses real Fishial AI detection{'\n'}
          • To switch: Edit services/fishialAPI.ts{'\n'}
          • Change MOCK_MODE = true/false
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    color: '#1565c0',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  resultText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default FishialAPITester;