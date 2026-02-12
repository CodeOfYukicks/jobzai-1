
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

async function checkConfig() {
    console.log('Checking settings/social_twitter...');
    try {
        const doc = await db.collection('settings').doc('social_twitter').get();
        if (!doc.exists) {
            console.log('Document not found!');
            return;
        }
        const data = doc.data();
        console.log('Data keys:', Object.keys(data));
        if (data.credentials) {
            console.log('Credentials keys:', Object.keys(data.credentials));
            console.log('Has clientId?', !!data.credentials.clientId);
            console.log('Has clientSecret?', !!data.credentials.clientSecret);
            console.log('Has accessToken?', !!data.credentials.accessToken);
            console.log('Has refreshToken?', !!data.credentials.refreshToken);
        } else {
            console.log('No credentials object found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkConfig();
