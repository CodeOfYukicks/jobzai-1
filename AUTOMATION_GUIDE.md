# 🤖 Guide d'Automatisation JobzAI

## ✅ Ce Qui Est En Place

### **11,037 Jobs Enrichis** de **98 Entreprises**
- Stripe (526 jobs), Databricks (721), Cloudflare (522), Warby Parker (710), etc.
- Tags v2.2 avec word boundaries et priority system
- Descriptions propres (HTML nettoyé)

---

## 🚀 Système d'Automatisation Actuel

### **Option 1: Cloud Scheduler (Recommandé - CONFIGURÉ)**

**✅ Cloud Scheduler Créé:**
- **Nom**: `jobzai-daily-auto-fetch`
- **Fréquence**: Tous les jours à 2h00 UTC (3h00 CET)
- **Status**: ENABLED ✅

**📍 Localisation:**
[Cloud Scheduler Console](https://console.cloud.google.com/cloudscheduler?project=jobzai)

**⚠️ Note:** Le scheduler est créé MAIS la fonction HTTP cible n'est pas accessible pour l'instant.

### **Prochaine Action Requise:**

Deux options:

#### **A) Fix la Cloud Function HTTP (À faire):**
1. Vérifier pourquoi `autoFetchAndEnrichJobs` ne se déploie pas
2. Ou migrer vers une architecture différente

#### **B) Utiliser le Script Complet (Solution Immédiate):**

Ajoutez dans votre cron système (macOS/Linux):
```bash
# Ouvrir crontab
crontab -e

# Ajouter cette ligne (exécute à 2h00 UTC tous les jours)
0 2 * * * cd /Users/rouchditouil/jobzai-1-7 && node scripts/autoFetchComplete.cjs >> /tmp/jobzai-fetch.log 2>&1
```

---

## 📋 Le Processus Complet (autoFetchComplete.cjs)

Ce script fait **TOUT automatiquement**:

### **Étape 1: Créer les Tâches**
```bash
node scripts/triggerWorkerSystem.cjs
```
- Crée 97 tâches (une par entreprise)
- Écrit dans Firestore collection `jobFetchTasks`

### **Étape 2: Traiter les Tâches**
```bash
node scripts/processTasksManually.cjs
```
- Traite les 97 tâches en parallèle (5 par batch)
- Fetch les jobs de chaque ATS
- Nettoie HTML → Markdown
- Écrit dans Firestore
- Durée: 10-15 minutes

### **Étape 3: Enrichir**
```bash
node scripts/reEnrichAllJobs.cjs
```
- Enrichit TOUS les jobs (anciens + nouveaux)
- Ajoute tags v2.2:
  - experienceLevels (lead/senior/mid/entry/internship)
  - employmentTypes (full-time/part-time/contract) 
  - workLocations (remote/hybrid/on-site)
  - industries, technologies, skills
- Durée: 15-20 minutes

### **Étape 4: Nettoyer HTML**
```bash
node scripts/decodeHTMLEntities.cjs
```
- Décode les entités HTML (`&nbsp;`, `&lt;`, etc.)
- Convertit HTML résiduel → Markdown
- Durée: 5-10 minutes

**⏱️ Temps Total: 30-45 minutes**

---

## 🎯 Système de Tagging v2.2

### **Améliorations Clés:**

1. **Word Boundaries** - Plus de faux positifs:
   - ❌ "international" ne matche plus "intern"
   - ❌ "biotech" ne matche plus "tech"
   - ❌ "remove" ne matche plus "remote"

2. **Priority System** pour Experience Level:
   - Lead/Executive (plus haut)
   - Senior
   - Mid
   - Entry
   - Internship (plus bas, très strict)
   - Return immédiat sur premier match → pas de conflits

3. **Conflict Resolution** pour Employment Type:
   - Si "Lead" ou "Senior" détecté → RETIRE "internship"
   - Empêche: "Marketing Leader" tagué "internship"

---

## 📊 État de la Base de Données

### **Firestore Collections:**

**`jobs`** (11,037 documents)
- Tous enrichis avec `enrichedVersion: "2.2"`
- Tags précis, descriptions propres

**`jobFetchTasks`** 
- Tâches de fetch (créées puis marquées "completed")

**`autoFetchMetrics`**
- Métriques d'exécution pour monitoring

**`schedulerMetrics`**
- Statistiques des exécutions

---

## 🔧 Troubleshooting

### **Si les Nouveaux Jobs N'Apparaissent Pas:**

1. **Vérifier Firestore:**
   ```
   Collection: jobs
   Filter: company == "Stripe" (ou "Coinbase", "Databricks")
   ```

2. **Rafraîchir le JobBoard:**
   - Ctrl+F5 (hard refresh)
   - Vérifier le nombre total en haut

3. **Vérifier les Tags:**
   - Ouvrir un job dans Firestore
   - Chercher: `experienceLevels`, `enrichedVersion: "2.2"`

### **Si Un Job a des Tags Incorrects:**

Re-lancer l'enrichissement:
```bash
node scripts/reEnrichAllJobs.cjs
```

### **Si des Descriptions ont du HTML:**

Nettoyer:
```bash
node scripts/decodeHTMLEntities.cjs
```

---

## 📈 Scaling (Plus d'Entreprises)

### **Pour Ajouter Plus d'Entreprises:**

1. **Modifier** `functions/src/config.ts`:
   ```typescript
   export const ATS_SOURCES: ATSProviderConfig[] = [
       // Ajouter ici
       { provider: 'greenhouse', company: 'new-company' },
   ];
   ```

2. **Tester** le slug:
   ```bash
   curl https://boards-api.greenhouse.io/v1/boards/new-company/jobs
   ```

3. **Déployer** (si vous voulez utiliser les fonctions):
   ```bash
   cd functions && npm run build && cd .. && firebase deploy --only functions
   ```

4. **Ou** juste relancer le script (il utilise la config automatiquement):
   ```bash
   node scripts/autoFetchComplete.cjs
   ```

---

## 🎯 Résumé: Votre Système Final

| Aspect | Status | Details |
|--------|--------|---------|
| **Entreprises** | ✅ 98 | Greenhouse (68), SmartRecruiters (20), Ashby (8), etc. |
| **Jobs Totaux** | ✅ 11,037 | Augmentation de ~3,800 → 11,037 (x2.9) |
| **Tagging** | ✅ v2.2 | Word boundaries, priority system, conflict resolution |
| **Descriptions** | ✅ Clean | HTML nettoyé → Markdown |
| **Automation** | ⚠️ Semi-auto | Cloud Scheduler créé, exécution via scripts |

### **Pour Récupérer de Nouveaux Jobs:**
```bash
node scripts/autoFetchComplete.cjs
```

### **Configuration Scheduler:**
- Voir: [Cloud Scheduler Console](https://console.cloud.google.com/cloudscheduler?project=jobzai)
- Scheduler `jobzai-daily-auto-fetch` est créé et actif
- Si la fonction HTTP ne marche pas, utilisez le cron local (voir ci-dessus)

---

**Tout est prêt! Vos utilisateurs ont accès à 11,000+ jobs de qualité avec des tags précis!** 🎉

