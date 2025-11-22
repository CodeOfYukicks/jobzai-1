#!/bin/bash

# Script to test job enrichment on a single job

echo "🧪 Testing Job Enrichment"
echo "=========================="
echo ""

# You'll need to replace JOB_ID with a real ID from Firestore
JOB_ID="YOUR_JOB_ID_HERE"

if [ "$JOB_ID" = "YOUR_JOB_ID_HERE" ]; then
  echo "❌ Error: Please replace JOB_ID with a real job ID from Firestore"
  echo ""
  echo "To find a job ID:"
  echo "1. Go to https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs"
  echo "2. Click on any job document"
  echo "3. Copy the document ID"
  echo "4. Replace JOB_ID in this script"
  exit 1
fi

echo "📝 Job ID: $JOB_ID"
echo ""
echo "🚀 Calling enrichSingleJob Cloud Function..."
echo ""

curl -X POST https://us-central1-jobzai-39f7e.cloudfunctions.net/enrichSingleJob \
  -H "Content-Type: application/json" \
  -d "{\"jobId\": \"$JOB_ID\"}" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Done! Check the result in Firestore:"
echo "https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs/$JOB_ID"
echo ""
echo "Look for these new fields:"
echo "  - employmentTypes: ['full-time']"
echo "  - workLocations: ['remote']"
echo "  - experienceLevels: ['senior']"
echo "  - industries: ['tech', ...]"
echo "  - technologies: ['react', 'python', ...]"
echo "  - skills: ['agile', ...]"
echo "  - enrichedAt: timestamp"
echo "  - enrichedVersion: '2.0'"
