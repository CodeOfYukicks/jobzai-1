/**
 * 🎯 MASTER TRIGGER
 * 
 * Calls all batch functions in PARALLEL
 * Called by Cloud Scheduler daily
 * 
 * Batches complete in parallel → Total time: ~15 minutes instead of 40!
 */

import { onRequest } from 'firebase-functions/v2/https';

const BATCH_URLS = [
	'https://fetchjobsbatch1-pyozgz4rbq-uc.a.run.app',
	'https://fetchjobsbatch2-pyozgz4rbq-uc.a.run.app',
	'https://fetchjobsbatch3-pyozgz4rbq-uc.a.run.app',
	'https://fetchjobsbatch4-pyozgz4rbq-uc.a.run.app',
];

async function callBatch(url: string, batchNum: number): Promise<{ success: boolean; jobs: number }> {
	try {
		console.log(`[MASTER] Triggering batch ${batchNum}...`);
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) {
			console.error(`[MASTER] Batch ${batchNum} failed: ${response.status}`);
			return { success: false, jobs: 0 };
		}

		const data = await response.json();
		console.log(`[MASTER] Batch ${batchNum} complete: ${data.jobs} jobs`);
		return { success: true, jobs: data.jobs || 0 };
	} catch (error: any) {
		console.error(`[MASTER] Batch ${batchNum} error:`, error.message);
		return { success: false, jobs: 0 };
	}
}

export const masterTrigger = onRequest({
	region: 'us-central1',
	cors: true,
	maxInstances: 1,
	timeoutSeconds: 600, // 10 minutes (batches run in parallel)
	memory: '512MiB',
	invoker: 'public',
}, async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
		return;
	}

	try {
		console.log(`[MASTER] 🚀 Starting parallel batch execution`);
		const startTime = Date.now();

		// Call all batches IN PARALLEL
		const results = await Promise.all(
			BATCH_URLS.map((url, idx) => callBatch(url, idx + 1))
		);

		const totalJobs = results.reduce((sum, r) => sum + r.jobs, 0);
		const successCount = results.filter(r => r.success).length;
		const duration = Math.round((Date.now() - startTime) / 1000);

		console.log(`[MASTER] ✅ All batches complete!`);
		console.log(`[MASTER]    Success: ${successCount}/4 batches`);
		console.log(`[MASTER]    Total jobs: ${totalJobs}`);
		console.log(`[MASTER]    Duration: ${duration}s`);

		res.status(200).json({
			success: true,
			totalJobs,
			successCount,
			duration,
			batches: results,
		});
	} catch (error: any) {
		console.error(`[MASTER] Error:`, error);
		res.status(500).json({ success: false, error: error.message });
	}
});

