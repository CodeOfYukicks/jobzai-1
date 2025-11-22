#!/bin/bash

# Enrich jobs using gcloud CLI directly
# This bypasses HTTP/HTTPS issues and uses authenticated gcloud session

PROJECT_ID="jobzai"
BATCH_SIZE="${1:-10}"  # Default to 10 jobs for testing

echo "🚀 Enriching Jobs via gcloud"
echo "============================="
echo ""
echo "📦 Batch size: $BATCH_SIZE jobs"
echo ""

# Prepare the request data
REQUEST_DATA=$(cat <<EOF
{
  "secret": "temp-dev-secret-123",
  "batchSize": $BATCH_SIZE
}
EOF
)

echo "Calling enrichJobsManual function..."
echo ""

# Call the function using gcloud
gcloud functions call enrichJobsManual \
  --project="$PROJECT_ID" \
  --region=us-central1 \
  --gen2 \
  --data="$REQUEST_DATA"

EXIT_CODE=$?

echo ""
echo "================================"

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Enrichment complete!"
  echo ""
  echo "🔍 Check Firestore to see the new fields:"
  echo "https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs"
  echo ""
  echo "Look for:"
  echo "  • industries: ['tech', 'finance', ...]"
  echo "  • technologies: ['react', 'python', 'aws', ...]"
  echo "  • skills: ['agile', 'seo', ...]"
  echo "  • enrichedVersion: '2.0'"
else
  echo "❌ Error calling function (exit code: $EXIT_CODE)"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check if you're logged in: gcloud auth list"
  echo "2. Check function logs:"
  echo "   gcloud functions logs read enrichJobsManual --project=$PROJECT_ID --region=us-central1 --gen2 --limit=50"
fi
