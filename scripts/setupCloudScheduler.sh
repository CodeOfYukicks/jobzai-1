#!/bin/bash

# Setup Cloud Scheduler for automated job fetching
# Run: bash scripts/setupCloudScheduler.sh

echo "🚀 Setting up Cloud Scheduler for JobzAI..."
echo ""

PROJECT_ID="jobzai"
REGION="us-central1"
FUNCTION_URL="https://us-central1-jobzai.cloudfunctions.net/autoFetchAndEnrichJobs"
SECRET="temp-dev-secret-123"

# Create the scheduler job
echo "📅 Creating Cloud Scheduler job..."
gcloud scheduler jobs create http jobzai-daily-auto-fetch \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --schedule="0 2 * * *" \
  --time-zone="UTC" \
  --uri="$FUNCTION_URL" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body="{\"secret\":\"$SECRET\"}" \
  --attempt-deadline="1800s" \
  --max-retry-attempts=2

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Cloud Scheduler created successfully!"
    echo ""
    echo "📊 Scheduler Details:"
    echo "   Name: jobzai-daily-auto-fetch"
    echo "   Schedule: Every day at 2:00 AM UTC"
    echo "   Function: autoFetchAndEnrichJobs"
    echo "   Timeout: 60 minutes"
    echo ""
    echo "🎯 What happens daily:"
    echo "   1. Fetches jobs from 98 companies"
    echo "   2. Cleans HTML descriptions"
    echo "   3. Enriches with v2.2 tags"
    echo "   4. Writes to Firestore"
    echo ""
    echo "📺 Monitor at:"
    echo "   https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
    echo ""
else
    echo ""
    echo "❌ Error creating scheduler. Try manually via Firebase Console:"
    echo "   https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
    echo ""
    echo "Manual setup:"
    echo "   Name: jobzai-daily-auto-fetch"
    echo "   Frequency: 0 2 * * *"
    echo "   Target type: HTTP"
    echo "   URL: $FUNCTION_URL"
    echo "   HTTP method: POST"
    echo "   Body: {\"secret\":\"$SECRET\"}"
fi

