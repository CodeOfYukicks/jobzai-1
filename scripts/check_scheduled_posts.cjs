
const admin = require('firebase-admin');
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

async function checkScheduled() {
    console.log('Checking scheduled posts...');
    const now = admin.firestore.Timestamp.now();
    console.log('Current Server Time:', now.toDate().toISOString());

    try {
        // Simple query without index requirement (if small enough) or just get all scheduled
        // Actually, without index, compound query fails. So just get by status and filter in code.
        const snapshot = await db.collection('social_posts')
            .where('status', '==', 'scheduled')
            .get();

        if (snapshot.empty) {
            console.log('No posts with status "scheduled" found.');
            return;
        }

        console.log(`Found ${snapshot.size} scheduled posts.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            const scheduledAt = data.scheduledAt;
            const scheduledDate = scheduledAt ? scheduledAt.toDate() : null;

            console.log(`\nPost ID: ${doc.id}`);
            console.log(`Platform: ${data.platform}`);
            console.log(`Scheduled At (Firestore):`, scheduledDate ? scheduledDate.toISOString() : 'N/A');
            console.log(`Is Due?`, scheduledDate && scheduledDate <= now.toDate() ? 'YES' : 'NO');
            console.log(`Difference (mins):`, scheduledDate ? (scheduledDate.getTime() - now.toDate().getTime()) / 60000 : 'N/A');
        });

    } catch (error) {
        console.error('Error checking posts:', error);
    }
}

checkScheduled();
