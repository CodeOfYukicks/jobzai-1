# Guide : Créer un Private App Access Token via HubSpot CLI

Si vous n'avez pas accès aux Private Apps dans l'interface web (plan gratuit/Starter), utilisez le HubSpot CLI.

## Étape 1 : Installer le HubSpot CLI

```bash
npm install -g @hubspot/cli
```

## Étape 2 : Authentifier-vous

```bash
hs auth
```

Cette commande ouvrira une fenêtre de navigateur pour vous connecter à votre compte HubSpot.

## Étape 3 : Créer un projet

```bash
hs project create
```

Suivez les instructions :
- Donnez un nom à votre projet (ex: "jobzai-integration")
- Choisissez un template (vous pouvez choisir "Custom" ou "Blank")

## Étape 4 : Créer une Private App dans le projet

```bash
cd <nom-du-projet>
hs project create-app
```

Ou si vous êtes déjà dans le dossier du projet :

```bash
hs project create-app
```

Suivez les instructions :
- Nom de l'app : "JobzAI Integration"
- Permissions : Sélectionnez "Contacts" avec "Read" et "Write"

## Étape 5 : Récupérer le token

Le token sera affiché dans le terminal et sauvegardé dans le fichier `hubspot.config.yml` de votre projet.

Pour le voir :

```bash
cat hubspot.config.yml
```

Cherchez la ligne qui contient `privateAppAccessToken` ou `accessToken`. Le token commence par `pat-`.

## Étape 6 : Copier le token dans Firestore

1. Ouvrez la console Firebase : https://console.firebase.google.com
2. Allez dans **Firestore Database**
3. Créez/modifiez le document :
   - Collection : `settings`
   - Document ID : `hubspot`
   - Champ : `apiKey` = votre token `pat-*`

## Étape 7 : Redéployer les fonctions

```bash
cd /Users/rouchditouil/jobzai-1-3
firebase deploy --only functions:syncUserToHubSpot
```

## Vérification

Testez l'intégration en créant un nouveau compte utilisateur sur votre site. Le contact devrait apparaître dans HubSpot.

## Dépannage

### Le token n'est pas affiché

Vérifiez le fichier `hubspot.config.yml` :
```bash
cat hubspot.config.yml | grep -i token
```

### Erreur d'authentification

Ré-authentifiez-vous :
```bash
hs auth
```

### Le projet n'est pas créé

Vérifiez que vous êtes dans le bon répertoire et que Node.js est installé :
```bash
node --version
npm --version
```


