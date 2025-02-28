# Guide de déploiement en production

Ce document explique comment déployer correctement l'application JobZAI en production.

## Configuration du serveur Express

Le serveur Express agit comme un proxy pour l'API Claude. Il doit être correctement configuré pour l'environnement de production.

### Variables d'environnement requises

Créez un fichier `.env` sur votre serveur de production avec les variables suivantes :

```
# API Key Anthropic (Claude)
ANTHROPIC_API_KEY=votre_clé_api_claude

# Domain settings (pour CORS)
PRODUCTION_DOMAIN=https://votredomaine.com

# Mode d'environnement
NODE_ENV=production

# Port (optionnel, par défaut 3000)
PORT=3000
```

## Options de déploiement

Vous avez plusieurs options pour déployer le serveur Express :

### Option 1 : Déploiement intégré avec votre frontend

Si vous utilisez une plateforme comme Vercel, Netlify ou Firebase Hosting, vous pouvez configurer des fonctions serverless pour gérer les routes API :

- **Vercel** : Utilisez les API Routes dans le dossier `/api`
- **Netlify** : Utilisez les fonctions Netlify dans le dossier `/netlify/functions`
- **Firebase** : Utilisez Firebase Functions

### Option 2 : Déploiement séparé du serveur Express

1. Déployez votre frontend sur votre plateforme préférée
2. Déployez le serveur Express sur une plateforme comme :
   - Heroku
   - DigitalOcean
   - AWS EC2
   - Google Cloud Run

Puis configurez un proxy dans votre frontend pour rediriger les requêtes `/api/*` vers votre serveur Express.

### Option 3 : Déploiement avec un reverse proxy (Nginx)

```nginx
server {
    listen 80;
    server_name votredomaine.com;

    # Frontend
    location / {
        root /chemin/vers/votre/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configuration spécifique pour les services de cloud

### Vercel

Pour Vercel, créez un fichier `vercel.json` à la racine de votre projet :

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "http://localhost:3000/api/:path*" }
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic_api_key",
    "PRODUCTION_DOMAIN": "https://votredomaine.com",
    "NODE_ENV": "production"
  }
}
```

### Netlify

Pour Netlify, créez un fichier `netlify.toml` à la racine de votre projet :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "http://localhost:3000/api/:splat"
  status = 200
  force = true
```

## Vérification du déploiement

Une fois déployé, vous pouvez vérifier que votre serveur fonctionne correctement en accédant à :

```
https://votredomaine.com/api/test
```

Vous devriez recevoir une réponse JSON :

```json
{
  "status": "success",
  "message": "Server is running"
}
```

## Résolution des problèmes courants

### Erreurs CORS

Si vous rencontrez des erreurs CORS, vérifiez que :
1. `PRODUCTION_DOMAIN` est correctement configuré
2. Le domaine exact de votre frontend est dans la liste des origines autorisées

### Clé API Claude manquante

Si vous recevez une erreur indiquant que la clé API Claude est manquante :
1. Vérifiez que `ANTHROPIC_API_KEY` est correctement défini dans vos variables d'environnement
2. Assurez-vous que la clé API est valide et active

### Timeout des requêtes

Si les requêtes prennent trop de temps et expirent :
1. Augmentez la limite de timeout sur votre serveur ou proxy
2. Vérifiez la taille maximale des requêtes dans votre configuration

## Support

Pour toute question ou problème lié au déploiement, contactez support@jobzai.com. 