# Test Rapide de la Recherche - Guide Simple

## ❌ Problème d'Authentification

Le script de test direct ne fonctionne pas car il nécessite des credentials Firebase.

## ✅ Solution Simple : Tester avec les Émulateurs

### Étape 1 : Démarrer les Émulateurs

```bash
# Dans le dossier racine du projet
firebase emulators:start
```

**Attendez de voir :**
```
✔  All emulators ready!
┌─────────┬────────────────┬─────────────────────────────────┐
│ Hosting │ localhost:5178 │ http://localhost:5178           │
├─────────┼────────────────┼─────────────────────────────────┤
│ Functions │ localhost:5001 │ http://localhost:5001/...    │
└─────────┴────────────────┴─────────────────────────────────┘
```

### Étape 2 : Ouvrir l'App dans le Navigateur

```
http://localhost:5178
```

### Étape 3 : Aller sur la Page Job Board

Cliquez sur "Job Board" dans la navigation.

### Étape 4 : Tester la Recherche

1. **Ouvrez DevTools** (F12 ou Cmd+Option+I sur Mac)
2. **Allez dans l'onglet "Console"**
3. **Tapez "stripe" dans la barre de recherche**
4. **Cliquez "Search"**

### Étape 5 : Observer les Résultats

#### 📊 Dans la Console du Navigateur

Vous verrez :
```javascript
🔍 Searching jobs with URL: http://localhost:5001/.../searchJobs?keyword=stripe&limit=200
✅ Found X jobs
```

**Si X = 0 :**
- Aucun job Stripe n'existe dans votre émulateur
- **Solution :** Importez des données ou testez avec un autre mot-clé

**Si X > 0 :**
- ✅ La recherche fonctionne !
- Les jobs Stripe s'affichent

#### 📊 Dans le Terminal (Émulateurs)

Vous verrez les nouveaux logs de diagnostic :
```
🔍 Job search request received
   Query params: { keyword: 'stripe', limit: '200' }
   Found 1000 jobs in database
   Filtering by keyword: "stripe"
   Total jobs before filter: 1000
   Sample companies: ['Google', 'Meta', 'Stripe']
   ✓ Match found in company: "Stripe"
   Jobs after keyword filter: 5
   Returning 5 filtered jobs
```

### Étape 6 : Tests Alternatifs

Si "stripe" ne marche pas, testez d'autres mots-clés :

```javascript
// Dans la console du navigateur, vous pouvez voir tous les jobs
fetch('http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?limit=10')
  .then(r => r.json())
  .then(data => {
    console.log('Total jobs:', data.count);
    console.log('Companies:', data.jobs.map(j => j.company));
  });
```

Cela vous montrera les 10 premiers jobs et leurs entreprises.

## 🔍 Diagnostic Rapide via cURL

Si vous préférez tester directement l'API :

```bash
# Terminal 2 (avec émulateurs actifs dans Terminal 1)

# Test 1 : Voir les premiers jobs
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?limit=5" | jq '.jobs[] | {company, title}'

# Test 2 : Chercher "stripe"
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?keyword=stripe" | jq '.count'

# Test 3 : Chercher "software"
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?keyword=software" | jq '.count'

# Test 4 : Voir toutes les entreprises uniques
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?limit=100" | jq '.jobs[].company' | sort -u
```

**Note :** Installez `jq` si vous ne l'avez pas : `brew install jq`

**Sans jq :**
```bash
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?limit=5"
```

## 🎯 Interprétation des Résultats

### ✅ Cas 1 : Jobs Stripe Trouvés

**API retourne :**
```json
{
  "success": true,
  "count": 5,
  "jobs": [...]
}
```

**Logs backend montrent :**
```
✓ Match found in company: "Stripe"
Jobs after keyword filter: 5
```

**→ SOLUTION : Ça marche ! Déployez :**
```bash
cd functions && npm run build
firebase deploy --only functions:searchJobs
```

### ❌ Cas 2 : Aucun Job Stripe

**API retourne :**
```json
{
  "success": true,
  "count": 0,
  "jobs": []
}
```

**Logs backend montrent :**
```
Found 250 jobs in database
Sample companies: ['Google', 'Meta', 'Amazon']
Jobs after keyword filter: 0
```

**→ SOLUTION : Stripe n'est pas dans les données**

**Options :**

#### Option A : Vérifier les Noms d'Entreprises

```bash
# Voir toutes les entreprises disponibles
curl "http://localhost:5001/.../searchJobs?limit=200" | \
  jq -r '.jobs[].company' | sort -u
```

Cherchez des variations : "Stripe, Inc.", "Stripe Inc", etc.

#### Option B : Ajouter des Jobs de Test

Vous pouvez ajouter manuellement des jobs Stripe pour tester :

1. Allez sur l'UI des émulateurs : http://localhost:4000
2. Firestore → Collection "jobs"
3. Ajoutez un document :

```json
{
  "title": "Senior Software Engineer",
  "company": "Stripe",
  "location": "San Francisco, CA",
  "description": "Build the future of online payments",
  "skills": ["React", "Node.js", "TypeScript"],
  "applyUrl": "https://stripe.com/jobs",
  "ats": "greenhouse",
  "postedAt": "(timestamp now)",
  "externalId": "test-stripe-1"
}
```

#### Option C : Vérifier la Configuration de Scraping

```bash
# Vérifier les sources ATS configurées
cat functions/src/config.ts
```

Assurez-vous que Stripe est dans la liste des entreprises à scraper.

## 🚀 Checklist Rapide

- [ ] Émulateurs démarrés (`firebase emulators:start`)
- [ ] App ouverte (http://localhost:5178)
- [ ] DevTools ouvert (F12)
- [ ] Recherche "stripe" testée
- [ ] Console du navigateur vérifiée
- [ ] Logs du terminal vérifiés
- [ ] Résultats interprétés

## 🆘 Si Rien Ne Marche

### Vérification 1 : Les Émulateurs Ont-ils des Données ?

```bash
# Ouvrir l'UI des émulateurs
open http://localhost:4000

# Aller dans Firestore → jobs
# Vérifier s'il y a des documents
```

**Si vide :** Vous devez importer des données ou déclencher le scraping.

### Vérification 2 : L'API Répond-elle ?

```bash
curl http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?limit=1
```

**Si erreur 404 :** La fonction n'est pas déployée/compilée.
```bash
cd functions
npm run build
# Redémarrer les émulateurs
```

**Si erreur 500 :** Regarder les logs dans le terminal des émulateurs.

### Vérification 3 : Le Frontend Appelle-t-il la Bonne URL ?

Dans DevTools → Network tab :
- Cherchez la requête à `searchJobs`
- Vérifiez l'URL appelée
- Vérifiez la réponse

## 📋 Résumé

| Test | Commande | Ce que ça vérifie |
|------|----------|-------------------|
| Émulateurs actifs | `firebase emulators:start` | Backend fonctionne |
| API accessible | `curl localhost:5001/.../searchJobs?limit=1` | Endpoint existe |
| Données présentes | UI émulateurs → Firestore | Base a des jobs |
| Recherche Stripe | Chercher dans l'app | Filtre fonctionne |
| Logs backend | Terminal émulateurs | Diagnostic détaillé |

---

**Prochaine étape :** Faites ces tests et dites-moi ce que vous voyez ! 🚀

