# 🔧 Comment récupérer vos crédits manuellement

Si vous avez acheté des crédits mais qu'ils n'apparaissent pas sur votre compte, voici comment les ajouter manuellement.

## ✅ Solution automatique (recommandée)

La page de succès de paiement essaie maintenant automatiquement d'ajouter les crédits si le webhook n'a pas fonctionné. 

**Si vous êtes sur la page `/payment/success` :**
- Attendez 2-3 secondes
- La page devrait automatiquement traiter votre session et ajouter les crédits
- Si cela ne fonctionne pas, suivez les étapes manuelles ci-dessous

## 🔧 Solution manuelle

### Étape 1 : Trouver votre session ID Stripe

Vous avez plusieurs options :

#### Option A : Depuis l'URL de redirection
Si vous êtes sur la page `/payment/success`, regardez l'URL :
```
/payment/success?session_id=cs_test_XXXXX
```
Copiez le `session_id` (commence par `cs_test_` ou `cs_live_`)

#### Option B : Depuis Stripe Dashboard
1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Payments** (ou **Checkout sessions**)
3. Trouvez votre paiement récent
4. Cliquez dessus pour voir les détails
5. Copiez le **Session ID** (commence par `cs_test_` ou `cs_live_`)

### Étape 2 : Appeler la fonction manuellement

#### Option A : Via l'interface web (curl)

Ouvrez votre terminal et exécutez :

```bash
curl -X POST https://us-central1-jobzai.cloudfunctions.net/processStripeSession \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "VOTRE_SESSION_ID_ICI"}'
```

Remplacez `VOTRE_SESSION_ID_ICI` par le session ID que vous avez copié.

#### Option B : Via la console du navigateur

1. Ouvrez la console du navigateur (F12)
2. Exécutez ce code :

```javascript
fetch('https://us-central1-jobzai.cloudfunctions.net/processStripeSession', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: 'VOTRE_SESSION_ID_ICI'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Résultat:', data);
  if (data.success) {
    alert('Crédits ajoutés avec succès !');
    window.location.reload();
  } else {
    alert('Erreur: ' + data.message);
  }
})
.catch(error => {
  console.error('❌ Erreur:', error);
  alert('Erreur lors du traitement');
});
```

Remplacez `VOTRE_SESSION_ID_ICI` par votre session ID.

### Étape 3 : Vérifier que les crédits ont été ajoutés

1. Rechargez la page de votre application
2. Vérifiez votre solde de crédits
3. Les crédits devraient maintenant apparaître

---

## 🔍 Pourquoi les crédits n'ont pas été ajoutés automatiquement ?

Cela peut arriver si :

1. **Le webhook Stripe n'est pas configuré** : Le webhook permet à Stripe d'informer automatiquement votre application quand un paiement est réussi
2. **Le webhook secret n'est pas dans Firestore** : Même si le webhook est configuré, il faut que le secret soit stocké dans Firestore
3. **Le webhook a pris du temps** : Parfois, le webhook peut prendre quelques secondes à se déclencher

## 🛠️ Solution permanente : Configurer le webhook

Pour éviter ce problème à l'avenir, configurez le webhook Stripe :

1. **Allez sur Stripe Dashboard** → **Developers** → **Webhooks**
2. **Ajoutez un endpoint** : `https://us-central1-jobzai.cloudfunctions.net/stripeWebhook`
3. **Sélectionnez ces événements** :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Récupérez le secret** (commence par `whsec_`)
5. **Ajoutez-le dans Firestore** :
   - Collection : `settings`
   - Document : `stripe`
   - Champ : `webhookSecret`
   - Valeur : Le secret que vous venez de copier

Consultez `STRIPE_SETUP_GUIDE.md` pour plus de détails.

---

## 📞 Besoin d'aide ?

Si vous avez des problèmes, vérifiez :
1. Que le session ID est correct
2. Que le paiement a bien été effectué (vérifiez dans Stripe Dashboard)
3. Les logs Firebase Functions pour voir les erreurs

