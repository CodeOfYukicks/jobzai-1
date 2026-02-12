import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { executePublish } from "../socialPublishing";

if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Scheduled task to publish social posts that are due.
 * Runs every 10 minutes.
 */
export const socialPostScheduler = onSchedule({
    schedule: "every 10 minutes",
    timeZone: "Europe/Paris",
    region: "us-central1"
}, async (event) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    console.log("Running socialPostScheduler at", now.toDate().toISOString());

    try {
        // Query for posts that are 'scheduled' and due (scheduledAt <= now)
        const snapshot = await db.collection('social_posts')
            .where('status', '==', 'scheduled')
            .where('scheduledAt', '<=', now)
            .get();

        if (snapshot.empty) {
            console.log("No scheduled posts to publish.");
            return;
        }

        console.log(`Found ${snapshot.size} posts to publish.`);

        const promises = snapshot.docs.map(async (doc) => {
            const post = doc.data();
            console.log(`Publishing post ${doc.id} to ${post.platform}...`);

            try {
                // Call the shared publish logic from socialPublishing.ts
                // Note: images is optional
                const result = await executePublish(
                    post.platform,
                    post.content,
                    post.subreddit,
                    post.redditTitle,
                    post.images
                );

                // Update success
                await doc.ref.update({
                    status: 'published',
                    platformPostId: result.platformPostId,
                    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    error: admin.firestore.FieldValue.delete() // Clear previous errors if any
                });

                console.log(`Successfully published post ${doc.id}`);

            } catch (error: any) {
                console.error(`Failed to publish post ${doc.id}:`, error);

                // Update failure
                await doc.ref.update({
                    status: 'failed',
                    error: error.message || 'Unknown error',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await Promise.all(promises);
        console.log("Finished processing scheduled posts.");

    } catch (error) {
        console.error("Error in socialPostScheduler:", error);
    }
});
