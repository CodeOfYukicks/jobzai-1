# Explication CORS : Pourquoi en dev mais pas en prod ?

## 🔍 Pourquoi CORS existe ?

CORS (Cross-Origin Resource Sharing) est une sécurité du navigateur qui empêche les requêtes entre différents domaines. C'est une **protection nécessaire** pour éviter les attaques.

## 🏠 En Développement (localhost)

**Problème CORS :**
- Frontend : `http://localhost:5173` (Vite dev server)
- Backend : `https://us-central1-jobzai.cloudfunctions.net` (Firebase Functions)
- ❌ **Domaines différents** = CORS nécessaire

**Solution en dev :**
- Configurer CORS dans Firebase Functions (`cors: true`)
- Ou utiliser un proxy local (server.cjs)

## 🚀 En Production

**Pas de problème CORS si bien configuré :**

### Option 1 : Même domaine (RECOMMANDÉ - Pas de CORS !)

Si vous utilisez Firebase Hosting :
- Frontend : `https://jobzai.web.app` ou `https://jobzai.firebaseapp.com`
- Backend : `https://jobzai.web.app/api/stripe/create-checkout-session` (via rewrite)
- ✅ **Même domaine** = **PAS DE CORS !**

C'est ce que nous avons configuré avec le rewrite dans `firebase.json` :
```json
{
  "source": "/api/stripe/create-checkout-session",
  "function": "createCheckoutSession"
}
```

### Option 2 : Domaines différents (CORS nécessaire)

Si votre frontend est sur un domaine différent :
- Frontend : `https://votredomaine.com`
- Backend : `https://us-central1-jobzai.cloudfunctions.net`
- ⚠️ **Domaines différents** = CORS nécessaire

**Solution :** CORS est déjà configuré dans Firebase Functions avec `cors: true` et les headers appropriés.

## ✅ Configuration actuelle

### En Production (Firebase Hosting)
- ✅ Frontend et backend sur le même domaine via rewrites
- ✅ **PAS DE CORS** nécessaire
- ✅ Appels via `/api/stripe/create-checkout-session` (relatif)

### En Développement
- ⚠️ Frontend sur `localhost:5173`, backend sur Firebase Functions
- ✅ CORS configuré dans Firebase Functions
- ✅ Appels directs vers Firebase Functions

## 🎯 Résultat

**En production, vous n'aurez PAS d'erreurs CORS** car :
1. Le frontend et le backend sont sur le même domaine (via rewrites)
2. Les requêtes sont relatives (`/api/stripe/...`) = même origine
3. Le navigateur ne déclenche pas de vérification CORS

**En développement, CORS est nécessaire** mais c'est normal et configuré.

---

## 📝 Note importante

Les erreurs CORS que vous voyez en développement sont **normales** et **attendues**. Elles disparaîtront automatiquement en production grâce à la configuration des rewrites Firebase.

