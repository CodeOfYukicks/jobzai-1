# Diagnostic de l'erreur 500 sur l'endpoint /api/chatgpt

## Problème
L'endpoint `/api/chatgpt` retourne une erreur 500 lors de l'analyse des recommandations.

## Causes possibles

### 1. Clé API OpenAI manquante ou invalide
La clé API OpenAI n'est pas configurée ou est invalide.

**Solution :**
- Vérifier que la clé API est définie dans Firestore (`settings/openai` avec le champ `apiKey` ou `api_key`)
- OU définir la variable d'environnement `OPENAI_API_KEY` dans un fichier `.env` à la racine du projet
- Redémarrer le serveur après avoir ajouté la clé

### 2. Serveur Express non démarré
Le serveur Express (`server.cjs`) n'est pas en cours d'exécution.

**Solution :**
- Démarrer le serveur avec : `node server.cjs`
- Vérifier que le serveur écoute sur le port 3000 (ou le port défini dans `PORT`)
- Vérifier les logs du serveur pour voir les erreurs

### 3. Erreur lors de l'appel à l'API OpenAI
L'appel à l'API OpenAI échoue (quota dépassé, clé invalide, erreur réseau, etc.).

**Solution :**
- Vérifier les logs du serveur pour voir l'erreur exacte
- Vérifier que la clé API est valide et a des crédits disponibles
- Vérifier la connexion internet

### 4. Erreur de parsing de la réponse
La réponse de l'API OpenAI ne peut pas être parsée.

**Solution :**
- Vérifier les logs du serveur pour voir la réponse brute
- Vérifier que le format de réponse est correct

## Comment diagnostiquer

### 1. Vérifier les logs du serveur
Les logs du serveur contiennent maintenant beaucoup plus d'informations pour diagnostiquer le problème :

```bash
# Démarrer le serveur et observer les logs
node server.cjs
```

### 2. Vérifier la configuration de la clé API

**Option A : Firestore**
1. Aller dans la console Firebase
2. Ouvrir Firestore
3. Vérifier que le document `settings/openai` existe
4. Vérifier que le champ `apiKey` ou `api_key` contient la clé API

**Option B : Variables d'environnement**
1. Créer un fichier `.env` à la racine du projet
2. Ajouter : `OPENAI_API_KEY=sk-...`
3. Redémarrer le serveur

### 3. Tester l'endpoint directement

```bash
# Tester l'endpoint avec curl
curl -X POST http://localhost:3000/api/chatgpt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "type": "market-insights"
  }'
```

### 4. Vérifier que le serveur est accessible

```bash
# Tester l'endpoint de test
curl http://localhost:3000/api/test
```

## Améliorations apportées

Le code a été amélioré pour :
1. ✅ Meilleure gestion d'erreur avec des logs détaillés
2. ✅ Vérification de la clé API avec messages d'erreur clairs
3. ✅ Gestion d'erreur pour l'appel à l'API OpenAI
4. ✅ Gestion d'erreur pour le parsing de la réponse
5. ✅ Logs détaillés à chaque étape du processus

## Prochaines étapes

1. Redémarrer le serveur : `node server.cjs`
2. Observer les logs lors d'une nouvelle tentative
3. Identifier l'erreur exacte dans les logs
4. Appliquer la solution correspondante

## Logs à surveiller

Lors d'une requête, vous devriez voir dans les logs :
- `ChatGPT API endpoint called for recommendations`
- `Request body keys: ...`
- `🔑 Attempting to retrieve OpenAI API key from Firestore...`
- `✅ API key retrieved successfully (first 10 chars): ...`
- `📡 Sending request to ChatGPT API...`
- `OpenAI API response status: ...`
- `✅ ChatGPT recommendation completed successfully`

Si vous voyez des erreurs (❌), notez le message d'erreur exact pour identifier le problème.



