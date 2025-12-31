const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function checkKey() {
    try {
        const doc = await admin.firestore().collection('settings').doc('perplexity').get();
        if (!doc.exists) {
            console.log('❌ Document settings/perplexity does not exist');
            return;
        }
        const data = doc.data();
        const apiKey = data.apiKey;

        if (!apiKey) {
            console.log('❌ apiKey field is missing');
            return;
        }

        console.log('✅ Key found');
        console.log('Length:', apiKey.length);
        console.log('Starts with:', apiKey.substring(0, 5));
        console.log('Ends with:', apiKey.substring(apiKey.length - 4));
        console.log('Contains whitespace:', /\s/.test(apiKey));
        console.log('Contains quotes:', /['"]/.test(apiKey));

    } catch (error) {
        console.error('Error:', error);
    }
}

checkKey();
