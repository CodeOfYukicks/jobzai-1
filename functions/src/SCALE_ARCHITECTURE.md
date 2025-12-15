# 🚀 Scalable ATS Job Fetching Architecture

## Overview

This document describes the new scalable architecture for fetching jobs from multiple ATS providers. The system is designed to handle **100,000+ jobs** from **500+ companies**.

## Architecture Components

### 1. Company Lists (`data/companyLists.ts`)

Centralized list of all companies organized by ATS provider:
- **Greenhouse**: 400+ companies (FAANG, unicorns, AI companies)
- **Lever**: 100+ companies
- **SmartRecruiters**: 150+ companies (French unicorns, EU tech)
- **Ashby**: 150+ companies (YC startups, dev tools)
- **Workday**: 50+ companies (Fortune 500, Big Tech)

### 2. Queue System (`queue/`)

Distributed task processing with automatic retry:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  createFetchTasks  │────▶│  fetchTasks      │────▶│ processFetchTask │
│  (Scheduler)       │     │  (Firestore)     │     │  (Worker)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
   Creates 500+            Stores pending           Processes each
   tasks every 6h          tasks with retry         company in parallel
```

**Key Features:**
- Automatic retry with exponential backoff (max 3 retries)
- Per-task timeout (540s)
- Real-time status tracking
- Metrics collection

### 3. Dynamic Batch Processor (`dynamicBatchProcessor.ts`)

Single HTTP endpoint that processes all companies dynamically:

```bash
# Fetch all companies
curl -X POST https://us-central1-jobzai.cloudfunctions.net/processDynamicBatch

# Fetch specific providers
curl -X POST https://us-central1-jobzai.cloudfunctions.net/processDynamicBatch \
  -H "Content-Type: application/json" \
  -d '{"providers": ["greenhouse", "ashby"]}'
```

### 4. ATS Fetchers (`utils/atsFetchers.ts`)

Provider-specific fetchers with optimized rate limiting:

| Provider | Rate Limit | Jobs/Company |
|----------|-----------|--------------|
| Greenhouse | None | ~50-500 |
| Lever | None | ~20-100 |
| SmartRecruiters | 1 req/s | ~50-200 |
| Ashby | None | ~20-200 |
| Workday | Exponential backoff | ~100-5000 |

### 5. Job Aggregators (`aggregators/`)

External job aggregator APIs:

| Source | Jobs | Frequency |
|--------|------|-----------|
| RemoteOK | ~2,000 | Every 12h |
| WeWorkRemotely | ~1,000 | Every 12h |
| Adzuna | ~5,000 | Every 12h (needs API key) |

### 6. Company Discovery (`discovery/`)

Automatic discovery of new companies:

- Weekly scan of known patterns
- Stores discovered companies in `discoveredCompanies` collection
- Manual activation via API

### 7. Maintenance (`maintenance/`)

Database cleanup and monitoring:

- Daily cleanup of old jobs (90 days TTL)
- Task cleanup (7 days for completed, 30 days for failed)
- Database statistics endpoint

## Cloud Functions

### Scheduled Functions

| Function | Schedule | Description |
|----------|----------|-------------|
| `createFetchTasks` | Every 6 hours | Creates fetch tasks for all companies |
| `fetchFromAggregators` | Every 12 hours | Fetches from RemoteOK, WWR, Adzuna |
| `scheduledDiscovery` | Weekly (Monday) | Discovers new companies |
| `scheduledCleanup` | Daily (3 AM) | Cleans old jobs and tasks |

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/processDynamicBatch` | POST | Fetch all companies (or filtered) |
| `/createFetchTasksManual` | POST | Manually create fetch tasks |
| `/processTaskManual` | POST | Process a single company |
| `/getQueueStatus` | GET | Get queue status |
| `/retryFailedTasks` | POST | Retry all failed tasks |
| `/manualCleanup` | POST | Run cleanup manually |
| `/getDatabaseStats` | GET | Get database statistics |
| `/manualDiscovery` | POST | Run company discovery |
| `/getDiscoveredCompanies` | GET | List discovered companies |
| `/fetchAggregatorsManual` | POST | Fetch from aggregators |

## Firestore Collections

### Main Collections

| Collection | Description | TTL |
|------------|-------------|-----|
| `jobs` | All job postings | 90 days |
| `fetchTasks` | Individual fetch tasks | 7-30 days |
| `fetchExecutions` | Batch execution records | 30 days |
| `discoveredCompanies` | Discovered company slugs | None |

### Metrics Collections

| Collection | Description |
|------------|-------------|
| `fetchMetrics` | Per-execution metrics |
| `aggregatorMetrics` | Aggregator fetch metrics |
| `cleanupMetrics` | Cleanup execution metrics |
| `discoveryMetrics` | Discovery execution metrics |

## Estimated Job Counts

| Source | Companies | Jobs/Company | Total Jobs |
|--------|-----------|--------------|------------|
| Greenhouse | 400 | 75 avg | ~30,000 |
| Lever | 100 | 50 avg | ~5,000 |
| SmartRecruiters | 150 | 100 avg | ~15,000 |
| Ashby | 150 | 50 avg | ~7,500 |
| Workday | 50 | 500 avg | ~25,000 |
| RemoteOK | - | - | ~2,000 |
| WeWorkRemotely | - | - | ~1,000 |
| **Total** | **850+** | - | **~85,500** |

With Adzuna API: **100,000+** jobs

## Migration Guide

### From Legacy Batches

The old `fetchJobsBatch1-4.ts` files are deprecated. Use:

```typescript
// Instead of calling individual batches
// Call the dynamic processor
await processDynamicBatch({ providers: ['greenhouse'] });
```

### From fetchJobsFromATS

The legacy CRON function is deprecated. The new queue system provides:
- Per-company retry
- Better error handling
- Real-time status
- No global timeout risk

## Monitoring

### Queue Health

```bash
curl https://us-central1-jobzai.cloudfunctions.net/getQueueStatus
```

### Database Stats

```bash
curl https://us-central1-jobzai.cloudfunctions.net/getDatabaseStats
```

### Retry Failed Tasks

```bash
curl -X POST https://us-central1-jobzai.cloudfunctions.net/retryFailedTasks
```

## Cost Estimation

| Resource | Usage | Cost |
|----------|-------|------|
| Cloud Functions | ~1M invocations/month | ~$0.40 |
| Firestore reads | ~10M reads/month | ~$3.60 |
| Firestore writes | ~500K writes/month | ~$0.90 |
| **Total** | | **~$5/month** |

## Future Improvements

1. **More Aggregators**: Indeed, LinkedIn (requires partnerships)
2. **AI Enrichment**: GPT-based skill extraction
3. **Real-time Updates**: Webhook subscriptions for ATS updates
4. **Geographic Expansion**: Region-specific aggregators









