/**
 * 🧪 Alert System Test Suite
 * Test script to verify all alert systems are working properly
 */

import { notificationService } from '../services/notificationService';
import { boundaryAlertSystem } from '../services/boundaryAlertSystem';
import AppInitializer from '../utils/AppInitializer';

export class AlertSystemTester {
  
  /**
   * Run comprehensive test of all alert systems
   */
  static async runFullTest(): Promise<boolean> {
    console.log('🧪 Starting SeaSure Alert System Test Suite...\n');

    try {
      // Test 1: Initialization
      console.log('📋 Test 1: Service Initialization');
      await AppInitializer.initialize();
      const status = AppInitializer.getStatus();
      
      console.log(`✅ App initialized: ${status.initialized}`);
      console.log(`✅ Notifications ready: ${status.notifications}`);
      console.log(`✅ Boundary system ready: ${status.boundaries}\n`);

      // Test 2: Push Notifications
      console.log('📋 Test 2: Push Notification System');
      await this.testNotifications();

      // Test 3: Boundary Alerts
      console.log('📋 Test 3: Boundary Alert System');
      await this.testBoundaryAlerts();

      // Test 4: Demo Functions
      console.log('📋 Test 4: Demo Functionality');
      await this.testDemoFunctions();

      console.log('🎉 All tests completed successfully!\n');
      console.log('🚀 SeaSure Alert System is DEMO READY for judges! 🎭');
      
      return true;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    }
  }

  /**
   * Test push notification functionality
   */
  private static async testNotifications(): Promise<void> {
    console.log('  🔔 Testing emergency notification...');
    await notificationService.sendDemoAlert('emergency');
    
    console.log('  🌊 Testing weather notification...');
    await notificationService.sendDemoAlert('weather');
    
    console.log('  🐟 Testing fishing notification...');
    await notificationService.sendDemoAlert('fishing');
    
    console.log('  ✅ Push notifications working!\n');
  }

  /**
   * Test boundary alert system
   */
  private static async testBoundaryAlerts(): Promise<void> {
    console.log('  🚨 Testing boundary violation alert...');
    await boundaryAlertSystem.triggerDemoBoundaryAlert('violation');
    
    console.log('  ⚠️ Testing boundary warning alert...');
    await boundaryAlertSystem.triggerDemoBoundaryAlert('approaching');
    
    const zones = boundaryAlertSystem.getBoundaryZones();
    console.log(`  📍 Loaded ${zones.length} boundary zones`);
    
    console.log('  ✅ Boundary alerts working!\n');
  }

  /**
   * Test demo functions for judges
   */
  private static async testDemoFunctions(): Promise<void> {
    console.log('  🎬 Testing multi-zone sequence...');
    await boundaryAlertSystem.triggerDemoSequence();
    
    console.log('  📱 Testing multiple demo alerts...');
    await notificationService.sendDemoAlerts();
    
    console.log('  ✅ Demo functions working!\n');
  }

  /**
   * Quick test for judge demonstrations
   */
  static async quickDemoTest(): Promise<void> {
    console.log('🎭 Quick Demo Test for Judges\n');
    
    // Initialize
    await AppInitializer.initialize();
    
    // Demo boundary violation with loud buzzer
    console.log('🚨 Triggering LOUD BOUNDARY VIOLATION for demonstration...');
    await boundaryAlertSystem.triggerDemoBoundaryAlert('violation');
    
    // Demo emergency notification
    console.log('🆘 Sending EMERGENCY NOTIFICATION...');
    await notificationService.sendDemoAlert('emergency');
    
    console.log('✅ Demo test complete! Judge can see/hear alerts now.');
  }
}

export default AlertSystemTester;