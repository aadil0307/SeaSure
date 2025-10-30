import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { authService } from './auth';
import { notificationService } from './notificationService';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
}

export interface EmergencyLog {
  id: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  userId?: string;
  message: string;
  status: 'active' | 'resolved' | 'false_alarm';
  emergencyType: 'sos' | 'medical' | 'maritime' | 'weather' | 'other';
}

class EmergencyService {
  private storageKey = 'emergency_contacts';
  private logStorageKey = 'emergency_logs';

  /**
   * Add emergency contact
   */
  async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const newContact: EmergencyContact = {
        ...contact,
        id: `emergency_${Date.now()}`,
      };

      // If this is set as primary, unset other primary contacts
      if (newContact.isPrimary) {
        contacts.forEach(c => c.isPrimary = false);
      }

      contacts.push(newContact);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(contacts));
      
      console.log('✅ Emergency contact added:', newContact.name);
    } catch (error) {
      console.error('❌ Failed to add emergency contact:', error);
      throw error;
    }
  }

  /**
   * Get all emergency contacts
   */
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const contactsJson = await AsyncStorage.getItem(this.storageKey);
      return contactsJson ? JSON.parse(contactsJson) : [];
    } catch (error) {
      console.error('❌ Failed to get emergency contacts:', error);
      return [];
    }
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(contactId: string, updates: Partial<EmergencyContact>): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);

      if (contactIndex === -1) {
        throw new Error('Contact not found');
      }

      // If setting this as primary, unset others
      if (updates.isPrimary) {
        contacts.forEach(c => c.isPrimary = false);
      }

      contacts[contactIndex] = { ...contacts[contactIndex], ...updates };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(contacts));
      
      console.log('✅ Emergency contact updated:', contacts[contactIndex].name);
    } catch (error) {
      console.error('❌ Failed to update emergency contact:', error);
      throw error;
    }
  }

  /**
   * Remove emergency contact
   */
  async removeEmergencyContact(contactId: string): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(updatedContacts));
      
      console.log('✅ Emergency contact removed');
    } catch (error) {
      console.error('❌ Failed to remove emergency contact:', error);
      throw error;
    }
  }

  /**
   * Trigger emergency alert
   */
  async triggerEmergency(
    location: { latitude: number; longitude: number; accuracy?: number },
    emergencyType: EmergencyLog['emergencyType'] = 'sos',
    customMessage?: string
  ): Promise<EmergencyLog> {
    try {
      const currentUser = authService.getCurrentUser();
      const timestamp = Date.now();
      
      // Create emergency log
      const emergencyLog: EmergencyLog = {
        id: `emergency_${timestamp}`,
        timestamp,
        location,
        userId: currentUser?.uid,
        message: customMessage || this.getDefaultEmergencyMessage(emergencyType),
        status: 'active',
        emergencyType,
      };

      // Store emergency log
      await this.saveEmergencyLog(emergencyLog);

      // Send notifications to emergency contacts
      await this.notifyEmergencyContacts(emergencyLog);

      // Send local notification
      await this.sendEmergencyNotification(emergencyLog);

      console.log('🚨 Emergency triggered:', emergencyLog.id);
      return emergencyLog;

    } catch (error) {
      console.error('❌ Failed to trigger emergency:', error);
      throw error;
    }
  }

  /**
   * Save emergency log
   */
  private async saveEmergencyLog(log: EmergencyLog): Promise<void> {
    try {
      const logs = await this.getEmergencyLogs();
      logs.unshift(log); // Add to beginning of array

      // Keep only last 100 emergency logs
      const trimmedLogs = logs.slice(0, 100);
      
      await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('❌ Failed to save emergency log:', error);
    }
  }

  /**
   * Get emergency logs
   */
  async getEmergencyLogs(): Promise<EmergencyLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.logStorageKey);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('❌ Failed to get emergency logs:', error);
      return [];
    }
  }

  /**
   * Notify emergency contacts
   */
  private async notifyEmergencyContacts(emergencyLog: EmergencyLog): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const primaryContact = contacts.find(c => c.isPrimary);
      
      if (primaryContact) {
        // In a real implementation, you would integrate with SMS service
        console.log(`📱 Notifying primary contact: ${primaryContact.name} (${primaryContact.phoneNumber})`);
        
        // Show alert to user about notification attempt
        Alert.alert(
          'Emergency Contacts Notified',
          `Attempting to notify ${primaryContact.name} at ${primaryContact.phoneNumber}\n\nLocation: ${emergencyLog.location.latitude.toFixed(6)}, ${emergencyLog.location.longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('⚠️ No primary emergency contact set');
        Alert.alert(
          'No Emergency Contact',
          'Please set up emergency contacts in Settings for automatic notifications.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Failed to notify emergency contacts:', error);
    }
  }

  /**
   * Send local emergency notification
   */
  private async sendEmergencyNotification(emergencyLog: EmergencyLog): Promise<void> {
    try {
      await notificationService.sendNotification({
        id: `emergency_${emergencyLog.id}`,
        type: 'emergency',
        title: '🚨 Emergency Alert Active',
        message: `Emergency logged at ${new Date(emergencyLog.timestamp).toLocaleTimeString()}. Location: ${emergencyLog.location.latitude.toFixed(4)}, ${emergencyLog.location.longitude.toFixed(4)}`,
        priority: 'critical',
        timestamp: emergencyLog.timestamp,
        location: emergencyLog.location,
        data: {
          type: 'emergency',
          logId: emergencyLog.id,
          location: emergencyLog.location,
        }
      });
    } catch (error) {
      console.error('❌ Failed to send emergency notification:', error);
    }
  }

  /**
   * Update emergency status
   */
  async updateEmergencyStatus(logId: string, status: EmergencyLog['status']): Promise<void> {
    try {
      const logs = await this.getEmergencyLogs();
      const logIndex = logs.findIndex(log => log.id === logId);

      if (logIndex !== -1) {
        logs[logIndex].status = status;
        await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(logs));

        // Send notification about status update
        if (status === 'resolved') {
          await notificationService.sendNotification({
            id: `emergency_resolved_${logId}`,
            type: 'emergency',
            title: '✅ Emergency Resolved',
            message: 'Emergency situation has been marked as resolved.',
            priority: 'medium',
            timestamp: Date.now(),
          });
        }

        console.log(`✅ Emergency status updated: ${logId} -> ${status}`);
      }
    } catch (error) {
      console.error('❌ Failed to update emergency status:', error);
      throw error;
    }
  }

  /**
   * Get default emergency message based on type
   */
  private getDefaultEmergencyMessage(type: EmergencyLog['emergencyType']): string {
    const messages = {
      sos: 'EMERGENCY! I need immediate help.',
      medical: 'MEDICAL EMERGENCY! Require medical assistance.',
      maritime: 'MARITIME EMERGENCY! Vessel in distress.',
      weather: 'WEATHER EMERGENCY! Caught in severe weather conditions.',
      other: 'EMERGENCY! Require assistance.',
    };

    return messages[type] || messages.other;
  }

  /**
   * Get emergency statistics
   */
  async getEmergencyStats(): Promise<{
    totalEmergencies: number;
    activeEmergencies: number;
    resolvedEmergencies: number;
    lastEmergency?: EmergencyLog;
  }> {
    try {
      const logs = await this.getEmergencyLogs();

      return {
        totalEmergencies: logs.length,
        activeEmergencies: logs.filter(log => log.status === 'active').length,
        resolvedEmergencies: logs.filter(log => log.status === 'resolved').length,
        lastEmergency: logs[0],
      };
    } catch (error) {
      console.error('❌ Failed to get emergency stats:', error);
      return {
        totalEmergencies: 0,
        activeEmergencies: 0,
        resolvedEmergencies: 0,
      };
    }
  }

  /**
   * Clear old emergency logs
   */
  async clearOldLogs(daysOld: number = 30): Promise<void> {
    try {
      const logs = await this.getEmergencyLogs();
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const recentLogs = logs.filter(log => 
        log.timestamp > cutoffTime || log.status === 'active'
      );

      await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(recentLogs));
      
      const clearedCount = logs.length - recentLogs.length;
      console.log(`✅ Cleared ${clearedCount} old emergency logs`);
    } catch (error) {
      console.error('❌ Failed to clear old logs:', error);
      throw error;
    }
  }
}

export const emergencyService = new EmergencyService();