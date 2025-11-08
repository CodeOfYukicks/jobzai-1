# Guide de Configuration Email Firebase

## Problème résolu dans le code

✅ **L'email de vérification est maintenant envoyé automatiquement lors de l'inscription**

Le code a été corrigé dans `src/contexts/AuthContext.tsx` pour envoyer l'email de vérification immédiatement après la création du compte.

## Vérifications à faire dans Firebase Console

### 1. Configuration Authentication

1. Allez dans **Firebase Console** → **Authentication** → **Settings** (⚙️)
2. Vérifiez que **Email/Password** est activé dans **Sign-in method**
3. Vérifiez que **Email link (passwordless sign-in)** est activé si nécessaire

### 2. Configuration des Templates d'Email

1. Allez dans **Authentication** → **Templates**
2. Vérifiez que le template **Email address verification** est configuré :
   - **Subject** : Doit être défini (ex: "Verify your email address")
   - **Body** : Doit contenir le lien de vérification `%LINK%`
   - **Action URL** : Doit pointer vers votre domaine autorisé

### 3. Domaines autorisés

1. Allez dans **Authentication** → **Settings** → **Authorized domains**
2. Vérifiez que votre domaine est dans la liste :
   - `localhost` (pour le développement)
   - Votre domaine de production (ex: `votredomaine.com`)
   - `firebaseapp.com` (par défaut)

### 4. Configuration SMTP (Optionnel mais recommandé)

Si vous utilisez un domaine personnalisé, configurez SMTP :

1. Allez dans **Authentication** → **Settings** → **SMTP configuration**
2. Configurez votre serveur SMTP personnalisé OU
3. Utilisez le service par défaut de Firebase (gratuit mais limité)

### 5. Vérification des quotas

1. Allez dans **Usage and billing**
2. Vérifiez que vous n'avez pas dépassé les limites :
   - **Email verification** : 100 emails/jour (gratuit)
   - Si vous dépassez, vous devez passer au plan Blaze

## Tests de débogage

### 1. Vérifier dans la console du navigateur

Ouvrez la console (F12) et vérifiez :
- `Verification email sent successfully` → Email envoyé ✅
- `Error sending verification email: ...` → Erreur à corriger ❌

### 2. Vérifier dans Firebase Console

1. Allez dans **Authentication** → **Users**
2. Trouvez votre utilisateur
3. Vérifiez que :
   - **Email verified** : `false` (avant vérification)
   - **Provider** : `password`
   - **Created** : Date récente

### 3. Vérifier les logs Firebase

1. Allez dans **Functions** → **Logs** (si vous utilisez Cloud Functions)
2. Cherchez les erreurs liées à l'envoi d'email

## Solutions aux problèmes courants

### Problème : Email non reçu

**Solutions :**
1. ✅ Vérifiez le dossier **Spam/Junk**
2. ✅ Attendez quelques minutes (délai d'envoi)
3. ✅ Vérifiez que l'adresse email est correcte
4. ✅ Utilisez le bouton "Resend" sur la page de vérification
5. ✅ Vérifiez les quotas Firebase

### Problème : Erreur "auth/too-many-requests"

**Solution :**
- Vous avez envoyé trop d'emails rapidement
- Attendez quelques minutes avant de réessayer
- Ou passez au plan Blaze pour augmenter les limites

### Problème : Email arrive mais le lien ne fonctionne pas

**Solutions :**
1. Vérifiez que le domaine est dans **Authorized domains**
2. Vérifiez que l'URL de redirection est correcte dans le code
3. Vérifiez que le template d'email contient bien `%LINK%`

### Problème : Erreur dans la console

**Vérifications :**
1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs Firebase
3. Vérifiez que `firebase/auth` est bien importé
4. Vérifiez que l'utilisateur est bien créé avant l'envoi

## Configuration recommandée

### Template d'email personnalisé

```html
Subject: Verify your email address

Body:
Hello,

Please verify your email address by clicking the link below:

%LINK%

If you didn't request this, please ignore this email.

Thanks,
Jobz.ai Team
```

### Action URL

Dans le code, l'URL de redirection est configurée comme :
```javascript
url: window.location.origin + '/complete-profile'
```

Assurez-vous que cette route existe et fonctionne.

## Support

Si le problème persiste après ces vérifications :
1. Vérifiez les logs Firebase Console
2. Vérifiez la console du navigateur pour les erreurs
3. Testez avec un autre compte email
4. Vérifiez que votre projet Firebase est actif et non suspendu

