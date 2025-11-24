#!/bin/bash

# 🚀 Daily Job Update - Complete Pipeline
# Automatisable via cron ou GitHub Actions
# Run: bash scripts/dailyJobUpdate.sh

cd /Users/rouchditouil/jobzai-1-7

echo "🚀 JobzAI Daily Job Update"
echo "=========================="
echo ""

# Step 1: Trigger workers
echo "📋 Step 1/3: Creating worker tasks..."
node scripts/triggerWorkerSystem.cjs
echo ""

# Small delay
sleep 3

# Step 2: Process tasks
echo "🔄 Step 2/3: Fetching jobs from 98 companies..."
node scripts/processTasksManually.cjs
echo ""

# Step 3: Enrich
echo "✨ Step 3/3: Enriching with v2.2 tags..."
node scripts/reEnrichAllJobs.cjs
echo ""

echo "=========================="
echo "✅ Daily update complete!"
echo "=========================="

