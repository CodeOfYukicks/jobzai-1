# Prochaines étapes pour Stripe

## ✅ Ce qui est déjà fait
- ✅ Clé secrète Stripe configurée dans Firebase

## 📋 Checklist des prochaines étapes

### 1. Vérifier que la clé est bien dans Firestore

Assurez-vous que votre clé est stockée dans Firestore avec cette structure :

**Collection** : `settings`  
**Document** : `stripe`  
**Champ** : `secretKey` (ou `secret_key`)

Valeur : `sk_test_xxx...` (remplacez par votre clé secrète Stripe Test)

### 2. Configurer le Webhook Stripe (IMPORTANT)

Le webhook permet de recevoir les événements de paiement (succès, échec, etc.).

#### Étape 2.1 : Obtenir l'URL du webhook

Votre webhook Firebase Functions sera accessible à :
```
https://us-central1-jobzai.cloudfunctions.net/stripeWebhook
```

#### Étape 2.2 : Configurer dans Stripe Dashboard

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Developers** → **Webhooks**
3. Cliquez sur **Add endpoint**
4. Configurez :
   - **Endpoint URL** : `https://us-central1-jobzai.cloudfunctions.net/stripeWebhook`
   - **Description** : "JobzAI Payment Webhook"
   - **Events to send** : Sélectionnez ces événements :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
5. Cliquez sur **Add endpoint**

#### Étape 2.3 : Récupérer le Secret du Webhook

1. Après avoir créé l'endpoint, cliquez dessus
2. Dans la section **Signing secret**, cliquez sur **Reveal**
3. Copiez le secret (commence par `whsec_`)
4. **Ajoutez-le dans Firestore** :
   - Collection : `settings`
   - Document : `stripe`
   - Champ : `webhookSecret` (ou `webhook_secret`)
   - Valeur : Le secret que vous venez de copier

### 3. Déployer les Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook
```

Ou pour déployer toutes les fonctions :

```bash
firebase deploy --only functions
```

### 4. Tester l'intégration

#### Test avec une carte de test Stripe

1. **Connectez-vous à votre application**
2. **Allez sur la page Billing** (`/billing`)
3. **Sélectionnez un plan** (Standard ou Premium)
4. **Cliquez sur "Upgrade"**
5. **Vous serez redirigé vers Stripe Checkout**
6. **Utilisez une carte de test** :
   - Numéro : `4242 4242 4242 4242`
   - Date d'expiration : `12/34` (ou toute date future)
   - CVC : `123` (ou n'importe quel 3 chiffres)
   - Code postal : `12345` (ou n'importe quel code postal)
7. **Complétez le paiement**
8. **Vérifiez** :
   - ✅ Vous êtes redirigé vers `/payment/success`
   - ✅ Dans Firestore, votre document `users/[VOTRE_USER_ID]` a été mis à jour avec :
     - `plan` : Le plan sélectionné
     - `credits` : Les crédits du plan
     - `paymentStatus` : `active`
   - ✅ Un document a été créé dans `users/[VOTRE_USER_ID]/creditHistory`
   - ✅ Un document a été créé dans `users/[VOTRE_USER_ID]/invoices`

### 5. Vérifier les logs

Si quelque chose ne fonctionne pas, vérifiez les logs :

```bash
firebase functions:log
```

Ou dans la console Firebase :
- **Functions** → **Logs**

---

## 🔍 Vérification rapide

### Structure Firestore attendue :

```
settings/
  └── stripe/
      ├── secretKey: "sk_test_xxx..." (votre clé secrète Stripe Test)
      └── webhookSecret: "whsec_..." (à ajouter après configuration du webhook)
```

---

## ⚠️ Points importants

1. **Le webhook est OBLIGATOIRE** : Sans lui, les paiements ne mettront pas à jour les crédits automatiquement
2. **Utilisez le mode test** : Votre clé commence par `sk_test_`, donc vous êtes en mode test (parfait pour tester)
3. **Déployez les fonctions** : Les fonctions doivent être déployées pour que Stripe puisse les appeler

---

## 🆘 En cas de problème

1. Vérifiez que la clé est bien dans Firestore (`settings/stripe/secretKey`)
2. Vérifiez que le webhook est configuré dans Stripe Dashboard
3. Vérifiez que le webhookSecret est dans Firestore
4. Vérifiez que les fonctions sont déployées
5. Consultez les logs Firebase Functions

---

## 📞 Besoin d'aide ?

Consultez le guide complet : `STRIPE_SETUP_GUIDE.md`

