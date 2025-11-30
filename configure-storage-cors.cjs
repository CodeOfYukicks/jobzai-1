const { Storage } = require('@google-cloud/storage');

async function configureCORS() {
  try {
    console.log('🔧 Configuring CORS for Firebase Storage bucket...');
    console.log('📝 Using Application Default Credentials from Firebase CLI');
    
    // Initialize Google Cloud Storage using Application Default Credentials
    // This uses the credentials from `firebase login`
    const storage = new Storage({
      projectId: 'jobzai'
    });
    
    const bucketName = 'jobzai.firebasestorage.app';
    const bucket = storage.bucket(bucketName);
    
    // CORS configuration
    const corsConfiguration = [
      {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5178', 'https://jobzai.web.app', 'https://jobzai.firebaseapp.com'],
        method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'Access-Control-Allow-Origin'],
        maxAgeSeconds: 3600
      }
    ];
    
    await bucket.setCorsConfiguration(corsConfiguration);
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('📋 Configuration:', JSON.stringify(corsConfiguration, null, 2));
    
    // Verify the configuration
    const [metadata] = await bucket.getMetadata();
    console.log('📊 Current CORS config:', JSON.stringify(metadata.cors, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

configureCORS();

