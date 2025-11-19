# 🔧 Fix CORS for Firebase Storage - Manual Instructions

## The Issue
Your Firebase Storage bucket needs CORS configuration to allow downloads from localhost during development.

## Quick Fix (5 minutes)

### Option 1: Use Google Cloud Console (Recommended - No CLI needed)

1. **Go to Google Cloud Console**  
   👉 https://console.cloud.google.com/storage/browser?project=jobzai

2. **Find your bucket**  
   - You should see `jobzai.firebasestorage.app` in the list
   - Click on it to open

3. **Open CORS Configuration**  
   - Click the **"Permissions"** tab
   - Scroll down to **"CORS configuration"**
   - Click **"Edit CORS configuration"**

4. **Paste this configuration**:
   ```json
   [
     {
       "origin": ["http://localhost:5173", "http://localhost:5178", "https://jobzai.web.app", "https://jobzai.firebaseapp.com"],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
       "responseHeader": ["Content-Type", "Authorization", "Content-Length", "Access-Control-Allow-Origin"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

5. **Save**  
   - Click **"Save"**
   - Wait for confirmation

### Option 2: Use gsutil (If you have Google Cloud SDK installed)

```bash
gsutil cors set storage-cors.json gs://jobzai.firebasestorage.app
```

## Verify the Fix

1. Refresh your browser (http://localhost:5173)
2. Try clicking **"Use This CV"** again
3. Check the console - you should see:
   ```
   ✅ Got signed download URL
   ✅ CV downloaded successfully
   ```

## After Applying CORS

The CV download will work because:
- ✅ Firebase Storage will accept requests from `localhost:5173`
- ✅ Your authentication token proves you own the file
- ✅ No CORS errors!

## Need Help?

If you get permission errors accessing the Google Cloud Console:
1. Make sure you're logged in with the same Google account you use for Firebase
2. The account must have Owner or Editor role on the Firebase project
3. Or ask your Firebase project admin to apply this CORS configuration

---

**Note**: The CORS configuration file has already been created at `storage-cors.json` in your project root.

