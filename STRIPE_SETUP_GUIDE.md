# Guide de Configuration Stripe pour JobzAI

Ce guide vous accompagne étape par étape pour intégrer Stripe dans votre application JobzAI.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration du compte Stripe](#configuration-du-compte-stripe)
3. [Configuration des clés API](#configuration-des-clés-api)
4. [Configuration du Webhook](#configuration-du-webhook)
5. [Déploiement](#déploiement)
6. [Test de l'intégration](#test-de-lintégration)
7. [Dépannage](#dépannage)

---

## 🔧 Prérequis

- Un compte Stripe (créer un compte sur [stripe.com](https://stripe.com))
- Firebase Functions déployées
- Accès à Firestore pour stocker les clés API
- Accès à la console Firebase

---

## 🎯 Configuration du compte Stripe

### 1. Créer un compte Stripe

1. Allez sur [stripe.com](https://stripe.com) et créez un compte
2. Complétez la configuration de votre compte (informations bancaires, etc.)
3. Activez votre compte (vérification d'identité si nécessaire)

### 2. Accéder au Dashboard Stripe

1. Connectez-vous à votre compte Stripe
2. Accédez au [Dashboard Stripe](https://dashboard.stripe.com)

### 3. Mode Test vs Production

Stripe propose deux environnements :
- **Mode Test** : Pour tester sans frais réels (cartes de test)
- **Mode Production** : Pour les paiements réels

**Pour commencer, utilisez le mode Test.**

---

## 🔑 Configuration des clés API

### Option 1 : Via Firestore (Recommandé)

1. **Récupérer vos clés API Stripe**
   - Dans le Dashboard Stripe, allez dans **Developers** → **API keys**
   - Copiez votre **Secret key** (commence par `sk_test_` en mode test ou `sk_live_` en production)

2. **Stocker la clé dans Firestore**
   - Ouvrez la console Firebase
   - Allez dans **Firestore Database**
   - Créez une collection `settings` si elle n'existe pas
   - Créez un document `stripe` dans la collection `settings`
   - Ajoutez un champ `secretKey` avec votre clé secrète Stripe

   Structure Firestore :
   ```
   settings/
     └── stripe/
         ├── secretKey: "sk_test_..."
         └── webhookSecret: "whsec_..." (à configurer plus tard)
   ```

### Option 2 : Via Variables d'environnement

1. **Pour Firebase Functions** :
   - Créez un fichier `.env` dans le dossier `functions/`
   - Ajoutez :
     ```
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

2. **Pour le déploiement** :
   ```bash
   firebase functions:config:set stripe.secret_key="sk_test_..."
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```

### Option 3 : Via Firebase Config

```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

---

## 🔔 Configuration du Webhook

Le webhook Stripe permet de recevoir les événements de paiement (succès, échec, annulation, etc.).

### 1. Obtenir l'URL du Webhook

Votre webhook Firebase Functions sera accessible à :
```
https://us-central1-[VOTRE-PROJECT-ID].cloudfunctions.net/stripeWebhook
```

Remplacez `[VOTRE-PROJECT-ID]` par votre ID de projet Firebase.

### 2. Configurer le Webhook dans Stripe

1. **Dans le Dashboard Stripe** :
   - Allez dans **Developers** → **Webhooks**
   - Cliquez sur **Add endpoint**

2. **Configurer l'endpoint** :
   - **Endpoint URL** : `https://us-central1-[VOTRE-PROJECT-ID].cloudfunctions.net/stripeWebhook`
   - **Description** : "JobzAI Payment Webhook"
   - **Events to send** : Sélectionnez les événements suivants :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Récupérer le Secret du Webhook** :
   - Après avoir créé l'endpoint, cliquez dessus
   - Dans la section **Signing secret**, cliquez sur **Reveal**
   - Copiez le secret (commence par `whsec_`)
   - Stockez-le dans Firestore (document `settings/stripe`, champ `webhookSecret`)

### 3. Tester le Webhook

1. Dans Stripe Dashboard → Webhooks → Votre endpoint
2. Cliquez sur **Send test webhook**
3. Sélectionnez un événement (ex: `checkout.session.completed`)
4. Vérifiez que l'événement est reçu dans les logs Firebase Functions

---

## 🚀 Déploiement

### 1. Compiler les Firebase Functions

```bash
cd functions
npm run build
```

### 2. Déployer les Functions

```bash
firebase deploy --only functions
```

Ou pour déployer uniquement les fonctions Stripe :

```bash
firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook
```

### 3. Vérifier le déploiement

1. Vérifiez dans la console Firebase que les fonctions sont déployées
2. Testez l'endpoint :
   ```bash
   curl https://us-central1-[VOTRE-PROJECT-ID].cloudfunctions.net/createCheckoutSession
   ```

---

## ✅ Test de l'intégration

### 1. Tester avec des cartes de test Stripe

Stripe fournit des cartes de test pour le mode test :

**Cartes de test réussies** :
- Numéro : `4242 4242 4242 4242`
- Date d'expiration : N'importe quelle date future (ex: `12/34`)
- CVC : N'importe quel 3 chiffres (ex: `123`)
- Code postal : N'importe quel code postal (ex: `12345`)

**Cartes de test pour tester les erreurs** :
- `4000 0000 0000 0002` : Carte refusée
- `4000 0000 0000 9995` : Fond insuffisants

### 2. Tester le flux complet

1. **Connectez-vous à votre application**
2. **Allez sur la page Billing** (`/billing`)
3. **Sélectionnez un plan** (Standard ou Premium)
4. **Cliquez sur "Upgrade"** ou "Buy Now"
5. **Vous serez redirigé vers Stripe Checkout**
6. **Utilisez une carte de test** (ex: `4242 4242 4242 4242`)
7. **Complétez le paiement**
8. **Vérifiez que vous êtes redirigé vers `/payment/success`**
9. **Vérifiez dans Firestore** que :
   - Le document `users/[USER_ID]` a été mis à jour avec le plan et les crédits
   - Un document a été créé dans `users/[USER_ID]/creditHistory`
   - Un document a été créé dans `users/[USER_ID]/invoices`

### 3. Vérifier les logs

1. **Firebase Functions Logs** :
   ```bash
   firebase functions:log
   ```

2. **Stripe Dashboard** :
   - Allez dans **Payments** pour voir les paiements
   - Allez dans **Webhooks** pour voir les événements envoyés

---

## 🔍 Dépannage

### Problème : "Stripe API key not found"

**Solution** :
1. Vérifiez que la clé est bien stockée dans Firestore (`settings/stripe/secretKey`)
2. Vérifiez que la clé commence par `sk_test_` (mode test) ou `sk_live_` (production)
3. Vérifiez les logs Firebase Functions pour plus de détails

### Problème : "Webhook signature verification failed"

**Solution** :
1. Vérifiez que le `webhookSecret` est bien stocké dans Firestore
2. Vérifiez que l'URL du webhook dans Stripe correspond à votre fonction déployée
3. Vérifiez que la fonction utilise `rawRequest: true` (déjà configuré dans le code)

### Problème : Le paiement réussit mais les crédits ne sont pas ajoutés

**Solution** :
1. Vérifiez les logs Firebase Functions pour voir si le webhook est reçu
2. Vérifiez que le webhook est bien configuré dans Stripe avec les bons événements
3. Vérifiez que le `userId` est bien passé dans les métadonnées de la session Stripe

### Problème : Erreur CORS

**Solution** :
1. Vérifiez que `cors: true` est configuré dans les options de `onRequest`
2. Vérifiez que les headers CORS sont bien définis dans la fonction

### Problème : Le webhook n'est pas reçu

**Solution** :
1. Vérifiez que la fonction est bien déployée
2. Vérifiez que l'URL du webhook dans Stripe est correcte
3. Testez le webhook manuellement depuis le Dashboard Stripe
4. Vérifiez les logs Firebase Functions

---

## 📚 Ressources supplémentaires

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Firebase Functions](https://firebase.google.com/docs/functions)

---

## 🔐 Sécurité

⚠️ **Important** :
- Ne jamais commiter les clés API dans le code
- Utiliser Firestore ou les variables d'environnement pour stocker les clés
- Utiliser le mode test pour le développement
- Passer en production uniquement quand tout est testé

---

## 📝 Checklist de configuration

- [ ] Compte Stripe créé et activé
- [ ] Clé API secrète récupérée et stockée dans Firestore
- [ ] Webhook configuré dans Stripe avec la bonne URL
- [ ] Secret du webhook stocké dans Firestore
- [ ] Firebase Functions compilées et déployées
- [ ] Test avec une carte de test réussi
- [ ] Vérification que les crédits sont ajoutés après paiement
- [ ] Vérification que les webhooks sont reçus et traités

---

## 🎉 Félicitations !

Votre intégration Stripe est maintenant configurée et prête à recevoir des paiements !

Pour toute question ou problème, consultez les logs Firebase Functions ou la documentation Stripe.

