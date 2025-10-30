/**
 * 🎭 Demo Dashboard for Judges
 * Interactive demo interface for showcasing all alert systems
 * 
 * Features:
 * - Push notification demos
 * - Boundary alert simulations  
 * - Sound testing
 * - Visual feedback
 * - Judge-friendly controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { boundaryAlertSystem } from '../services/boundaryAlertSystem';
import { notificationService } from '../services/notificationService';
import { modeConfig } from '../services/modeConfig';
import colors from '../theme/colors';

interface DemoStats {
  totalAlerts: number;
  pushNotifications: number;
  boundaryAlerts: number;
  soundsPlayed: number;
}

const DemoJudgesPanel: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMode, setCurrentMode] = useState(modeConfig.getCurrentMode());
  const [demoStats, setDemoStats] = useState<DemoStats>({
    totalAlerts: 0,
    pushNotifications: 0,
    boundaryAlerts: 0,
    soundsPlayed: 0
  });
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Initialize services
    initializeServices();
    
    // Listen for mode changes
    const unsubscribe = modeConfig.addListener((mode) => {
      setCurrentMode(mode);
    });
    
    // Update active alerts every 2 seconds
    const interval = setInterval(() => {
      updateActiveAlerts();
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const initializeServices = async () => {
    try {
      await notificationService.initialize();
      await boundaryAlertSystem.initialize();
      console.log('✅ Demo services initialized');
    } catch (error) {
      console.error('❌ Failed to initialize demo services:', error);
    }
  };

  const updateActiveAlerts = () => {
    const alerts = boundaryAlertSystem.getActiveAlerts();
    setActiveAlerts(alerts);
    setIsMonitoring(boundaryAlertSystem.isMonitoringActive());
  };

  const incrementStat = (statKey: keyof DemoStats) => {
    setDemoStats(prev => ({
      ...prev,
      [statKey]: prev[statKey] + 1,
      totalAlerts: prev.totalAlerts + 1
    }));
  };

  // 🚨 BOUNDARY ALERT DEMOS

  const triggerBoundaryViolation = async () => {
    Alert.alert(
      '🚨 Demo: Boundary Violation',
      'Simulating illegal entry into restricted waters with loud buzzer...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Alert',
          onPress: async () => {
            await boundaryAlertSystem.triggerDemoBoundaryAlert('violation');
            incrementStat('boundaryAlerts');
            incrementStat('soundsPlayed');
          }
        }
      ]
    );
  };

  const triggerBoundaryWarning = async () => {
    Alert.alert(
      '⚠️ Demo: Approaching Boundary',
      'Simulating approach to restricted area with warning sound...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Alert',
          onPress: async () => {
            await boundaryAlertSystem.triggerDemoBoundaryAlert('approaching');
            incrementStat('boundaryAlerts');
            incrementStat('soundsPlayed');
          }
        }
      ]
    );
  };

  const triggerBoundarySequence = async () => {
    Alert.alert(
      '🎬 Demo: Multi-Zone Sequence',
      'Simulating progressive boundary violations across multiple zones...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Sequence',
          onPress: async () => {
            await boundaryAlertSystem.triggerDemoSequence();
            // Stats will be updated automatically as alerts fire
          }
        }
      ]
    );
  };

  // 📱 PUSH NOTIFICATION DEMOS

  const triggerEmergencyAlert = async () => {
    await notificationService.sendDemoAlert('emergency');
    incrementStat('pushNotifications');
  };

  const triggerWeatherAlert = async () => {
    await notificationService.sendDemoAlert('weather');
    incrementStat('pushNotifications');
  };

  const triggerFishingAlert = async () => {
    await notificationService.sendDemoAlert('fishing');
    incrementStat('pushNotifications');
  };

  const triggerNavigationAlert = async () => {
    await notificationService.sendDemoAlert('navigation');
    incrementStat('pushNotifications');
  };

  const triggerRegulatoryAlert = async () => {
    await notificationService.sendDemoAlert('regulatory');
    incrementStat('pushNotifications');
  };

  // 🎛️ MONITORING CONTROLS

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      boundaryAlertSystem.stopMonitoring();
      Alert.alert('📡 Monitoring Stopped', 'Boundary monitoring has been disabled.');
    } else {
      await boundaryAlertSystem.startMonitoring();
      Alert.alert('📡 Monitoring Started', 'Now monitoring boundaries in real-time!');
    }
    setIsMonitoring(!isMonitoring);
  };

  // 🎛️ MODE CONTROLS

  const toggleSystemMode = async () => {
    const modeInfo = modeConfig.getModeDescription();
    Alert.alert(
      `Switch from ${modeInfo.mode} Mode?`,
      `Currently in ${modeInfo.title}\n\nSwitch to ${modeInfo.mode === 'MOCK' ? 'REAL' : 'MOCK'} mode?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Mode',
          onPress: async () => {
            const newMode = await modeConfig.toggleMode();
            Alert.alert(
              'Mode Changed!',
              `System is now in ${newMode} mode. Services will reinitialize with new settings.`,
              [{ text: 'OK' }]
            );
            // Reinitialize services with new mode
            await initializeServices();
          }
        }
      ]
    );
  };

  const resetDemo = () => {
    Alert.alert(
      '🔄 Reset Demo',
      'Clear all stats and active alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setDemoStats({
              totalAlerts: 0,
              pushNotifications: 0,
              boundaryAlerts: 0,
              soundsPlayed: 0
            });
            setActiveAlerts([]);
            // Clear notifications
            notificationService.clearAllNotifications();
            // Stop all boundary alert sounds
            boundaryAlertSystem.stopMonitoring();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎭 SeaSure Judge Demo Panel</Text>
        <Text style={styles.subtitle}>Interactive Alert System Demonstration</Text>
      </View>

      {/* Stats Dashboard */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 Demo Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{demoStats.totalAlerts}</Text>
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{demoStats.pushNotifications}</Text>
            <Text style={styles.statLabel}>Push Notifications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{demoStats.boundaryAlerts}</Text>
            <Text style={styles.statLabel}>Boundary Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{demoStats.soundsPlayed}</Text>
            <Text style={styles.statLabel}>Sounds Played</Text>
          </View>
        </View>
      </View>

      {/* System Mode Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>🎛️ System Mode</Text>
          <TouchableOpacity 
            style={styles.modeToggle}
            onPress={toggleSystemMode}
          >
            <Text style={styles.modeToggleText}>
              {currentMode} MODE {currentMode === 'MOCK' ? '🎭' : '🚀'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.statusText}>
          {modeConfig.getModeDescription().description}
        </Text>
      </View>

      {/* Monitoring Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>📡 Boundary Monitoring</Text>
          <Switch
            value={isMonitoring}
            onValueChange={toggleMonitoring}
            trackColor={{ false: '#767577', true: colors.palette.primary }}
            thumbColor={isMonitoring ? colors.palette.success : '#f4f3f4'}
          />
        </View>
        <Text style={styles.statusText}>
          {isMonitoring ? '✅ Active - Monitoring boundaries' : '⭕ Inactive - No monitoring'}
        </Text>
      </View>

      {/* Boundary Alert Demos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Boundary Alert Demos</Text>
        <Text style={styles.sectionDescription}>
          Simulate maritime boundary violations with loud buzzer sounds
        </Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={triggerBoundaryViolation}>
          <Text style={styles.buttonText}>🆘 BOUNDARY VIOLATION</Text>
          <Text style={styles.buttonSubtext}>Triggers loud continuous buzzer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.warningButton} onPress={triggerBoundaryWarning}>
          <Text style={styles.buttonText}>⚠️ Approaching Boundary</Text>
          <Text style={styles.buttonSubtext}>Warning sound + notification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={triggerBoundarySequence}>
          <Text style={styles.buttonText}>🎬 Multi-Zone Sequence</Text>
          <Text style={styles.buttonSubtext}>Progressive violations demo</Text>
        </TouchableOpacity>
      </View>

      {/* Push Notification Demos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Push Notification Demos</Text>
        <Text style={styles.sectionDescription}>
          Test different types of alerts with vibration patterns
        </Text>
        
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.emergencyButton} onPress={triggerEmergencyAlert}>
            <Text style={styles.smallButtonText}>🆘 Emergency</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.weatherButton} onPress={triggerWeatherAlert}>
            <Text style={styles.smallButtonText}>🌊 Weather</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fishingButton} onPress={triggerFishingAlert}>
            <Text style={styles.smallButtonText}>🐟 Fishing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navigationButton} onPress={triggerNavigationAlert}>
            <Text style={styles.smallButtonText}>🧭 Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.regulatoryButton} onPress={triggerRegulatoryAlert}>
            <Text style={styles.smallButtonText}>📋 Regulatory</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Features Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 AI Features Demo</Text>
        <Text style={styles.sectionDescription}>
          Showcase AI-powered maritime features
        </Text>
        
        <TouchableOpacity 
          style={styles.aiButton} 
          onPress={() => Alert.alert(
            '🐟 AI Fish Recognition',
            'Navigate to "🐟 Fish ID" tab to test:\n\n✅ Camera photo capture\n✅ AI species identification\n✅ Mumbai fish database\n✅ Market prices & regulations\n✅ Protection status warnings',
            [{ text: 'Got it!' }]
          )}
        >
          <Text style={styles.buttonText}>🐟 Fish Recognition AI</Text>
          <Text style={styles.buttonSubtext}>Demo AI fish species identification</Text>
        </TouchableOpacity>
      </View>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Active Alerts</Text>
          {activeAlerts.map((alert, index) => (
            <View key={alert.id} style={styles.alertCard}>
              <Text style={styles.alertTitle}>{alert.zoneName}</Text>
              <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
              <Text style={styles.alertDistance}>
                {alert.distance.toFixed(0)}m away
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsSection}>
        <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
          <Text style={styles.buttonText}>🔄 Reset Demo</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 Demo Instructions for Judges</Text>
        <Text style={styles.instructionsText}>
          1. Toggle "Boundary Monitoring" to simulate real-time tracking{'\n'}
          2. Use "Boundary Alert Demos" to trigger loud buzzer sounds{'\n'}
          3. Test "Push Notification Demos" for different alert types{'\n'}
          4. Watch statistics update in real-time{'\n'}
          5. Check "Alerts" tab to see all triggered notifications{'\n'}
          6. Reset demo between presentations
        </Text>
      </View>

      {/* Mode Information */}
      <View style={styles.modeInfo}>
        <Text style={styles.modeTitle}>🎛️ System Mode</Text>
        <Text style={styles.modeText}>
          <Text style={styles.modeBold}>{modeConfig.getModeDescription().title}</Text>{'\n'}
          {modeConfig.getModeDescription().description}{'\n\n'}
          Benefits:{'\n'}
          {modeConfig.getModeDescription().benefits.map((benefit, index) => 
            `• ${benefit}\n`
          ).join('')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: colors.palette.primary,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.palette.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusContainer: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modeToggle: {
    backgroundColor: colors.palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#fd7e14',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.palette.primary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 5,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emergencyButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherButton: {
    backgroundColor: '#0ea5e9',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  fishingButton: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  navigationButton: {
    backgroundColor: '#7c3aed',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  regulatoryButton: {
    backgroundColor: '#ea580c',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  alertType: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  alertDistance: {
    fontSize: 12,
    color: '#6c757d',
  },
  controlsSection: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: '#8b5cf6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  instructions: {
    margin: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  modeInfo: {
    margin: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 10,
  },
  modeText: {
    fontSize: 14,
    color: '#8e24aa',
    lineHeight: 20,
  },
  modeBold: {
    fontWeight: 'bold',
    color: '#6a1b9a',
  },
});

export default DemoJudgesPanel;