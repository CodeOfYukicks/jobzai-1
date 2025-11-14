# 🚀 Guide de déploiement Firebase en production

Ce guide vous explique comment déployer votre application JobZAI en production sur Firebase.

## 📋 Prérequis

1. **Firebase CLI installé** :
   ```bash
   npm install -g firebase-tools
   ```

2. **Connecté à Firebase** :
   ```bash
   firebase login
   ```

3. **Projet Firebase configuré** :
   - Votre projet est déjà configuré : `jobzai`
   - Vérifié dans `.firebaserc`

## 🔧 Étape 1 : Vérifier la configuration

### Vérifier le projet Firebase

```bash
firebase projects:list
firebase use jobzai
```

### Vérifier la configuration Firebase

Votre `firebase.json` est déjà configuré :
- ✅ Hosting : sert les fichiers depuis `dist/`
- ✅ Functions : configurées dans `functions/`
- ✅ Firestore : règles dans `firestore.rules`

## 🏗️ Étape 2 : Build de l'application

### Build du frontend

```bash
npm run build
```

Cette commande :
1. Compile TypeScript (`tsc`)
2. Build Vite (`vite build`)
3. Génère les fichiers dans `dist/`

### Build des Functions (automatique)

Les Functions seront buildées automatiquement lors du déploiement grâce à la configuration `predeploy` dans `firebase.json`.

## 🔐 Étape 3 : Configurer les variables d'environnement

### Option 1 : Via Firestore (Recommandé)

Les clés API sont stockées dans Firestore :

**Collection** : `settings`

**Documents** :
- `openai` → `apiKey` : Votre clé OpenAI
- `stripe` → `secretKey` : Votre clé secrète Stripe
- `stripe` → `webhookSecret` : Secret du webhook Stripe

### Option 2 : Via Firebase Functions Config

Pour les variables sensibles des Functions :

```bash
# Configurer les clés API
firebase functions:config:set openai.api_key="sk-..."
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Vérifier la configuration
firebase functions:config:get
```

## 🚀 Étape 4 : Déployer

### Déploiement complet (Hosting + Functions + Firestore Rules)

```bash
npm run deploy
```

Ou manuellement :

```bash
# Build du frontend
npm run build

# Déployer tout
firebase deploy
```

### Déploiement sélectif

**Uniquement le hosting (frontend)** :
```bash
npm run build
firebase deploy --only hosting
```

**Uniquement les Functions** :
```bash
cd functions
npm run build
firebase deploy --only functions
```

**Uniquement les règles Firestore** :
```bash
firebase deploy --only firestore:rules
```

**Déployer des Functions spécifiques** :
```bash
firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook
```

## 🌐 Étape 5 : Vérifier le déploiement

### URLs de production

Après le déploiement, votre application sera accessible à :

- **Frontend** : `https://jobzai.web.app` ou `https://jobzai.firebaseapp.com`
- **Custom domain** : Si vous avez configuré un domaine personnalisé

### Vérifier les Functions

Les Functions seront accessibles à :
- `https://us-central1-jobzai.cloudfunctions.net/[function-name]`

Exemples :
- `https://us-central1-jobzai.cloudfunctions.net/createCheckoutSession`
- `https://us-central1-jobzai.cloudfunctions.net/stripeWebhook`

## ✅ Checklist de déploiement

Avant de déployer en production, vérifiez :

- [ ] ✅ Build du frontend réussi (`npm run build`)
- [ ] ✅ Variables d'environnement configurées (Firestore ou Functions config)
- [ ] ✅ Règles Firestore testées
- [ ] ✅ Functions compilées sans erreurs
- [ ] ✅ Webhook Stripe configuré (si applicable)
- [ ] ✅ Domaines autorisés dans Firebase Console (Auth → Settings → Authorized domains)
- [ ] ✅ CORS configuré correctement pour les APIs

## 🔍 Vérification post-déploiement

### 1. Tester le frontend

```bash
# Ouvrir l'URL de production
open https://jobzai.web.app
```

### 2. Vérifier les logs des Functions

```bash
firebase functions:log
```

Ou dans la console Firebase :
- **Functions** → **Logs**

### 3. Tester les APIs

```bash
# Tester une Function
curl https://us-central1-jobzai.cloudfunctions.net/api/test
```

### 4. Vérifier Firestore

- Ouvrez la console Firebase
- Allez dans **Firestore Database**
- Vérifiez que les données sont accessibles

## 🛠️ Commandes utiles

### Voir l'état du déploiement

```bash
firebase hosting:channel:list
```

### Rollback (annuler le dernier déploiement)

```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

### Voir les versions déployées

```bash
firebase hosting:versions:list
```

### Déployer sur un canal de preview

```bash
firebase hosting:channel:deploy preview
```

## 🐛 Résolution de problèmes

### Erreur : "Build failed"

```bash
# Nettoyer et rebuilder
rm -rf dist node_modules/.vite
npm run build
```

### Erreur : "Functions deployment failed"

```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Erreur : "Permission denied"

```bash
# Vérifier que vous êtes connecté
firebase login
firebase use jobzai
```

### Erreur : "CORS error"

1. Vérifiez les domaines autorisés dans Firebase Console
2. Vérifiez la configuration CORS dans les Functions

### Erreur : "API key not found"

1. Vérifiez que les clés sont dans Firestore (`settings/openai`, `settings/stripe`)
2. Ou configurez via `firebase functions:config:set`

## 📝 Configuration d'un domaine personnalisé

### 1. Dans Firebase Console

1. Allez dans **Hosting**
2. Cliquez sur **Add custom domain**
3. Suivez les instructions pour ajouter votre domaine

### 2. Vérifier le DNS

Firebase vous donnera des enregistrements DNS à ajouter :
- Type A : Points vers les IPs Firebase
- Type CNAME : Points vers Firebase

### 3. Attendre la propagation DNS

Cela peut prendre jusqu'à 24-48h.

## 🔄 Workflow de déploiement recommandé

### Pour un déploiement en production

```bash
# 1. Vérifier que tout fonctionne en local
npm run build
npm run preview

# 2. Commit vos changements
git add .
git commit -m "Ready for production deployment"

# 3. Déployer
npm run deploy

# 4. Vérifier
firebase functions:log
```

### Pour un déploiement de test

```bash
# Déployer sur un canal de preview
firebase hosting:channel:deploy preview --expires 7d
```

## 📊 Monitoring

### Voir les métriques

- **Firebase Console** → **Hosting** → **Usage**
- **Firebase Console** → **Functions** → **Usage**

### Alertes

Configurez des alertes dans Firebase Console pour :
- Erreurs des Functions
- Quotas dépassés
- Performance

## 🆘 Support

En cas de problème :
1. Vérifiez les logs : `firebase functions:log`
2. Consultez la documentation Firebase
3. Vérifiez la console Firebase pour les erreurs

---

**Bon déploiement ! 🚀**





