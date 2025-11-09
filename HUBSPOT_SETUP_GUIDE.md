# Guide de Configuration HubSpot

## Configuration Rapide (5 minutes)

### Étape 1 : Créer une Private App dans HubSpot

⚠️ **IMPORTANT** : Les **Developer API Keys** (qui commencent par `eu1-` ou `na1-`) ont été supprimées depuis le 30 novembre 2022 et ne fonctionnent plus avec l'API v3 de HubSpot. Vous **DEVEZ** utiliser un **Private App Access Token** (qui commence par `pat-`).

**Méthode recommandée : Via l'interface web (plus simple)**

1. Connectez-vous à votre compte HubSpot
2. Cliquez sur l'icône **Settings** (⚙️) dans la barre de navigation principale
3. Dans le menu latéral gauche, allez dans **Integrations** → **Private Apps**
4. Cliquez sur **Create a private app** (ou "Créer une application privée")
5. Donnez un nom à votre app (ex: "JobzAI Integration")
6. Configurez les permissions (onglet "Scopes") :
   - **Contacts** : `Read` et `Write`
   - **Timeline** : `Write` (optionnel, pour les événements)
7. Cliquez sur **Create app** (ou "Créer l'application")
8. **Copiez le Private App Access Token** qui s'affiche (il commence par `pat-`)
   - ⚠️ **Copiez-le immédiatement** car il ne sera plus affiché après !
   - ⚠️ Si votre token commence par `eu1-` ou `na1-`, c'est une ancienne Developer API Key qui ne fonctionnera pas !

**Alternative : Via HubSpot CLI (si vous préférez)**

Si vous préférez utiliser le CLI :
```bash
npm install -g @hubspot/cli
hs auth
hs project create
```
Le token sera dans le fichier `hubspot.config.yml` de votre projet.

### Étape 2 : Configurer la clé API dans Firebase

Vous avez deux options :

#### Option A : Via Firestore (Recommandé)

1. Ouvrez la console Firebase : https://console.firebase.google.com
2. Allez dans **Firestore Database**
3. Créez/modifiez le document suivant :
   - Collection : `settings`
   - Document ID : `hubspot`
   - Champs :
     ```
     apiKey: "votre-clé-api-hubspot"
     ```

#### Option B : Via Firebase Functions Config

```bash
cd functions
firebase functions:config:set hubspot.api_key="votre-clé-api-hubspot"
```

#### Option C : Via Variable d'environnement

Ajoutez dans votre fichier `.env` ou dans les variables d'environnement de Firebase Functions :
```
HUBSPOT_API_KEY=votre-clé-api-hubspot
```

### Étape 3 : Créer les propriétés personnalisées dans HubSpot (Optionnel)

Pour mieux tracker vos utilisateurs, créez ces propriétés personnalisées dans HubSpot :

1. Allez dans **Settings** → **Properties** → **Contact properties**
2. Cliquez sur **Create property**
3. Créez les propriétés suivantes :

| Nom de la propriété | Type | Label |
|---------------------|------|-------|
| `jobzai_user_id` | Text | JobzAI User ID |
| `jobzai_signup_date` | Date | JobzAI Signup Date |
| `jobzai_profile_completed` | Boolean | JobzAI Profile Completed |
| `jobzai_last_login` | Date | JobzAI Last Login |
| `jobzai_credits` | Number | JobzAI Credits |
| `jobzai_source` | Text | JobzAI Signup Source |

**Note** : Ces propriétés sont optionnelles. L'intégration fonctionnera sans elles, mais vous aurez moins de données structurées.

### Étape 4 : Déployer les Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Étape 5 : Tester l'intégration

1. Créez un nouveau compte utilisateur sur votre site
2. Vérifiez dans HubSpot que le contact a été créé
3. Complétez le profil d'un utilisateur
4. Vérifiez que les données ont été mises à jour dans HubSpot

## Vérification

### Vérifier que la clé API est configurée

Les logs Firebase Functions devraient afficher :
```
✅ HubSpot API key retrieved from Firestore
```

Si vous voyez :
```
⚠️  HubSpot API key not found. HubSpot integration will be disabled.
```

Vérifiez que vous avez bien configuré la clé API (étape 2).

### Vérifier les contacts dans HubSpot

1. Allez dans **Contacts** → **Contacts**
2. Recherchez un utilisateur par email
3. Vérifiez que les données sont présentes

## Données synchronisées

### À l'inscription
- Email
- Prénom (firstName)
- Nom (lastName)
- Date d'inscription
- Source d'inscription (email/google)
- ID utilisateur Firebase

### Lors de la complétion du profil
- Téléphone (si fourni)
- Entreprise (si fournie)
- Titre professionnel (si fourni)
- Localisation (ville, état, pays)
- Toutes les autres données de profil

### Événements trackés
- `user_signed_up` : Nouvelle inscription
- `profile_completed` : Profil complété

## Dépannage

### Les contacts ne sont pas créés dans HubSpot

1. **Vérifiez les logs Firebase Functions** :
   ```bash
   firebase functions:log
   ```
   Cherchez les erreurs liées à HubSpot

2. **Vérifiez la clé API** :
   - Assurez-vous que la clé API est correcte
   - Vérifiez que les permissions sont correctes dans HubSpot

3. **Vérifiez les permissions** :
   - La Private App doit avoir les permissions `Read` et `Write` sur Contacts

### Les événements ne sont pas envoyés

Les événements timeline nécessitent une configuration supplémentaire dans HubSpot. Pour l'instant, l'intégration se concentre sur la synchronisation des contacts. Les événements peuvent être ajoutés plus tard si nécessaire.

### L'intégration ralentit l'inscription

L'intégration HubSpot est **non-bloquante** : si elle échoue, l'inscription continue normalement. Les erreurs sont loggées mais n'affectent pas l'expérience utilisateur.

## Prochaines étapes

Une fois l'intégration de base fonctionnelle, vous pouvez :

1. **Créer des workflows HubSpot** :
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

Pour plus d'informations sur l'API HubSpot :
- Documentation : https://developers.hubspot.com/docs/api/overview
- API Contacts : https://developers.hubspot.com/docs/api/crm/contacts

