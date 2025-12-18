# 🔧 Fix: Tour ne montre pas le modal à l'étape 3

## Problème

L'étape 3 du tour "Analyze CV" ne montrait pas le modal qui s'ouvre après avoir cliqué sur "New Analysis" à l'étape 2.

**Cause racine:**
- Le tour passait directement de l'étape 2 (click sur "New Analysis") à l'étape 3 (éléments DANS le modal)
- Pas d'étape intermédiaire pour attendre que le modal s'ouvre
- Pas d'attribut `data-tour` sur le modal lui-même
- Le tour ne pouvait donc pas cibler et attendre le modal

## Solution

### 1. Ajout de `data-tour="analysis-modal"` sur le modal

**Fichier:** `src/pages/CVAnalysisPage.tsx`

```tsx
<motion.div
  data-tour="analysis-modal"  // ← AJOUTÉ
  initial={{ opacity: 0, scale: 0.96, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: 20 }}
  transition={{ type: "spring", damping: 25, stiffness: 300 }}
  onClick={(e) => e.stopPropagation()}
  className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-2xl..."
>
```

Cet attribut permet au tour de:
- ✅ Détecter le modal
- ✅ Attendre qu'il soit complètement chargé
- ✅ Le mettre en surbrillance (spotlight)

### 2. Ajout d'une étape intermédiaire (Étape 3)

**Fichier:** `src/contexts/TourContext.tsx`

**AVANT (6 étapes):**
```
1. Menu → Resume Lab
2. Click "New Analysis"
3. Sélection CV (dans le modal) ← Ne se voyait pas!
4. Mode job
5. Continue
6. Analyze
```

**APRÈS (7 étapes):**
```
1. Menu → Resume Lab
2. Click "New Analysis"
3. Présentation du modal ← NOUVELLE ÉTAPE!
4. Sélection CV (dans le modal)
5. Mode job
6. Continue
7. Analyze
```

**Code de la nouvelle étape 3:**
```typescript
{
  id: 'step-3-modal-intro',
  target: '[data-tour="analysis-modal"]',
  title: 'Step 3 of 7',
  content: 'Perfect! This modal will guide you through **2 simple steps**: first upload your CV, then provide the job details. Let\'s start!',
  position: 'auto',
  action: 'wait',
  waitForElement: '[data-tour="analysis-modal"]',
  highlightPadding: 20,
}
```

**Pourquoi ça marche:**
- `target: '[data-tour="analysis-modal"]'` → Cible le modal entier
- `waitForElement` → Attend que le modal soit dans le DOM
- `position: 'auto'` → Laisse le système choisir la meilleure position
- `highlightPadding: 20` → Grand padding pour bien voir le modal
- `action: 'wait'` → L'utilisateur contrôle quand passer à l'étape suivante

### 3. Mise à jour de server.cjs

Le prompt de l'IA a été mis à jour pour refléter les 7 étapes:

```javascript
"I'll guide you through analyzing your CV against a job posting! This is a 7-step interactive process where you'll:
1. Navigate to Resume Lab
2. Start a new analysis (opens a modal)
3. See the analysis modal  ← AJOUTÉ
4. Select your CV (upload, saved, or from Resume Builder)
5. Provide job details (AI extraction, manual, or saved jobs)
6. Click Continue to review
7. Launch the analysis and get your results!"
```

## Résultat

### Avant ❌
```
Étape 2: Click "New Analysis" → Modal s'ouvre
Étape 3: Essaie de montrer [data-tour="cv-upload"] → Pas visible car modal pas détecté
```

### Après ✅
```
Étape 2: Click "New Analysis" → Modal s'ouvre
Étape 3: Attend et montre [data-tour="analysis-modal"] → Modal entier visible!
Étape 4: Montre [data-tour="cv-upload"] → Zone CV visible dans le modal
```

## Flow Utilisateur

```
1. User demande: "Comment analyser mon CV?"
   ↓
2. IA propose le tour avec bouton "Start Interactive Guide"
   ↓
3. Click sur Resume Lab (Étape 1)
   ↓
4. Click sur "New Analysis" (Étape 2)
   ↓
5. Modal s'ouvre → Étape 3 le met en surbrillance
   ↓ User clique "Next"
6. Zone CV upload mise en surbrillance (Étape 4)
   ↓ User clique "Next"
7. Modes de job mis en surbrillance (Étape 5)
   ↓ User remplit les infos et clique "Next"
8. Bouton Continue mis en surbrillance (Étape 6)
   ↓ User clique Continue et "Next"
9. Bouton Analyze mis en surbrillance (Étape 7)
   ↓
10. Done! 🎉
```

## Avantages de cette Approche

✅ **Transition douce:** Le modal est introduit avant de montrer son contenu
✅ **Moins de confusion:** L'utilisateur voit d'abord le modal entier, puis les détails
✅ **Meilleure pédagogie:** "Voici le modal → Voici ce qu'il contient"
✅ **Plus robuste:** Attend explicitement que le modal soit chargé
✅ **Meilleure UX:** L'utilisateur comprend où il est

## Test

Pour vérifier que le fix fonctionne:

```bash
1. Lancer l'app
2. Ouvrir l'assistant IA
3. Demander: "Comment analyser mon CV?"
4. Cliquer sur "Start Interactive Guide"
5. Suivre jusqu'à l'étape 3
6. ✅ Vérifier que le modal ENTIER est mis en surbrillance
7. Cliquer "Next"
8. ✅ Vérifier que la zone CV upload est visible dans le modal
```

## Fichiers Modifiés

1. ✅ `src/pages/CVAnalysisPage.tsx`
   - Ajout de `data-tour="analysis-modal"`

2. ✅ `src/contexts/TourContext.tsx`
   - Ajout de l'étape 3 (modal intro)
   - Renumérotation des étapes (6 → 7)

3. ✅ `server.cjs`
   - Mise à jour du prompt (6 → 7 étapes)

---

**Date:** Décembre 2025  
**Statut:** ✅ Corrigé et prêt à tester







