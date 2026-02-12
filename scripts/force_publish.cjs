
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// Need to import executePublish but it's typescript. 
// I'll re-implement the fetch logic here for this one-off script to avoid compilation issues.
// Wait, I can't easily import from .ts file in .cjs script without build.
// I'll just trigger the Cloud Function via HTTP? No, it's a scheduled function (not HTTP).

// Best approach: Update the 'scheduledAt' to NOW for these docs to ensure they are picked up by next run?
// They are already in the past, so they ARE picked up.

// I will write a script to call the 'publishPost' HTTP endpoint for these posts?
// No, publishPost expects content in body. I'd have to read from DB first.

// I'll write a script that reads the doc, calls the publishPost endpoint, and improved the doc.
// OR better: I just wait. Users is impatient.

// I will try to invoke the function via gcloud or firebase?
// `firebase functions:shell` -> `socialPostScheduler()`

// Let's try to run a script that imports the BUILT version of the function?
// The functions are built in `functions/lib/index.js`.
// I can import that?

const { executePublish } = require('../functions/lib/socialPublishing');

async function main() {
    try {
        const now = admin.firestore.Timestamp.now();
        console.log('Checking for overdue posts at', now.toDate().toISOString());

        const snapshot = await db.collection('social_posts')
            .where('status', '==', 'scheduled')
            .get();

        if (snapshot.empty) {
            console.log('No scheduled posts found.');
            return;
        }

        const overduePosts = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.scheduledAt && data.scheduledAt.toDate() <= now.toDate();
        });

        if (overduePosts.length === 0) {
            console.log('No overdue posts found.');
            return;
        }

        console.log(`Found ${overduePosts.length} overdue posts.`);

        for (const doc of overduePosts) {
            const post = doc.data();
            console.log(`Publishing post ${doc.id} to ${post.platform}...`);
            try {
                const result = await executePublish(
                    post.platform,
                    post.content,
                    post.subreddit,
                    post.redditTitle,
                    post.images
                );

                await doc.ref.update({
                    status: 'published',
                    platformPostId: result.platformPostId,
                    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    error: admin.firestore.FieldValue.delete()
                });
                console.log(`Successfully published post ${doc.id}`);
            } catch (error) {
                console.error(`Failed to publish post ${doc.id}:`, error);
                await doc.ref.update({
                    status: 'failed',
                    error: error.message || 'Unknown error',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error('Error in force_publish:', error);
    }
}

main();
