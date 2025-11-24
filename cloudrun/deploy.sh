#!/bin/bash

# Deploy JobzAI Pipeline to Cloud Run
# Run: bash cloudrun/deploy.sh

set -e

PROJECT_ID="jobzai"
REGION="us-central1"
SERVICE_NAME="jobzai-auto-pipeline"

echo "🚀 Deploying JobzAI Pipeline to Cloud Run..."
echo ""

# Build and deploy
cd /Users/rouchditouil/jobzai-1-7

gcloud run deploy $SERVICE_NAME \
  --source=. \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --timeout=3600 \
  --memory=4Gi \
  --cpu=2 \
  --max-instances=1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=jobzai"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Cloud Run service deployed successfully!"
    echo ""
    
    # Get the URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --project=$PROJECT_ID --format='value(status.url)')
    
    echo "📊 Service Details:"
    echo "   Name: $SERVICE_NAME"
    echo "   URL: $SERVICE_URL"
    echo "   Timeout: 60 minutes"
    echo "   Memory: 4Gi"
    echo ""
    
    echo "🔧 Now updating Cloud Scheduler..."
    
    # Update existing scheduler to point to Cloud Run
    gcloud scheduler jobs update http jobzai-daily-auto-fetch \
      --project=$PROJECT_ID \
      --location=$REGION \
      --uri="$SERVICE_URL" \
      --http-method=POST \
      --headers="Content-Type=application/json"
    
    echo ""
    echo "✅ Cloud Scheduler updated!"
    echo ""
    echo "🎯 Test manually:"
    echo "   curl -X POST $SERVICE_URL"
    echo ""
    echo "📺 Monitor:"
    echo "   gcloud run services logs read $SERVICE_NAME --project=$PROJECT_ID --region=$REGION"
    echo ""
    echo "🎉 DONE! System is now fully automated via Firebase!"
    
else
    echo ""
    echo "❌ Deployment failed"
    exit 1
fi

