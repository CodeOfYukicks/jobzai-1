# Migration Guide: Queue-Based ATS Architecture

## Overview

This guide explains how to migrate from the legacy `fetchJobsFromATS` to the new queue-based architecture.

## Why Migrate?

| Feature | Legacy System | New Queue-Based System |
|---------|--------------|----------------------|
| **Timeout** | ❌ Single 540s for ALL sources | ✅ 540s per source |
| **Scalability** | ❌ ~5k jobs max | ✅ Unlimited |
| **Enrichment** | ❌ Blocking LLM calls | ✅ Async background processing |
| **Retry** | ❌ No retry | ✅ Automatic 3x retry per source |
| **Observability** | ❌ Aggregated metrics only | ✅ Per-source metrics |
| **Concurrency** | ❌ Sequential batches of 3 | ✅ Up to 10 parallel workers |
| **Memory** | ❌ All jobs in memory | ✅ Batched writes (500/batch) |

## Architecture Comparison

### Legacy (Old)

```
CRON (540s timeout)
  ↓
Process ALL sources sequentially in chunks of 3
  ↓
Write all jobs with bulkWriter (memory issue)
  ↓
Enrich skills inline with LLM (blocking, slow)
  ↓
If timeout: ALL remaining sources fail ❌
```

### New Queue-Based

```
CRON Scheduler (60s)
  ↓ Creates tasks
Cloud Task Queue
  ↓ 10 parallel workers
Fetch Worker (540s each)
  ↓ Batched writes (500/batch)
Firestore
  ↓ Creates enrichment tasks
Enrichment Queue
  ↓ 50 parallel workers
Enrichment Worker (60s each)
  ↓ Update skills
Firestore
```

## Migration Steps

### Step 1: Verify New Functions are Deployed

```bash
# Check that new functions are deployed
firebase functions:list | grep -E "(scheduleFetchJobs|fetchJobsWorker|enrichSkillsWorker)"
```

You should see:
- `scheduleFetchJobs` - CRON scheduler
- `fetchJobsWorker` - Fetch queue worker
- `enrichSkillsWorker` - Enrichment worker

If not deployed:

```bash
firebase deploy --only functions:scheduleFetchJobs,functions:fetchJobsWorker,functions:enrichSkillsWorker
```

### Step 2: Disable Legacy Function (Optional)

The legacy function is kept for backward compatibility. You can disable it by:

**Option A: Comment out in index.ts**

```typescript
// functions/src/index.ts

// Disable legacy function
// export { fetchJobsFromATS } from './fetchJobs';

export { generateJobEmbedding } from './generateJobEmbedding';
// ... other exports
```

**Option B: Delete the schedule in Firebase Console**

1. Go to Firebase Console → Functions
2. Find `fetchJobsFromATS`
3. Delete or pause the schedule

### Step 3: Monitor New System

The new system starts automatically. Monitor it:

```bash
# Watch scheduler logs
firebase functions:log --only scheduleFetchJobs

# Watch worker logs
firebase functions:log --only fetchJobsWorker,enrichSkillsWorker
```

### Step 4: Verify Data

Check Firestore collections:

1. **`aggregatedFetchMetrics`** - Overall execution metrics
   ```
   Doc ID: exec_<timestamp>
   Fields:
   - totalSources: 13
   - sourcesCompleted: 13
   - totalJobsFetched: 2566
   - status: 'completed'
   ```

2. **`jobFetchMetrics`** - Per-source metrics
   ```
   Doc ID: exec_<timestamp>_greenhouse_stripe
   Fields:
   - provider: 'greenhouse'
   - company: 'stripe'
   - jobsFetched: 245
   - jobsWritten: 245
   - status: 'success'
   ```

3. **`enrichmentMetrics`** - Enrichment metrics
   ```
   Fields:
   - jobId: 'ashby_12345'
   - skillsExtracted: 8
   - status: 'success'
   ```

4. **`jobs` collection** - Verify enrichment status
   ```javascript
   // Jobs should have:
   {
     ...
     enrichmentStatus: 'pending' | 'completed' | 'failed',
     enrichedAt: Timestamp | null
   }
   ```

### Step 5: Verify All ATS Sources Work

Check that you're now receiving jobs from ALL ATS sources, including Workday and Ashby:

```javascript
// In Firestore Console, run query:
// Collection: jobs
// Filter: ats == 'workday'
// Should return Nvidia jobs

// Filter: ats == 'ashby'  
// Should return Notion, Linear, Zapier, Replit, Ramp, Deel jobs
```

## Rollback Plan

If issues occur, you can quickly rollback:

### Option 1: Re-enable Legacy Function

```typescript
// functions/src/index.ts
export { fetchJobsFromATS } from './fetchJobs';  // Uncomment
```

```bash
firebase deploy --only functions:fetchJobsFromATS
```

### Option 2: Pause New Scheduler

Via Firebase Console → Functions → scheduleFetchJobs → Pause

The legacy function will continue running on its schedule.

## Monitoring & Debugging

### Cloud Functions Logs

```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only scheduleFetchJobs

# Real-time logs
firebase functions:log --tail
```

### Cloud Tasks Console

View task queues in GCP Console:
1. Go to https://console.cloud.google.com/cloudtasks
2. Select project: `jobzai-39f7e`
3. View queues:
   - `fetchJobsQueue` - Fetch tasks
   - `enrichSkillsQueue` - Enrichment tasks

### Firestore Metrics

Query metrics collections to see execution history:

```javascript
// Recent executions
db.collection('aggregatedFetchMetrics')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()

// Failed sources
db.collection('jobFetchMetrics')
  .where('status', '==', 'failed')
  .get()

// Enrichment success rate
db.collection('enrichmentMetrics')
  .where('status', '==', 'failed')
  .get()
```

## Configuration

### Adjust Concurrency

Edit `functions/src/config.ts`:

```typescript
export const QUEUE_CONFIG = {
  fetchJobs: {
    maxConcurrentDispatches: 10,  // Increase for more parallel workers
    maxRetries: 3,
  },
  enrichSkills: {
    maxConcurrentDispatches: 50,   // Increase for faster enrichment
    maxDispatchesPerSecond: 10,    // OpenAI rate limit
    maxRetries: 2,
  },
};
```

Redeploy after changes:

```bash
firebase deploy --only functions
```

### Adjust Batch Sizes

Edit `functions/src/config.ts`:

```typescript
export const BATCH_SIZES = {
  jobs: 500,                // Firestore write batch size
  enrichmentTasks: 100,     // Enrichment task creation batch size
};
```

## FAQ

### Q: Can I run both systems simultaneously?

Yes! They can run in parallel. The new system won't interfere with the old one.

### Q: What happens to jobs already in the database?

Nothing. New jobs are merged using `{ merge: true }`, so existing data is preserved.

### Q: How long does enrichment take?

With 50 concurrent workers at 10 req/sec, enriching 10,000 jobs takes ~20 minutes.

### Q: What if a source fails?

The worker automatically retries 3 times with exponential backoff. If still fails, it's logged in metrics and other sources continue.

### Q: How much does this cost?

Approximately:
- Cloud Functions: ~$2-3/day for 100k jobs
- Cloud Tasks: ~$0.10/day
- Firestore: ~$1-2/day
- **Total: ~$3-5/day**

### Q: Can I test locally?

Yes, but Cloud Tasks emulation is limited. Best to test fetch/enrichment logic separately:

```bash
cd functions
npm run test:workday   # Test Workday fetcher
npm run test:ashby     # Test Ashby fetcher
```

## Support

If you encounter issues:

1. Check Cloud Functions logs
2. Check Cloud Tasks queues
3. Check Firestore metrics collections
4. Review this guide
5. Rollback if needed (see Rollback Plan above)

---

**Migration Status:** ✅ Ready for Production

Last updated: 2025-11-21
