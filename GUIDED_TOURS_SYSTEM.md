# 🎯 Système de Guidage Interactif - Documentation Complète

## Vue d'ensemble

Le système de guidage interactif de Jobz.ai permet à l'assistant IA de guider les utilisateurs pas à pas à travers différents processus complexes de la plateforme. Chaque tour est une série d'étapes interactives qui highlight des éléments UI et expliquent comment les utiliser.

## 📋 Tours Disponibles

### 1. **Create CV** (`create-cv`)
**Objectif:** Créer un CV from scratch dans Resume Builder

**Étapes (4):**
1. Cliquer sur "Resume Builder" dans le menu
2. Cliquer sur "New Resume"
3. Entrer un nom pour le CV
4. Choisir un template et créer

**Déclencheurs:**
- "how do I create a CV?"
- "how to make a resume from scratch?"
- "je veux créer un CV"

---

### 2. **Analyze CV** (`analyze-cv`) ⭐ NOUVEAU
**Objectif:** Analyser un CV par rapport à une offre d'emploi

**Étapes (7):**
1. Cliquer sur "Resume Lab" dans le menu
2. Cliquer sur "New Analysis" pour démarrer
3. Choisir comment fournir le CV (upload, saved, ou Resume Builder)
4. Sélectionner le mode d'entrée job (AI extraction, manual, ou saved jobs)
5. Entrer les détails du job (titre, entreprise, description)
6. Cliquer sur "Continue"
7. Cliquer sur "Analyze Resume" pour lancer l'analyse

**Déclencheurs:**
- "how do I analyze my CV?"
- "check my resume score"
- "how to use Resume Lab?"
- "analyze my CV against a job"
- "comment analyser mon CV?"

**Data-tour attributes utilisés:**
- `[data-tour="resume-lab-link"]` - Menu link
- `[data-tour="start-analysis-button"]` - Bouton "New Analysis"
- `[data-tour="cv-upload"]` - Zone d'upload CV
- `[data-tour="job-input-mode"]` - Toggle pour le mode d'entrée job
- `[data-tour="job-description"]` - Champ description de job
- `[data-tour="continue-button"]` - Bouton Continue
- `[data-tour="analyze-button"]` - Bouton Analyze Resume

---

### 3. **Optimize CV** (`optimize-cv`) ⭐ NOUVEAU
**Objectif:** Optimiser un CV pour une offre spécifique

**Étapes (6):**
1. Cliquer sur "CV Optimizer" dans le menu
2. Upload ou sélectionner un CV
3. Coller l'URL de l'offre d'emploi
4. (Optionnel) Entrer les détails manuellement
5. Cliquer sur "Optimize Resume"
6. Voir les résultats et télécharger

**Déclencheurs:**
- "how do I optimize my CV?"
- "how to tailor my resume?"
- "improve CV for job"
- "optimize resume for ATS"
- "comment optimiser mon CV?"

**Data-tour attributes requis:**
- `[data-tour="cv-optimizer-link"]` - Menu link
- `[data-tour="cv-upload-optimizer"]` - Zone d'upload
- `[data-tour="job-url-input"]` - Input URL
- `[data-tour="job-details-manual"]` - Section manual
- `[data-tour="optimize-button"]` - Bouton Optimize
- `[data-tour="optimization-results"]` - Résultats

---

### 4. **Compare CVs** (`compare-cvs`) ⭐ NOUVEAU
**Objectif:** Comparer plusieurs versions de CV

**Étapes (5):**
1. Aller sur "Resume Lab"
2. Activer le "Compare Mode"
3. Sélectionner 2+ analyses à comparer
4. Cliquer sur "Compare"
5. Voir le dashboard de comparaison

**Déclencheurs:**
- "how do I compare CVs?"
- "compare resume versions"
- "which CV is better?"
- "compare my resumes"

**Data-tour attributes requis:**
- `[data-tour="resume-lab-link"]` - Menu link
- `[data-tour="compare-mode-toggle"]` - Toggle compare mode
- `[data-tour="analysis-selector"]` - Sélecteur d'analyses
- `[data-tour="compare-button"]` - Bouton Compare
- `[data-tour="comparison-view"]` - Vue de comparaison

---

### 5. **Track Applications** (`track-applications`)
**Objectif:** Suivre ses candidatures

**Étapes (4):**
1. Cliquer sur "Application Tracking"
2. Cliquer sur "Add"
3. Remplir le formulaire
4. Drag & drop dans le board Kanban

---

### 6. **Prepare Interview** (`prepare-interview`)
**Objectif:** Se préparer à un entretien

**Étapes (3):**
1. Cliquer sur "Mock Interview"
2. Choisir le type d'interview
3. Démarrer la session

---

## 🏗️ Architecture Technique

### Fichiers Principaux

```
src/contexts/TourContext.tsx       # Définitions des tours + logique
src/components/tour/TourOverlay.tsx # UI du tour (spotlight, tooltips)
src/components/assistant/ChatMessages.tsx # Bouton pour lancer les tours
server.cjs                          # Configuration de l'assistant IA
```

### Structure d'un Tour

```typescript
export interface TourStep {
  id: string;                    // Identifiant unique
  target: string;                // CSS selector de l'élément
  title: string;                 // Titre de l'étape
  content: string;               // Description (supporte markdown)
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  action?: 'click' | 'wait' | 'input' | 'navigate';
  navigateTo?: string;           // Pour les étapes de navigation
  waitForElement?: string;       // Attendre qu'un élément apparaisse
  highlightPadding?: number;     // Padding autour du spotlight
  onBeforeStep?: () => void;     // Callback avant l'étape
  onAfterStep?: () => void;      // Callback après l'étape
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}
```

### Flux d'Exécution

1. **Utilisateur demande de l'aide** à l'assistant IA
2. **L'IA détecte** qu'il s'agit d'une question "how-to"
3. **L'IA répond** avec le markup `[[START_TOUR:tour-id]]`
4. **Le frontend détecte** le markup et affiche un bouton "Start Interactive Guide"
5. **L'utilisateur clique** sur le bouton
6. **Le tour démarre**: 
   - Navigation vers la bonne page si nécessaire
   - Affichage du spotlight sur l'élément cible
   - Affichage du tooltip explicatif
   - Actions automatiques si configurées (`click`, etc.)
7. **Navigation entre étapes** avec Next/Previous
8. **Fin du tour** automatique à la dernière étape

---

## 📝 Comment Ajouter un Nouveau Tour

### Étape 1: Ajouter les `data-tour` attributes

Dans votre composant React, ajoutez les attributs sur les éléments clés:

```tsx
<button 
  data-tour="my-button"
  onClick={handleClick}
>
  Click me
</button>
```

### Étape 2: Définir le Tour dans `TourContext.tsx`

```typescript
'my-new-tour': {
  id: 'my-new-tour',
  name: 'My Feature Tour',
  description: 'Learn how to use this feature',
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="my-button"]',
      title: 'Step 1 of 3',
      content: 'Click here to **start the process**.',
      position: 'bottom',
      action: 'click',
      highlightPadding: 8,
    },
    // ... autres étapes
  ],
},
```

### Étape 3: Configurer l'IA dans `server.cjs`

```javascript
**Available tours and their triggers:**
- \`[[START_TOUR:my-new-tour]]\` - Description du tour
  Trigger when: User asks "comment faire X?", "how to do Y?"
```

### Étape 4: Tester

1. Lancer l'application
2. Ouvrir l'assistant IA
3. Demander "comment faire X?"
4. Vérifier que le bouton "Start Interactive Guide" apparaît
5. Cliquer et vérifier que le tour fonctionne correctement

---

## 🎨 Bonnes Pratiques

### 1. **Placement des Tooltips**

- `top` / `bottom`: Pour les boutons et inputs
- `left` / `right`: Pour les menus et sidebars
- `auto`: Laisse le système choisir (recommandé si incertain)

### 2. **Actions**

- `click`: Le système cliquera automatiquement sur l'élément
- `wait`: Attend que l'utilisateur agisse manuellement
- `input`: Suggère à l'utilisateur d'entrer des données
- `navigate`: Change de page automatiquement

### 3. **Contenu des Tooltips**

- Utilisez **markdown** pour le formatting (`**bold**`, `*italic*`)
- Soyez **concis** mais **informatif**
- Mentionnez l'action attendue clairement
- Utilisez des emojis avec parcimonie

### 4. **Nombre d'Étapes**

- **Optimal**: 4-7 étapes
- **Maximum**: 10 étapes
- Si plus, divisez en plusieurs tours

### 5. **Data-tour Naming**

Convention de nommage:
```
[feature]-[element-type]-[action?]

Exemples:
- analyze-button
- cv-upload
- job-input-mode
- start-analysis-button
```

---

## 🐛 Debugging

### Le tour ne démarre pas

1. Vérifier que le `data-tour` attribute existe dans le DOM
2. Vérifier que le selector CSS est correct
3. Ouvrir la console: chercher `🎯 Starting tour: ...`

### L'élément n'est pas trouvé

1. Vérifier que la page est bien chargée
2. Utiliser `waitForElement` si l'élément apparaît après un délai
3. Vérifier les conditions de rendu (state, props)

### Le spotlight est mal positionné

1. Augmenter `highlightPadding` pour plus d'espace
2. Vérifier que l'élément parent n'a pas `position: relative`
3. Essayer une position différente pour le tooltip

---

## 📊 Statistiques Actuelles

- **Tours actifs**: 6
- **Tours récemment ajoutés**: 3 (analyze-cv, optimize-cv, compare-cvs)
- **Étapes totales**: ~30
- **Pages couvertes**: 5 (Resume Builder, Resume Lab, CV Optimizer, Applications, Mock Interview)

---

## 🚀 Prochaines Étapes

### Tours à Créer

1. **Campaign Creation** - Guide pour créer une campagne email
2. **Network Building** - Guide pour construire son réseau
3. **Profile Setup** - Guide pour configurer son profil complet
4. **Interview Analysis** - Guide pour analyser ses performances en mock interview

### Améliorations Futures

- [ ] Ajouter des animations entre étapes
- [ ] Support pour tours multi-pages plus complexes
- [ ] Analytics pour tracker quels tours sont les plus utilisés
- [ ] Tours conditionnels basés sur le niveau de l'utilisateur
- [ ] Support pour tours interrompus et repris plus tard

---

## 📞 Support

Pour toute question sur le système de tours:
- Consulter le code source dans `src/contexts/TourContext.tsx`
- Vérifier les exemples existants
- Tester avec l'assistant IA en mode debug

---

**Dernière mise à jour:** Décembre 2025
**Auteur:** Équipe Jobz.ai





