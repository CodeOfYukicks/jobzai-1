# Guide de Configuration Brevo

## Configuration Rapide (5 minutes)

### Étape 1 : Créer un compte Brevo (gratuit)

1. Allez sur https://www.brevo.com
2. Cliquez sur **Sign up free** (Inscription gratuite)
3. Créez votre compte (gratuit jusqu'à 300 emails/jour, contacts illimités)
4. Vérifiez votre email

### Étape 2 : Obtenir votre clé API

1. Connectez-vous à votre compte Brevo
2. Allez dans **Settings** (Paramètres) → **API Keys** (Clés API)
3. Cliquez sur **Generate a new API key** (Générer une nouvelle clé API)
4. Donnez un nom à votre clé (ex: "JobzAI Integration")
5. **Copiez la clé API** (vous en aurez besoin à l'étape suivante)
   - ⚠️ **Copiez-la immédiatement** car elle ne sera plus affichée après !

### Étape 3 : Configurer la clé API dans Firebase

#### Option A : Via Firestore (Recommandé)

1. Ouvrez la console Firebase : https://console.firebase.google.com
2. Allez dans **Firestore Database**
3. Créez/modifiez le document suivant :
   - Collection : `settings`
   - Document ID : `brevo`
   - Champs :
     ```
     apiKey: "votre-clé-api-brevo"
     ```

#### Option B : Via Firebase Functions Config

```bash
cd functions
firebase functions:config:set brevo.api_key="votre-clé-api-brevo"
```

#### Option C : Via Variable d'environnement

Ajoutez dans votre fichier `.env` ou dans les variables d'environnement de Firebase Functions :
```
BREVO_API_KEY=votre-clé-api-brevo
```

### Étape 4 : Créer les attributs personnalisés dans Brevo (Optionnel)

Pour mieux tracker vos utilisateurs, créez ces attributs personnalisés dans Brevo :

1. Allez dans **Contacts** → **Attributes** (Attributs)
2. Cliquez sur **Add a new attribute** (Ajouter un nouvel attribut)
3. Créez les attributs suivants :

| Nom de l'attribut | Type | Description |
|-------------------|------|-------------|
| `JOBZAI_USER_ID` | Text | ID utilisateur Firebase |
| `JOBZAI_SIGNUP_DATE` | Date | Date d'inscription |
| `JOBZAI_PROFILE_COMPLETED` | Boolean | Profil complété |
| `JOBZAI_LAST_LOGIN` | Date | Dernière connexion |
| `JOBZAI_CREDITS` | Number | Crédits disponibles |
| `JOBZAI_SOURCE` | Text | Source d'inscription (email/google) |

**Note** : Ces attributs sont optionnels. L'intégration fonctionnera sans eux, mais vous aurez moins de données structurées.

### Étape 5 : Déployer les Cloud Functions

```bash
cd /Users/rouchditouil/jobzai-1-3
cd functions
npm install
npm run build
firebase deploy --only functions:syncUserToBrevo
```

### Étape 6 : Tester l'intégration

1. Créez un nouveau compte utilisateur sur votre site
2. Vérifiez dans Brevo que le contact a été créé (Contacts → Contacts)
3. Complétez le profil d'un utilisateur
4. Vérifiez que les données ont été mises à jour dans Brevo

## Vérification

### Vérifier que la clé API est configurée

Les logs Firebase Functions devraient afficher :
```
✅ Brevo API key retrieved from Firestore
```

Si vous voyez :
```
⚠️  Brevo API key not found. Brevo integration will be disabled.
```

Vérifiez que vous avez bien configuré la clé API (étape 3).

### Vérifier les contacts dans Brevo

1. Allez dans **Contacts** → **Contacts**
2. Recherchez un utilisateur par email
3. Vérifiez que les données sont présentes

## Données synchronisées

### À l'inscription
- Email
- Prénom (FIRSTNAME)
- Nom (LASTNAME)
- Date d'inscription (JOBZAI_SIGNUP_DATE)
- Source d'inscription (JOBZAI_SOURCE: email/google)
- ID utilisateur Firebase (JOBZAI_USER_ID)

### Lors de la complétion du profil
- Téléphone (SMS)
- Entreprise (COMPANY)
- Titre professionnel (JOBTITLE)
- Localisation (CITY, STATE, COUNTRY)
- Toutes les autres données de profil

## Avantages de Brevo

✅ **Gratuit** : 300 emails/jour, contacts illimités
✅ **API simple** : Une seule clé API, pas de OAuth
✅ **Email marketing inclus** : Campagnes, automation, templates
✅ **CRM intégré** : Gestion de contacts
✅ **Support français** : Documentation et support en français

## Dépannage

### Les contacts ne sont pas créés dans Brevo

1. **Vérifiez les logs Firebase Functions** :
   ```bash
   firebase functions:log
   ```
   Cherchez les erreurs liées à Brevo

2. **Vérifiez la clé API** :
   - Assurez-vous que la clé API est correcte
   - Vérifiez que la clé API a les permissions nécessaires dans Brevo

3. **Vérifiez les permissions** :
   - La clé API doit avoir les permissions `Read` et `Write` sur Contacts

### L'intégration ralentit l'inscription

L'intégration Brevo est **non-bloquante** : si elle échoue, l'inscription continue normalement. Les erreurs sont loggées mais n'affectent pas l'expérience utilisateur.

## Prochaines étapes

Une fois l'intégration de base fonctionnelle, vous pouvez :

1. **Créer des workflows Brevo** :
   - Email de bienvenue automatique
   - Séquence d'onboarding
   - Rappels pour compléter le profil

2. **Segmenter vos utilisateurs** :
   - Utilisateurs avec profil complet vs incomplet
   - Utilisateurs actifs vs inactifs
   - Par source d'inscription

3. **Créer des campagnes marketing** :
   - Newsletters
   - Offres spéciales
   - Contenu éducatif

## Support

Pour plus d'informations sur l'API Brevo :
- Documentation : https://developers.brevo.com/
- API Contacts : https://developers.brevo.com/reference/createcontact


