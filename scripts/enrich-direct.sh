#!/bin/bash

# Simple script to enrich one or all jobs using Firebase Functions emulator locally
# This runs the enrichment in the functions emulator environment

echo "🚀 Job Enrichment - Direct Firestore Access"
echo "==========================================="
echo ""

JOB_ID="$1"

if [ -z "$JOB_ID" ] || [ "$ JOB_ID" = "test" ]; then
  echo "🧪 Test Mode: Enriching first 10 jobs..."
  echo ""
  
  # Use the enrichJobsManual function with small batch
  echo "Calling enrichJobsManual Cloud Function (deployed)..."
  curl -X POST "https://us-central1-jobzai-39f7e.cloudfunctions.net/enrichJobsManual" \
    -H "Content-Type: application/json" \
    -d '{"secret": "temp-dev-secret-123", "batchSize": 10}' \
    2>&1
    
  echo ""
  echo ""
  echo "✅ Check Firestore Console to see the results:"
  echo "https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs"
else
  echo "📝 Enriching specific job: $JOB_ID"
  echo ""
  
  curl -X POST "https://us-central1-jobzai-39f7e.cloudfunctions.net/enrichSingleJob" \
    -H "Content-Type: application/json" \
    -d "{\"jobId\": \"$JOB_ID\"}" \
    2>&1
    
  echo ""
  echo ""
  echo "✅ Check this job in Firestore:"
  echo "https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs/$JOB_ID"
fi

echo ""
echo "Look for these new fields:"
echo "  • employmentTypes: ['full-time', ...]"
echo "  • workLocations: ['remote', ...]"
echo "  • experienceLevels: ['senior', ...]"
echo "  • industries: ['tech', 'finance', ...]"
echo "  • technologies: ['react', 'python', 'aws', ...]"
echo "  • skills: ['agile', ...]"
echo "  • enrichedAt: timestamp"
echo "  • enrichedVersion: '2.0'"
