# Guide de Diagnostic - Recherche de Jobs

## Problème Signalé
❌ La recherche "stripe" ne retourne aucun résultat alors que des jobs Stripe existent dans la base

## Étapes de Diagnostic

### 1️⃣ Vérifier les données dans Firestore

**Option A : Via Firebase Console**
```
1. Ouvrir Firebase Console
2. Aller dans Firestore Database
3. Collection "jobs"
4. Chercher manuellement des jobs avec company = "Stripe"
5. Noter le nombre exact de jobs Stripe
```

**Option B : Via Script de Test**
```bash
# Dans le dossier functions
cd functions
npx ts-node scripts/testJobSearch.ts
```

Ce script va :
- ✓ Compter tous les jobs
- ✓ Lister toutes les entreprises
- ✓ Chercher spécifiquement les jobs Stripe
- ✓ Tester la logique de recherche
- ✓ Vérifier la structure des données

### 2️⃣ Tester l'API Backend Directement

**Démarrer les émulateurs :**
```bash
firebase emulators:start
```

**Tester l'endpoint (dans un autre terminal) :**
```bash
# Test 1 : Recherche simple "stripe"
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?keyword=stripe"

# Test 2 : Recherche avec limite
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?keyword=stripe&limit=100"

# Test 3 : Sans filtre (tous les jobs)
curl "http://localhost:5001/jobzai-39f7e/us-central1/searchJobs?limit=10"
```

**Vérifier les logs :**
Les nouveaux logs ajoutés afficheront :
```
🔍 Job search request received
   Query params: { keyword: 'stripe', limit: '100' }
   Found X jobs in database
   Filtering by keyword: "stripe" (lowercase: "stripe")
   Total jobs before filter: X
   Sample companies: ['Company A', 'Company B', ...]
   ✓ Match found in company: "Stripe"
   Jobs after keyword filter: Y
   Returning Y filtered jobs
```

### 3️⃣ Vérifier le Frontend

**Ouvrir la Console du Navigateur :**
```
1. Ouvrir DevTools (F12)
2. Onglet Console
3. Taper "stripe" dans la barre de recherche
4. Cliquer "Search"
5. Observer les logs
```

Vous devriez voir :
```
🔍 Searching jobs with URL: http://localhost:5001/.../searchJobs?keyword=stripe
✅ Found X jobs
```

### 4️⃣ Causes Possibles et Solutions

#### Cause 1 : Les jobs Stripe n'existent pas dans les 500 premiers jobs
**Symptôme :** Script de test ne trouve pas de jobs Stripe  
**Solution :** Augmenter la limite ou ajouter un index sur le champ company

```typescript
// Dans functions/src/index.ts, ligne 1875
.limit(Math.min(limit, 500)); // Augmenter à 1000 ou plus
```

#### Cause 2 : Le champ company est vide ou mal formaté
**Symptôme :** Script montre que company = "" ou undefined  
**Solution :** Vérifier et corriger les données dans Firestore

```javascript
// Corriger via script si nécessaire
db.collection('jobs').get().then(snap => {
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (!data.company || data.company.trim() === '') {
      console.log('Job sans company:', doc.id);
    }
  });
});
```

#### Cause 3 : Nom de l'entreprise différent
**Symptôme :** L'entreprise s'appelle "Stripe, Inc." ou "Stripe Inc" au lieu de "Stripe"  
**Solution :** Chercher avec moins de caractères

```bash
# Tester différentes variantes
curl "http://localhost:5001/.../searchJobs?keyword=strip"
curl "http://localhost:5001/.../searchJobs?keyword=str"
```

#### Cause 4 : Jobs trop anciens (pas dans les 500 premiers)
**Symptôme :** Les jobs Stripe existent mais sont trop vieux  
**Solution :** Modifier la requête pour chercher sur tous les jobs

```typescript
// Option 1: Augmenter la limite
.limit(Math.min(limit, 2000))

// Option 2: Chercher directement avec une query Firestore
const snapshot = await db.collection('jobs')
  .where('company', '==', 'Stripe')
  .get();
```

#### Cause 5 : CORS ou erreur réseau
**Symptôme :** La requête échoue côté frontend  
**Solution :** Vérifier les erreurs réseau dans DevTools

```
Network Tab → Voir la requête à searchJobs
- Status 200 ? → OK
- Status 0 ou erreur ? → Problème CORS
- Status 500 ? → Erreur backend
```

### 5️⃣ Solutions Immédiates

#### Solution A : Recherche Plus Large (Recommandée)
Augmenter la limite de recherche pour inclure plus de jobs :

```typescript
// functions/src/index.ts
const limit = parseInt((req.query.limit as string) || '1000', 10);
let jobsQuery = admin.firestore()
  .collection('jobs')
  .orderBy('postedAt', 'desc')
  .limit(Math.min(limit, 2000)); // Augmenter de 500 à 2000
```

#### Solution B : Index sur Company
Créer un index Firestore pour chercher directement par company :

```javascript
// Ajouter dans firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "company", "order": "ASCENDING" },
        { "fieldPath": "postedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### Solution C : Search Combinée
Chercher d'abord par company si le keyword est court :

```typescript
// Si keyword pourrait être un nom d'entreprise
if (keyword && keyword.length <= 20 && !keyword.includes(' ')) {
  // Essayer une recherche directe par company
  const companySnap = await admin.firestore()
    .collection('jobs')
    .where('company', '>=', keyword)
    .where('company', '<=', keyword + '\uf8ff')
    .limit(50)
    .get();
    
  // Ajouter ces résultats
  companySnap.docs.forEach(doc => {
    jobs.push({ id: doc.id, ...doc.data() });
  });
}
```

### 6️⃣ Test de Validation

Après avoir appliqué une solution, tester :

```bash
# 1. Rebuild
cd functions && npm run build

# 2. Redémarrer émulateurs
firebase emulators:start

# 3. Tester l'API
curl "http://localhost:5001/.../searchJobs?keyword=stripe" | jq '.count'
# Devrait retourner > 0

# 4. Tester dans le navigateur
# Aller sur localhost:5173
# Chercher "stripe"
# Vérifier les résultats
```

### 7️⃣ Monitoring en Production

Ajouter des métriques pour suivre les recherches :

```typescript
// Dans searchJobs function
console.log({
  timestamp: new Date().toISOString(),
  keyword,
  location,
  filters: { remote, fullTime, senior },
  totalJobsInDB: snapshot.size,
  resultsReturned: jobs.length,
  executionTime: Date.now() - startTime
});
```

## Checklist Rapide

- [ ] Exécuter le script de test : `npx ts-node scripts/testJobSearch.ts`
- [ ] Vérifier que des jobs Stripe existent dans la base
- [ ] Noter le nombre exact de jobs totaux
- [ ] Tester l'API directement avec curl
- [ ] Vérifier les logs backend (émulateurs)
- [ ] Vérifier les logs frontend (console navigateur)
- [ ] Identifier la cause racine
- [ ] Appliquer la solution appropriée
- [ ] Re-tester pour validation

## Résultats Attendus

✅ **Si les jobs Stripe existent :**
- Le script de test les trouve
- L'API retourne `count > 0`
- Le frontend affiche les résultats

❌ **Si les jobs Stripe n'existent pas :**
- Ajouter des jobs de test
- Vérifier le scraping ATS
- Vérifier la configuration des sources

## Support

Si le problème persiste après ces diagnostics, fournir :
1. Output du script de test
2. Logs backend (émulateurs)
3. Screenshot de la console navigateur
4. Nombre total de jobs dans Firestore
5. Exemple d'un job Stripe (structure JSON)

