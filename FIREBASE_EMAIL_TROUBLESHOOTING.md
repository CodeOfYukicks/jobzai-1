# Guide de Résolution - Email de Vérification Ne S'Envoie Pas

## ✅ Configuration Firebase à Vérifier

D'après votre capture d'écran, le template est configuré. Voici les points à vérifier :

### 1. **Action URL dans le Template Firebase**

Dans Firebase Console → Authentication → Templates → Email address verification :

1. **Cliquez sur le crayon** à côté de "De (From)" pour éditer le template
2. **Vérifiez que le template contient `%LINK%`** dans le message
3. **Action URL** : Configurez l'URL de redirection
   - Pour le développement : `http://localhost:5173/complete-profile`
   - Pour la production : `https://votredomaine.com/complete-profile`

### 2. **Domaines Autorisés**

Firebase Console → Authentication → Settings → Authorized domains :

✅ Vérifiez que ces domaines sont dans la liste :
- `localhost` (pour le développement)
- Votre domaine de production
- `jobzai.firebaseapp.com` (déjà présent)

### 3. **Configuration SMTP (Important)**

Si les emails ne partent pas, configurez SMTP :

1. Firebase Console → Authentication → Settings → SMTP configuration
2. **Option 1** : Utiliser le service par défaut de Firebase (gratuit, limité à 100/jour)
3. **Option 2** : Configurer un SMTP personnalisé (Gmail, SendGrid, etc.)

### 4. **Quotas Firebase**

Firebase Console → Usage and billing :

- **Plan gratuit** : 100 emails de vérification/jour
- Si vous dépassez, vous devez passer au plan **Blaze**

## 🔍 Diagnostic dans le Code

### Vérifier les Logs dans la Console

1. Ouvrez la console du navigateur (F12)
2. Cliquez sur "Resend Verification Email"
3. Regardez les messages :

**Si vous voyez :**
```
handleResendEmail called { currentUser: true, timeLeft: 0, isResending: false, email: "..." }
Sending verification email to: ...
Verification email sent successfully
```
✅ **L'email devrait être envoyé**

**Si vous voyez une erreur :**
```
Error sending verification email: ...
Error code: auth/...
```
❌ **Notez le code d'erreur et le message**

## 🛠️ Solutions selon les Erreurs

### Erreur : `auth/too-many-requests`
**Solution :**
- Attendez 5-10 minutes
- Vérifiez vos quotas Firebase
- Passez au plan Blaze si nécessaire

### Erreur : `auth/user-not-found`
**Solution :**
- L'utilisateur n'existe plus
- Reconnectez-vous

### Erreur : `auth/email-already-verified`
**Solution :**
- L'email est déjà vérifié
- Redirection automatique vers `/complete-profile`

### Pas d'erreur mais pas d'email reçu
**Solutions :**
1. ✅ Vérifiez le dossier **Spam/Junk**
2. ✅ Attendez 2-3 minutes (délai d'envoi)
3. ✅ Vérifiez que l'adresse email est correcte
4. ✅ Testez avec un autre compte email
5. ✅ Vérifiez les quotas Firebase (100/jour en gratuit)
6. ✅ Vérifiez la configuration SMTP dans Firebase

## 📧 Configuration SMTP Personnalisée (Recommandé)

Si vous avez des problèmes avec le service par défaut de Firebase :

### Option 1 : Gmail SMTP
1. Firebase Console → Authentication → Settings → SMTP configuration
2. Configurez :
   - **SMTP Host** : `smtp.gmail.com`
   - **SMTP Port** : `587`
   - **SMTP Username** : Votre email Gmail
   - **SMTP Password** : Mot de passe d'application Gmail

### Option 2 : SendGrid (Recommandé pour la production)
1. Créez un compte SendGrid
2. Générez une clé API
3. Configurez dans Firebase :
   - **SMTP Host** : `smtp.sendgrid.net`
   - **SMTP Port** : `587`
   - **SMTP Username** : `apikey`
   - **SMTP Password** : Votre clé API SendGrid

## 🧪 Test Manuel

Pour tester si Firebase envoie bien les emails :

1. **Dans Firebase Console** → Authentication → Users
2. Trouvez votre utilisateur
3. Cliquez sur les **3 points** → **Send email verification**
4. Si l'email arrive → Le problème est dans le code
5. Si l'email n'arrive pas → Le problème est dans la configuration Firebase

## 📝 Template d'Email Recommandé

Dans Firebase Console → Authentication → Templates → Email address verification :

**Subject :**
```
Verify your email for %APP_NAME%
```

**Message :**
```
Hello %DISPLAY_NAME%,

Please verify your email address by clicking the link below:

%LINK%

If you didn't request this verification, you can safely ignore this email.

Thanks,
The %APP_NAME% team
```

**Important :** Le template **DOIT** contenir `%LINK%` pour que le lien de vérification fonctionne.

## 🔗 Action URL

Dans le template, configurez l'**Action URL** :
- **Développement** : `http://localhost:5173`
- **Production** : `https://votredomaine.com`

Cette URL sera utilisée comme base pour le lien de vérification.

## ✅ Checklist de Vérification

- [ ] Email/Password est activé dans Sign-in method
- [ ] Le template "Email address verification" existe
- [ ] Le template contient `%LINK%` dans le message
- [ ] L'Action URL est configurée
- [ ] Les domaines autorisés incluent votre domaine
- [ ] SMTP est configuré (par défaut ou personnalisé)
- [ ] Les quotas Firebase ne sont pas dépassés
- [ ] L'adresse email de l'utilisateur est correcte
- [ ] Le dossier spam a été vérifié

## 🆘 Si Rien Ne Fonctionne

1. **Testez avec un autre compte email** (Gmail, Outlook, etc.)
2. **Vérifiez les logs Firebase** dans Console → Functions → Logs
3. **Contactez le support Firebase** si le problème persiste
4. **Vérifiez que votre projet Firebase est actif** et non suspendu

