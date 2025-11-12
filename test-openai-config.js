// Script de test pour vérifier la configuration OpenAI
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'jobzai'
    });
    console.log('✅ Firebase Admin initialized with service account');
    firebaseInitialized = true;
  } else {
    admin.initializeApp({
      projectId: 'jobzai'
    });
    console.log('✅ Firebase Admin initialized with default credentials');
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.error('   Error details:', error);
}

// Function to get OpenAI API key (same as server.cjs)
async function getOpenAIApiKey() {
  const sources = [];
  
  // Try Firestore
  if (firebaseInitialized) {
    try {
      console.log('\n🔑 Attempting to retrieve OpenAI API key from Firestore...');
      const settingsDoc = await admin.firestore().collection('settings').doc('openai').get();
      
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        const apiKey = data?.apiKey || data?.api_key;
        if (apiKey) {
          console.log('✅ OpenAI API key retrieved from Firestore');
          console.log('   First 10 chars:', apiKey.substring(0, 10) + '...');
          console.log('   Key length:', apiKey.length);
          sources.push('Firestore');
          return { apiKey, source: 'Firestore' };
        } else {
          console.warn('⚠️  Document exists but apiKey field is missing');
          console.warn('   Available fields:', Object.keys(data || {}));
        }
      } else {
        console.warn('⚠️  Document settings/openai does not exist in Firestore');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve API key from Firestore:', error.message);
      console.error('   Error details:', error);
    }
  } else {
    console.warn('⚠️  Firebase Admin not initialized, skipping Firestore check');
  }
  
  // Try environment variables
  if (process.env.OPENAI_API_KEY) {
    console.log('\n✅ OpenAI API key found in OPENAI_API_KEY environment variable');
    console.log('   First 10 chars:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
    sources.push('OPENAI_API_KEY');
    return { apiKey: process.env.OPENAI_API_KEY, source: 'OPENAI_API_KEY' };
  }
  
  if (process.env.VITE_OPENAI_API_KEY) {
    console.log('\n✅ OpenAI API key found in VITE_OPENAI_API_KEY environment variable');
    console.log('   First 10 chars:', process.env.VITE_OPENAI_API_KEY.substring(0, 10) + '...');
    sources.push('VITE_OPENAI_API_KEY');
    return { apiKey: process.env.VITE_OPENAI_API_KEY, source: 'VITE_OPENAI_API_KEY' };
  }
  
  console.error('\n❌ No OpenAI API key found in any source');
  return null;
}

// Test OpenAI API with the key
async function testOpenAIAPI(apiKey) {
  console.log('\n🧪 Testing OpenAI API with retrieved key...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API connection successful!');
      console.log('   Available models:', data.data?.length || 0);
      
      // Check if gpt-4o is available
      const gpt4oAvailable = data.data?.some(model => model.id === 'gpt-4o');
      if (gpt4oAvailable) {
        console.log('✅ GPT-4o model is available');
      } else {
        console.warn('⚠️  GPT-4o model not found in available models');
        console.log('   Available GPT models:', data.data?.filter(m => m.id.includes('gpt')).map(m => m.id).join(', ') || 'None');
      }
      
      return true;
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('❌ OpenAI API test failed');
      console.error('   Status:', response.status);
      console.error('   Error:', errorData.error?.message || errorData.message || 'Unknown error');
      console.error('   Error type:', errorData.error?.type);
      console.error('   Error code:', errorData.error?.code);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing OpenAI API:', error.message);
    console.error('   Error details:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('='.repeat(60));
  console.log('OpenAI Configuration Diagnostic Tool');
  console.log('='.repeat(60));
  
  // Test 1: Get API key
  const keyResult = await getOpenAIApiKey();
  
  if (!keyResult) {
    console.error('\n❌ CRITICAL: No OpenAI API key found!');
    console.error('\nSolutions:');
    console.error('1. Add OPENAI_API_KEY to your .env file');
    console.error('2. Create settings/openai document in Firestore with apiKey field');
    console.error('3. Set VITE_OPENAI_API_KEY environment variable');
    process.exit(1);
  }
  
  console.log(`\n✅ API key found from: ${keyResult.source}`);
  
  // Test 2: Test API connection
  const apiTest = await testOpenAIAPI(keyResult.apiKey);
  
  if (!apiTest) {
    console.error('\n❌ CRITICAL: OpenAI API test failed!');
    console.error('   Please check:');
    console.error('   1. The API key is valid');
    console.error('   2. You have credits/quota available');
    console.error('   3. Your network connection is working');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed! OpenAI configuration is correct.');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});


