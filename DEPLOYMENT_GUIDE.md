# Deployment Guide: Queue-Based ATS Architecture

## 🚀 Quick Deploy

```bash
# 1. Build functions
cd functions
npm run build

# 2. Deploy new functions
firebase deploy --only functions:scheduleFetchJobs,functions:fetchJobsWorker,functions:enrichSkillsWorker

# 3. Monitor logs
firebase functions:log --only scheduleFetchJobs --tail
```

## 📋 Pre-Deployment Checklist

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Firebase project is correct (`firebase use`)
- [ ] API keys are configured in Firestore (`settings/openai`)
- [ ] ATS sources are configured in `functions/src/config.ts`
- [ ] You understand the new architecture (see MIGRATION_GUIDE.md)

## 🛠️ Full Deployment Steps

### Step 1: Verify Project

```bash
# Check which Firebase project you're using
firebase use

# Should show: jobzai-39f7e (or your project ID)
```

If needed, switch project:

```bash
firebase use jobzai-39f7e
```

### Step 2: Build Functions

```bash
cd functions
npm install  # Install dependencies if needed
npm run build
```

Expected output:

```
✓ Compiled successfully
```

If errors occur, fix them before continuing.

### Step 3: Deploy Functions

Deploy only the new functions (don't touch legacy):

```bash
firebase deploy --only \
  functions:scheduleFetchJobs,\
  functions:fetchJobsWorker,\
  functions:enrichSkillsWorker
```

Expected output:

```
✔ functions[scheduleFetchJobs] Successful create operation.
✔ functions[fetchJobsWorker] Successful create operation.
✔ functions[enrichSkillsWorker] Successful create operation.
```

### Step 4: Verify Deployment

List deployed functions:

```bash
firebase functions:list | grep -E "(scheduleFetchJobs|fetchJobsWorker|enrichSkillsWorker)"
```

You should see all three functions listed.

### Step 5: Configure Scheduler (Optional)

The scheduler is configured to run daily at 2 AM UTC. To change:

1. Go to Firebase Console → Functions
2. Find `scheduleFetchJobs`
3. Click "Edit" → "Trigger"
4. Modify schedule (e.g., `every 6 hours`, `every day 06:00`)

### Step 6: Test Manually (Optional)

Trigger the scheduler manually to test:

```bash
# Via gcloud CLI
gcloud scheduler jobs run scheduleFetchJobs \
  --location=us-central1

# OR via Firebase Console:
# Functions → scheduleFetchJobs → Test function
```

### Step 7: Monitor Execution

Watch logs in real-time:

```bash
# All new functions
firebase functions:log --tail

# Specific function
firebase functions:log --only scheduleFetchJobs --tail
```

You should see:

```
[SCHEDULER] Starting execution exec_1700000000000
[SCHEDULER] Sources to process: 13
[SCHEDULER] Created task 1/13: greenhouse/stripe
[SCHEDULER] Created task 2/13: greenhouse/datadog
...
[SCHEDULER] ✅ Successfully created 13 tasks
```

Then workers will start processing:

```
[WORKER] Starting: greenhouse_stripe
[WORKER] Fetching from greenhouse...
[WORKER] Fetched 245 jobs from greenhouse_stripe
[WORKER] Writing 245 jobs to Firestore...
[WORKER] ✅ Completed greenhouse_stripe in 12500ms
```

### Step 8: Verify Data in Firestore

Open Firebase Console → Firestore Database:

1. **Check `aggregatedFetchMetrics` collection**
   - You should see a document with ID like `exec_1700000000000`
   - Fields: `totalSources`, `sourcesCompleted`, `status`

2. **Check `jobFetchMetrics` collection**
   - You should see documents per source: `exec_<timestamp>_<provider>_<company>`
   - Fields: `jobsFetched`, `jobsWritten`, `status`

3. **Check `jobs` collection**
   - Jobs should now have `enrichmentStatus` field (`'pending'`, `'completed'`, or `'failed'`)
   - Jobs from Workday and Ashby should be present

4. **Check `enrichmentMetrics` collection** (after a few minutes)
   - Documents showing enrichment results
   - Fields: `skillsExtracted`, `status`

## 🔍 Troubleshooting

### Issue: Functions not deploying

**Symptoms:**
```
Error: HTTP Error: 400, Invalid resource state for update
```

**Solution:**
Delete functions and redeploy:

```bash
# Delete old functions first
firebase functions:delete scheduleFetchJobs
firebase functions:delete fetchJobsWorker
firebase functions:delete enrichSkillsWorker

# Redeploy
firebase deploy --only functions:scheduleFetchJobs,functions:fetchJobsWorker,functions:enrichSkillsWorker
```

### Issue: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module './utils/batchWriter'
```

**Solution:**
Make sure all new files were created:

```bash
ls -la functions/src/utils/batchWriter.ts
ls -la functions/src/utils/metricsLogger.ts
ls -la functions/src/schedulers/fetchJobsScheduler.ts
ls -la functions/src/workers/fetchJobsWorker.ts
ls -la functions/src/workers/enrichSkillsWorker.ts
```

### Issue: Cloud Tasks not appearing

**Symptoms:**
Logs show tasks created but nothing happens.

**Solution:**
1. Go to GCP Console → Cloud Tasks
2. Check if queues exist:
   - `fetchJobsQueue`
   - `enrichSkillsQueue`
3. If queues don't exist, they'll be created automatically on first use
4. Wait a few minutes and check again

### Issue: Workers timing out

**Symptoms:**
```
Function execution took 541000 ms, finished with status: 'timeout'
```

**Solution:**
1. Check which source is timing out in logs
2. Increase timeout for that specific case (currently 540s)
3. Or optimize the fetcher for that ATS

### Issue: OpenAI API errors

**Symptoms:**
```
[ENRICH] ❌ Failed to enrich: OpenAI API key not found
```

**Solution:**
1. Verify API key is in Firestore:
   ```bash
   # Check Firestore document
   # Collection: settings
   # Document: openai
   # Field: apiKey
   ```

2. Or set via environment:
   ```bash
   firebase functions:config:set openai.api_key="sk-..."
   firebase deploy --only functions
   ```

## 📊 Monitoring

### Real-Time Logs

```bash
# All functions
firebase functions:log --tail

# Filter by function
firebase functions:log --only fetchJobsWorker --tail

# Filter by severity
firebase functions:log --min-log-level error
```

### Cloud Tasks Queue

View queues and tasks:

1. GCP Console → Cloud Tasks
2. Select project: `jobzai-39f7e`
3. View queues:
   - `fetchJobsQueue` - Currently processing fetch tasks
   - `enrichSkillsQueue` - Currently processing enrichments

### Metrics Dashboard

View function metrics:

1. Firebase Console → Functions
2. Select function
3. View:
   - Invocations
   - Memory usage
   - Execution time
   - Error rate

## 🔄 Rollback

If you need to rollback:

### Option 1: Redeploy Previous Version

```bash
# Checkout previous commit
git checkout <previous-commit-sha>

# Redeploy
cd functions
npm run build
firebase deploy --only functions

# Return to latest
git checkout main
```

### Option 2: Delete New Functions

```bash
# Delete new functions
firebase functions:delete scheduleFetchJobs
firebase functions:delete fetchJobsWorker
firebase functions:delete enrichSkillsWorker

# Legacy function continues to run
```

### Option 3: Pause Scheduler

Via Firebase Console:

1. Functions → scheduleFetchJobs
2. Trigger → Pause

Legacy function continues on its schedule.

## ⚙️ Configuration

### Adjust Worker Concurrency

Edit `functions/src/config.ts`:

```typescript
export const QUEUE_CONFIG = {
  fetchJobs: {
    maxConcurrentDispatches: 20,  // Increase to 20 workers
    // ...
  },
  enrichSkills: {
    maxConcurrentDispatches: 100, // Increase to 100 workers
    // ...
  },
};
```

Redeploy:

```bash
cd functions
npm run build
firebase deploy --only functions:fetchJobsWorker,functions:enrichSkillsWorker
```

### Change Scheduler Frequency

Edit `functions/src/schedulers/fetchJobsScheduler.ts`:

```typescript
export const scheduleFetchJobs = onSchedule({
  schedule: 'every 6 hours',  // Instead of 'every day 02:00'
  // ...
});
```

Redeploy:

```bash
firebase deploy --only functions:scheduleFetchJobs
```

### Add New ATS Sources

Edit `functions/src/config.ts`:

```typescript
export const ATS_SOURCES: ATSProviderConfig[] = [
  // ... existing sources
  
  // Add new source
  { provider: 'greenhouse', company: 'new-company' },
];
```

Redeploy scheduler and workers:

```bash
cd functions
npm run build
firebase deploy --only functions:scheduleFetchJobs,functions:fetchJobsWorker
```

## 📈 Performance Expectations

With the new architecture:

| Metric | Value |
|--------|-------|
| **Sources processed** | All 13 in parallel (10 at a time) |
| **Time to fetch all** | ~5-10 minutes (instead of 9+ min timeout) |
| **Jobs/second** | ~50-100 (with batched writes) |
| **Enrichment rate** | ~500-600 jobs/min (50 workers @ 10/sec) |
| **10k jobs enrichment** | ~15-20 minutes |
| **100k jobs enrichment** | ~2.5-3 hours |
| **Memory usage** | ~500MB-1GB per worker (instead of 1GB+ for all) |
| **Cost** | ~$3-5/day for 100k jobs |

## ✅ Success Criteria

After deployment, verify:

- [ ] All 13 ATS sources processed successfully
- [ ] Jobs from Workday (Nvidia) are in Firestore
- [ ] Jobs from Ashby (Notion, Linear, etc.) are in Firestore
- [ ] Jobs have `enrichmentStatus` field
- [ ] Enrichment is happening (check `enrichmentMetrics`)
- [ ] No timeout errors in logs
- [ ] Memory usage is stable
- [ ] Zero failed sources (check `jobFetchMetrics`)

## 📞 Support

If issues persist:

1. Check logs: `firebase functions:log`
2. Review MIGRATION_GUIDE.md
3. Check Firestore metrics collections
4. Review this deployment guide

---

**Last updated:** 2025-11-21  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
