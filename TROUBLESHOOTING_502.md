# Guide de dépannage - Erreur 502 Bad Gateway

## Problème
Erreur 502 Bad Gateway lors de l'analyse CV via `/api/analyze-cv-vision`

## 🔴 Solution rapide (à faire en premier)

### 1. Vérifier les logs Firebase
```bash
firebase functions:log --only analyzeCVVision --lines 50
```
**Note :** Utiliser `--lines` et non `--limit`

### 2. Redéployer la fonction
```bash
cd functions
npm run build
firebase deploy --only functions:analyzeCVVision
```

### 3. Vérifier la clé API OpenAI dans Firestore
- Aller dans [Firebase Console > Firestore](https://console.firebase.google.com/project/jobzai/firestore)
- Vérifier que le document `settings/openai` existe
- Vérifier que le champ `apiKey` ou `api_key` contient une clé valide

## Causes possibles

### 1. Fonction non déployée ou mal déployée
**Solution :**
```bash
# Rebuild et redéployer les functions
cd functions
npm run build
firebase deploy --only functions:analyzeCVVision
```

### 2. Clé API OpenAI manquante ou invalide
**Vérification :**
- Vérifier que le document `settings/openai` existe dans Firestore
- Vérifier que le champ `apiKey` ou `api_key` contient une clé valide

**Solution :**
```bash
# Vérifier les logs
firebase functions:log --only analyzeCVVision

# Ou via la console Firebase
# https://console.firebase.google.com/project/jobzai/functions/logs
```

### 3. Timeout de la fonction
La fonction a un timeout de 300 secondes (5 minutes). Si l'analyse prend plus de temps, elle peut timeout.

**Solution :**
- Vérifier les logs pour voir si c'est un timeout
- Réduire la taille des images ou optimiser le prompt

### 4. Problème de compilation TypeScript
**Solution :**
```bash
cd functions
npm run build
# Vérifier qu'il n'y a pas d'erreurs de compilation
```

### 5. Problème avec Firebase Functions v2
La fonction utilise `onRequest` de v2 qui nécessite une configuration spécifique.

**Vérification :**
- Vérifier que `firebase-functions` v4+ est installé
- Vérifier que la région est correcte (`us-central1`)

## Commandes de diagnostic

### 1. Vérifier les logs en temps réel
```bash
firebase functions:log --only analyzeCVVision --lines 50
```

### 2. Tester la fonction localement
```bash
cd functions
npm run serve
# Puis tester avec curl ou Postman
```

### 3. Vérifier le statut de déploiement
```bash
firebase functions:list
```

### 4. Vérifier la configuration Firebase
```bash
firebase functions:config:get
```

## Solution rapide

1. **Vérifier les logs :**
   ```bash
   firebase functions:log --only analyzeCVVision --limit 50
   ```

2. **Redéployer la fonction :**
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions:analyzeCVVision
   ```

3. **Vérifier la clé API OpenAI dans Firestore :**
   - Aller dans Firebase Console > Firestore
   - Vérifier le document `settings/openai`
   - S'assurer que le champ `apiKey` existe et contient une clé valide

4. **Tester avec une requête simple :**
   ```bash
   curl -X POST https://YOUR_PROJECT_ID.cloudfunctions.net/analyzeCVVision \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## Vérifications importantes

- [ ] La fonction est bien déployée (`firebase functions:list`)
- [ ] La clé API OpenAI existe dans Firestore (`settings/openai`)
- [ ] Les logs ne montrent pas d'erreur au démarrage
- [ ] La région est correcte (`us-central1`)
- [ ] Le timeout est suffisant (300 secondes)
- [ ] Les dépendances sont installées (`npm install` dans `functions/`)

