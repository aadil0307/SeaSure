const fishialAPI = require('./services/fishialAPI').default;

async function testFishialAPI() {
  console.log('🧪 Testing Fishial API Integration...\n');
  
  try {
    // Test the API connection using the built-in test method
    const connectionResult = await fishialAPI.testAPIConnection();
    console.log('Connection Test:', connectionResult.message);
    
    if (connectionResult.success) {
      console.log('\n✅ API Integration is working!');
      
      // Show current mode
      if (fishialAPI.MOCK_MODE) {
        console.log('\n📍 Current Status: MOCK MODE (Demo Data)');
        console.log('💡 To use real Fishial API for live fish detection:');
        console.log('   1. Open services/fishialAPI.ts');
        console.log('   2. Change line: MOCK_MODE = true to MOCK_MODE = false');
        console.log('   3. Save and restart the app');
        console.log('   4. Camera will now use real AI fish detection!');
      } else {
        console.log('\n📍 Current Status: LIVE MODE (Real AI Detection)');
        console.log('✨ Your app is using real Fishial AI for fish detection!');
      }
    } else {
      console.log('\n❌ API connection failed.');
      console.log('🔧 Please check:');
      console.log('   - Internet connection');
      console.log('   - API credentials in services/realFishialAPI.ts');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message || error);
  }
}

testFishialAPI();