# 🔧 Fix CORS Error pour analyzeCVPremium

## ❌ Erreur Actuelle

```
Access to fetch at 'https://us-central1-jobzai-bcfa5.cloudfunctions.net/analyzeCVPremium' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solution Appliquée

J'ai amélioré la configuration CORS dans `functions/src/index.ts`:

1. ✅ Headers CORS définis **AVANT** toute autre opération
2. ✅ Gestion explicite de la requête OPTIONS preflight
3. ✅ Headers complets (Origin, Methods, Headers, Max-Age, Credentials)

## 🚀 Déployer le Fix

```bash
cd functions
npm run build
firebase deploy --only functions:analyzeCVPremium
```

**Important:** Attendez 1-2 minutes après le déploiement pour que les changements prennent effet.

## 🔍 Vérifier le Fix

### 1. Testez avec curl (depuis votre terminal)

```bash
curl -X OPTIONS \
  https://us-central1-jobzai-bcfa5.cloudfunctions.net/analyzeCVPremium \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Résultat attendu:**
```
< HTTP/2 204
< access-control-allow-origin: http://localhost:5173
< access-control-allow-methods: POST, OPTIONS, GET
< access-control-allow-headers: Content-Type, Authorization, X-Requested-With
```

### 2. Testez dans votre app

1. Rechargez la page (Cmd+Shift+R ou Ctrl+Shift+R)
2. Cliquez sur "New Analysis"
3. Uploadez un CV
4. Cliquez sur "Analyze Resume"

**Résultat attendu:**
- ✅ Pas d'erreur CORS dans la console
- ✅ Requête POST réussie
- ✅ Analyse en cours...

## 🐛 Si l'Erreur Persiste

### Option A: Vérifier les Logs Firebase

```bash
firebase functions:log --only analyzeCVPremium
```

Cherchez:
```
✅ Handling OPTIONS preflight request from origin: http://localhost:5173
```

### Option B: Vérifier la Configuration Firebase

Assurez-vous que dans `firebase.json` vous avez:

```json
{
  "functions": {
    "source": "functions"
  }
}
```

### Option C: Utiliser un Proxy Local (Solution Temporaire)

Si le problème persiste, vous pouvez créer un proxy dans `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api/analyze-cv-premium': {
        target: 'https://us-central1-jobzai-bcfa5.cloudfunctions.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

Puis modifiez `src/lib/premiumATSAnalysis.ts`:

```typescript
const functionUrl = 
  import.meta.env.DEV
    ? '/api/analyze-cv-premium'  // Use proxy in dev
    : 'https://us-central1-jobzai-bcfa5.cloudfunctions.net/analyzeCVPremium';
```

## 📊 Vérification des Headers

Dans les DevTools → Network → Headers, vous devriez voir:

**Request Headers:**
```
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

**Response Headers (OPTIONS):**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: POST, OPTIONS, GET
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 3600
```

**Response Headers (POST):**
```
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json
```

## ✅ Checklist

- [ ] Fonction redéployée avec le fix CORS
- [ ] Test OPTIONS avec curl réussi
- [ ] Pas d'erreur CORS dans la console
- [ ] Requête POST réussie
- [ ] Analyse complète fonctionne

---

**Après le déploiement, testez immédiatement!** 🚀

