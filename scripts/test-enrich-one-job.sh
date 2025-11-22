#!/bin/bash

# Simple script to enrich a specific job by ID

JOB_ID="$1"

if [ -z "$JOB_ID" ]; then
  echo "❌ Usage: ./test-enrich-one-job.sh JOB_ID"
  echo ""
  echo "Example: ./test-enrich-one-job.sh abc123xyz"
  echo ""
  echo "To find a job ID:"
  echo "Go to https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs"
  exit 1
fi

echo "🧪 Testing Job Enrichment"
echo "=========================="
echo ""
echo "📝 Job ID: $JOB_ID"
echo ""
echo "🚀 Calling enrichSingleJob Cloud Function..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST https://us-central1-jobzai-39f7e.cloudfunctions.net/enrichSingleJob \
  -H "Content-Type: application/json" \
  -d "{\"jobId\": \"$JOB_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Success! Job enriched successfully!"
  echo ""
  echo "🔍 Check the result in Firestore:"
  echo "https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs/$JOB_ID"
  echo ""
  echo "Look for these new fields:"
  echo "  ✓ employmentTypes: ['full-time', ...]"
  echo "  ✓ workLocations: ['remote', 'on-site', ...]"
  echo "  ✓ experienceLevels: ['senior', 'mid', ...]"
  echo "  ✓ industries: ['tech', 'finance', ...]"
  echo "  ✓ technologies: ['react', 'python', 'aws', ...]"
  echo "  ✓ skills: ['agile', 'seo', ...]"
  echo "  ✓ enrichedAt: timestamp"
  echo "  ✓ enrichedVersion: '2.0'"
else
  echo "❌ Error: HTTP $HTTP_CODE"
  echo ""
  echo "Troubleshooting:"
  echo "- Check if the job ID exists in Firestore"
  echo "- Check Cloud Function logs: https://console.firebase.google.com/project/jobzai-39f7e/functions/logs"
fi
