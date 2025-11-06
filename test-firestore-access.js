// Script de test pour vérifier l'accès à Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: 'jobzai'
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

// Test Firestore access
async function testFirestoreAccess() {
  try {
    console.log('\n📖 Testing Firestore access...');
    
    // Test 1: Check if settings/openai exists
    console.log('\n1. Checking settings/openai document...');
    const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();
    
    if (settingsDoc.exists()) {
      console.log('✅ Document exists');
      const data = settingsDoc.data();
      console.log('   Document fields:', Object.keys(data || {}));
      
      // Check for apiKey field
      if (data?.apiKey) {
        console.log('✅ apiKey field found (first 10 chars):', data.apiKey.substring(0, 10) + '...');
        console.log('   Full key length:', data.apiKey.length);
      } else if (data?.api_key) {
        console.log('✅ api_key field found (first 10 chars):', data.api_key.substring(0, 10) + '...');
        console.log('   Full key length:', data.api_key.length);
      } else {
        console.log('❌ No apiKey or api_key field found');
        console.log('   Available fields:', Object.keys(data || {}));
      }
    } else {
      console.log('❌ Document does not exist');
      console.log('   Please create settings/openai document in Firestore');
      console.log('   With field: apiKey = "sk-..."');
    }
    
    // Test 2: List all settings documents
    console.log('\n2. Listing all settings documents...');
    const settingsSnapshot = await admin.firestore().collection('settings').get();
    console.log(`   Found ${settingsSnapshot.size} document(s) in settings collection:`);
    settingsSnapshot.forEach(doc => {
      console.log(`   - ${doc.id}:`, Object.keys(doc.data() || {}));
    });
    
    console.log('\n✅ Firestore access test completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error accessing Firestore:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testFirestoreAccess();

