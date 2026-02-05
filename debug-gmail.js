
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'jobzai'
        });
        console.log('✅ Firebase Admin initialized with service account');
    } else {
        admin.initializeApp({
            projectId: 'jobzai'
        });
        console.log('✅ Firebase Admin initialized with default credentials');
    }
} catch (error) {
    console.error('⚠️  Firebase Admin initialization failed:', error.message);
}

async function debugGmail() {
    try {
        console.log('--- Checking Firestore Settings ---');
        const db = admin.firestore();
        const gmailSettingsDoc = await db.collection('settings').doc('gmail').get();

        if (!gmailSettingsDoc.exists) {
            console.log('❌ settings/gmail doc does NOT exist');
            return;
        }

        const data = gmailSettingsDoc.data();
        console.log('✅ settings/gmail doc exists');
        console.log('CLIENT_ID:', data.CLIENT_ID ? data.CLIENT_ID.substring(0, 10) + '...' : 'MISSING');
        console.log('CLIENT_SECRET:', data.CLIENT_SECRET ? data.CLIENT_SECRET.substring(0, 5) + '...' : 'MISSING');

        console.log('\n--- Checking Google API Connectivity ---');
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: 'dummy_code',
                    client_id: data.CLIENT_ID || 'dummy_id',
                    client_secret: data.CLIENT_SECRET || 'dummy_secret',
                    redirect_uri: 'postmessage',
                    grant_type: 'authorization_code'
                })
            });

            const json = await response.json();
            console.log('Google API Status:', response.status);
            console.log('Google API Response:', json);

            if (response.status === 400 && json.error === 'invalid_grant') {
                console.log('✅ Managed to reach Google API (Expected error for dummy code)');
            } else if (response.status === 400) {
                console.log('⚠️  Reached Google API but got different error (check credentials?)');
            } else {
                console.log('❌ Unexpected response status');
            }

        } catch (netError) {
            console.error('❌ Network Error contacting Google:', netError.message);
        }

    } catch (err) {
        console.error('❌ Script Error:', err);
    }
}

debugGmail();
