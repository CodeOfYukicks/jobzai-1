#!/bin/bash

echo "🔍 Finding a job to enrich..."
echo ""

# Get the first job from Firestore using the Firebase CLI
# This uses the REST API to query Firestore
PROJECT_ID="jobzai-39f7e"

# Get auth token
echo "Getting Firebase auth token..."
TOKEN=$(firebase login:ci --no-localhost 2>&1 | grep -o '1//[^ ]*' || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ Could not get auth token. Using project default credentials..."
  echo ""
  echo "Let's try a different approach - querying via Firebase Admin..."
  
  # Create a simple Node.js script to get a job ID
  cat > /tmp/get-job-id.js << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.collection('jobs')
  .orderBy('postedAt', 'desc')
  .limit(1)
  .get()
  .then(snapshot => {
    if (snapshot.empty) {
      console.log('NO_JOBS_FOUND');
      process.exit(1);
    }
    
    const job = snapshot.docs[0];
    console.log('JOB_ID:' + job.id);
    console.log('Title:', job.data().title);
    console.log('Company:', job.data().company);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
EOF

  cd /Users/rouchditouil/jobzai-1-6/functions
  node /tmp/get-job-id.js
  exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo ""
    echo "❌ Could not fetch job automatically."
    echo ""
    echo "📋 Manual steps:"
    echo "1. Go to: https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs"
    echo "2. Click on any job document"
    echo "3. Copy the document ID"
    echo "4. Run this command:"
    echo ""
    echo "   ./scripts/test-enrich-one-job.sh YOUR_JOB_ID"
    echo ""
    exit 1
  fi
fi
