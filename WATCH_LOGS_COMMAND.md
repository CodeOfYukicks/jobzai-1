# Watch Cloud Function Logs

Pour voir les logs en temps réel pendant votre test :

```bash
# Terminal 1 - Watch logs
firebase functions:log --only analyzeCVVision --lines 100

# Ou avec gcloud (meilleur)
gcloud functions logs read analyzeCVVision \
  --gen2 \
  --region=us-central1 \
  --limit=50 \
  --format="table(time, severity, text_payload)"
```

## Ce que vous devriez voir :

```
📊 Parsed analysis structure: { hasAnalysis: true, hasCVRewrite: true, ... }
💾 Preparing to save to Firestore: { 
  userId: "...",
  hasCVRewrite: true,
  cvTextLength: 5432,  // <-- Doit être > 0 !
  hasJobDescription: true,
  jobDescriptionLength: 1234
}
✅ Successfully saved to Firestore { 
  savedCVTextLength: 5432,
  savedCVRewrite: true 
}
```

Si `cvTextLength: 0` → Le prompt ne génère pas le cv_rewrite correctement.
Si `hasCVRewrite: false` → Le prompt ne retourne pas cv_rewrite.




