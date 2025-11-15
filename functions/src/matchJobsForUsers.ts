import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { cosineSimilarity } from './utils/cosine';
import { JobDocument, UserProfile } from './types';

const REGION = process.env.FUNCTION_REGION || 'us-central1';

export const matchJobsForUsers = onSchedule(
	{
		region: REGION,
		schedule: 'every 8 hours',
		timeZone: 'UTC',
		retryCount: 3,
		maxInstances: 1,
	},
	async () => {
		const db = admin.firestore();
		const now = admin.firestore.Timestamp.now();
		const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);

		const usersSnap = await db.collection('users').get();
		const users = usersSnap.docs
			.map((d) => ({ id: d.id, ...(d.data() as UserProfile) }))
			.filter((u) => Array.isArray(u.embedding) && u.embedding.length > 0);

		if (!users.length) return;

		const jobsSnap = await db
			.collection('jobs')
			.where('postedAt', '>=', thirtyDaysAgo)
			.get();

		const jobs = jobsSnap.docs
			.map((d) => ({ id: d.id, ...(d.data() as JobDocument) }))
			.filter((j) => Array.isArray(j.embedding) && j.embedding.length > 0);

		if (!jobs.length) return;

		const writer = db.bulkWriter();

		for (const u of users) {
			for (const j of jobs) {
				const score = cosineSimilarity(u.embedding as number[], j.embedding as number[]);
				if (score > 0.75) {
					const matchId = `${u.id}_${j.id}`;
					const ref = db.collection('matches').doc(matchId);
					writer.set(ref, { userId: u.id, jobId: j.id, score, viewed: false }, { merge: true });
				}
			}
		}

		await writer.close();
	}
);




