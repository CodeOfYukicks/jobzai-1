const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'jobzai'
    });
}

const db = admin.firestore();

async function analyzeLocations() {
    console.log('Fetching all jobs to analyze locations...');
    const snapshot = await db.collection('jobs').select('location').get();

    const locations = {};
    snapshot.docs.forEach(doc => {
        const loc = doc.data().location;
        if (loc) {
            locations[loc] = (locations[loc] || 0) + 1;
        }
    });

    console.log(`Found ${Object.keys(locations).length} unique locations.`);

    // Sort by frequency
    const sorted = Object.entries(locations).sort((a, b) => b[1] - a[1]);

    console.log('\nTop 50 Locations:');
    sorted.slice(0, 50).forEach(([loc, count]) => {
        console.log(`${count.toString().padStart(4)}: ${loc}`);
    });
}

analyzeLocations().catch(console.error);
