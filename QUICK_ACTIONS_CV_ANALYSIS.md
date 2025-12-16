# Quick Actions Spécifiques - Pages CV Analysis

## 📋 Vue d'ensemble

Ajout de quick actions contextuelles et spécifiques pour chaque page du workflow CV Analysis. Ces actions apparaissent dans l'assistant IA et proposent des prompts pertinents selon la page.

## ✅ Quick Actions Implémentées

### 1. Page `/cv-analysis` - Vue d'ensemble des analyses

**Nom de la page:** CV Analysis  
**Description:** Overview of all your CV analyses and performance trends

**Quick Actions:**

1. **Compare my analyses**
   - Prompt: `"Compare my CV analyses and show me which roles I match best with"`
   - Utilité: Identifier les meilleures opportunités basées sur les scores historiques

2. **Identify patterns**
   - Prompt: `"What patterns do you see across all my CV analyses? What should I improve?"`
   - Utilité: Découvrir les faiblesses récurrentes à travers toutes les analyses

3. **Which analysis to prioritize?**
   - Prompt: `"Based on my scores, which job applications should I prioritize?"`
   - Utilité: Prioriser les candidatures avec le meilleur matching

4. **Industry trends**
   - Prompt: `"Show me how I perform across different industries based on my analyses"`
   - Utilité: Comprendre dans quels secteurs le profil performe le mieux

---

### 2. Page `/ats-analysis/:id` - Détail d'une analyse

**Nom de la page:** CV Analysis Detail  
**Description:** Detailed view of a specific CV analysis with recommendations

**Quick Actions:**

1. **Missing skills**
   - Prompt: `"What skills am I missing for this specific job? List them all."`
   - Utilité: Obtenir la liste complète des compétences manquantes

2. **Top recommendations**
   - Prompt: `"What are the top priority recommendations I should implement for this analysis?"`
   - Utilité: Identifier les actions prioritaires pour améliorer le score

3. **Explain my scores**
   - Prompt: `"Explain my category scores and how I can improve each one"`
   - Utilité: Comprendre le détail des scores par catégorie

4. **Compare to my other analyses**
   - Prompt: `"How does this analysis compare to my other CV analyses?"`
   - Utilité: Contextualiser la performance de cette analyse

---

### 3. Page `/ats-analysis/:id/cv-editor` - Éditeur CV

**Nom de la page:** CV Editor  
**Description:** Edit and tailor your CV for a specific job

**Quick Actions:**

1. **Add keywords**
   - Prompt: `"What keywords should I add to my CV for this specific job?"`
   - Utilité: Obtenir les mots-clés spécifiques du job à intégrer

2. **Improve my summary**
   - Prompt: `"Help me improve my professional summary for this job"`
   - Utilité: Adapter le résumé professionnel au poste ciblé

3. **Tailor my experience**
   - Prompt: `"How should I tailor my work experience section for this job?"`
   - Utilité: Adapter les expériences pour matcher le job

4. **Address gaps**
   - Prompt: `"How can I address the identified gaps in my CV for this role?"`
   - Utilité: Stratégies pour combler les lacunes identifiées

---

## 🎯 Comment ça fonctionne

### Architecture

```
usePageContext hook
    ↓
Détecte la route actuelle
    ↓
Matche avec PAGE_CONTEXTS ou logique spéciale
    ↓
Retourne pageName + quickActions
    ↓
AIAssistantModal affiche les quick actions
    ↓
User clique → Envoie le prompt à l'assistant
```

### Logique de Matching

1. **Exact match**: Vérifie d'abord si la route existe exactement dans `PAGE_CONTEXTS`
2. **CV Editor detection**: Si l'URL contient `/cv-editor`, applique les actions CV Editor
3. **Prefix match**: Sinon, vérifie si l'URL commence par une route connue (ex: `/ats-analysis`)
4. **Default**: Si aucun match, utilise les actions par défaut

### Code Implementation

**Fichier modifié:** `src/hooks/usePageContext.ts`

**Changements:**
- Ajout de `'/cv-analysis'` dans `PAGE_CONTEXTS` avec 4 quick actions
- Ajout de `'/ats-analysis'` dans `PAGE_CONTEXTS` avec 4 quick actions
- Logique spéciale dans `usePageContext()` pour détecter `/cv-editor`
- Logique spéciale dans `getQuickActionsForPage()` pour détecter `/cv-editor`

## 🎨 UI/UX

### Affichage dans l'Assistant

Quand l'utilisateur ouvre l'assistant sur une de ces pages, il voit :

```
┌─────────────────────────────────────┐
│  Can I help you with anything?      │
│  Ready to assist with anything      │
│  you need. Let's get started!       │
│                                     │
│  [Compare my analyses]              │
│  [Identify patterns]                │
│  [Which analysis to prioritize?]    │
│  [Industry trends]                  │
│                                     │
│  + Add Command                      │
└─────────────────────────────────────┘
```

Au clic, le prompt est automatiquement envoyé à l'assistant.

## 📊 Exemples de Réponses Attendues

### Sur `/cv-analysis`

**User clique:** "Compare my analyses"

**Réponse attendue de l'assistant:**
```
You've analyzed 12 positions. Here's your performance breakdown:

🏆 Best Matches:
- Google SWE (Score: 87%)
- Stripe Senior Engineer (Score: 84%)
- Meta Staff Engineer (Score: 82%)

📊 Industry Performance:
- Tech/Software: Average 78%
- Finance: Average 62%
- Consulting: Average 58%

💡 Insight: You're scoring 16% higher in tech roles. Focus your 
applications on software engineering positions at tech companies!
```

### Sur `/ats-analysis/:id`

**User clique:** "Missing skills"

**Réponse attendue:**
```
For this Google Senior SWE position, you're missing 8 key skills:

🔴 Critical (mentioned 3+ times in JD):
1. Kubernetes - Container orchestration
2. Terraform - Infrastructure as code
3. GraphQL - API design

🟡 Important:
4. System Design (distributed systems)
5. Microservices architecture
6. CI/CD pipelines

🟢 Nice to have:
7. gRPC
8. Prometheus monitoring

Quick win: Add Kubernetes to your skills section and mention it 
in your cloud infrastructure projects!
```

### Sur `/cv-editor`

**User clique:** "Add keywords"

**Réponse attendue:**
```
For this Amazon role, add these keywords strategically:

📝 Professional Summary:
- Add: "distributed systems", "scalability", "high availability"

💼 Experience Section (Google role):
- Add: "designed scalable architectures"
- Add: "built distributed systems serving 10M+ users"

🔧 Skills Section:
- Move to top: AWS, Kubernetes, Microservices
- Add if missing: DynamoDB, Lambda, API Gateway

These keywords appear 15+ times in the job description and will 
boost your ATS score significantly!
```

## ✅ Tests de Validation

### Test 1: Page CV Analysis List
1. ✅ Naviguer vers `/cv-analysis`
2. ✅ Ouvrir l'assistant
3. ✅ Vérifier que 4 quick actions apparaissent
4. ✅ Cliquer sur "Compare my analyses"
5. ✅ Vérifier que l'assistant compare les analyses avec données spécifiques

### Test 2: Page Analysis Detail
1. ✅ Naviguer vers `/ats-analysis/{some-id}`
2. ✅ Ouvrir l'assistant
3. ✅ Vérifier que 4 quick actions différentes apparaissent
4. ✅ Cliquer sur "Missing skills"
5. ✅ Vérifier que l'assistant liste les compétences manquantes spécifiques

### Test 3: Page CV Editor
1. ✅ Naviguer vers `/ats-analysis/{id}/cv-editor`
2. ✅ Ouvrir l'assistant
3. ✅ Vérifier que 4 quick actions de l'éditeur apparaissent
4. ✅ Cliquer sur "Add keywords"
5. ✅ Vérifier que l'assistant suggère des keywords du job context

## 🚀 Bénéfices

1. **Découvrabilité**: Les utilisateurs découvrent ce que l'assistant peut faire
2. **Rapidité**: Un clic pour lancer une action pertinente
3. **Contexte**: Actions adaptées à chaque page du workflow
4. **Guidage**: Les prompts suggérés montrent comment formuler les questions
5. **Productivité**: Moins de friction pour obtenir des insights

## 📝 Notes d'Implémentation

- ✅ Aucune erreur de linting
- ✅ Compatible avec la structure existante
- ✅ Logique de fallback si route non trouvée
- ✅ Gère les routes dynamiques avec IDs
- ✅ Réutilise les PAGE_CONTEXTS existants
- ✅ Extension facile pour d'autres pages

## 🎉 Résultat Final

L'utilisateur bénéficie maintenant de **12 quick actions spécifiques** réparties sur 3 pages clés du workflow CV Analysis, chacune optimisée pour le contexte de la page et les données disponibles à l'assistant.






