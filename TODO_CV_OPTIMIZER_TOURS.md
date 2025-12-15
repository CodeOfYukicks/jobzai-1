# 📝 TODO: Ajouter les data-tour attributes à CV Optimizer

## Contexte

Le tour guidé `optimize-cv` a été créé dans `TourContext.tsx` mais les attributs `data-tour` correspondants doivent être ajoutés dans `CVOptimizerPage.tsx`.

## Data-tour attributes à ajouter

### 1. Menu Link (Sidebar)
**Fichier:** `src/components/SidebarLink.tsx` ou `src/components/Sidebar.tsx`  
**Élément:** Lien vers CV Optimizer  
**Attribut:** `data-tour="cv-optimizer-link"`

```tsx
<Link 
  to="/cv-optimizer" 
  data-tour="cv-optimizer-link"
  className="..."
>
  CV Optimizer
</Link>
```

---

### 2. CV Upload Zone
**Fichier:** `src/pages/CVOptimizerPage.tsx`  
**Ligne approximative:** ~900-1000  
**Élément:** Zone de drag & drop pour upload CV  
**Attribut:** `data-tour="cv-upload-optimizer"`

Chercher quelque chose comme:
```tsx
<div
  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
  onClick={...}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
```

Ajouter:
```tsx
<div
  data-tour="cv-upload-optimizer"
  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
  onClick={...}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
```

---

### 3. Job URL Input
**Fichier:** `src/pages/CVOptimizerPage.tsx`  
**Ligne approximative:** ~1200-1300  
**Élément:** Input pour coller l'URL du job  
**Attribut:** `data-tour="job-url-input"`

Chercher:
```tsx
<input
  type="url"
  value={formData.jobUrl}
  onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
  placeholder="https://linkedin.com/jobs/view/..."
/>
```

Ajouter `data-tour="job-url-input"` sur le conteneur parent ou l'input directement.

---

### 4. Manual Job Entry Section
**Fichier:** `src/pages/CVOptimizerPage.tsx`  
**Élément:** Section pour entrer manuellement job title, company, description  
**Attribut:** `data-tour="job-details-manual"`

Chercher le toggle entre "AI" et "Manual" mode, puis ajouter l'attribut sur la section manual:

```tsx
{jobInputMode === 'manual' && (
  <div data-tour="job-details-manual" className="space-y-3">
    {/* Job Title, Company, Description inputs */}
  </div>
)}
```

---

### 5. Optimize Button
**Fichier:** `src/pages/CVOptimizerPage.tsx`  
**Ligne approximative:** Footer du modal, ~1500-1600  
**Élément:** Bouton "Optimize Resume" ou "Generate Optimized CV"  
**Attribut:** `data-tour="optimize-button"`

Chercher:
```tsx
<button
  onClick={handleOptimize}
  className="...bg-gradient-to-r from-[#635BFF]..."
>
  <Sparkles className="w-4 h-4" />
  <span>Optimize Resume</span>
</button>
```

Ajouter:
```tsx
<button
  data-tour="optimize-button"
  onClick={handleOptimize}
  className="...bg-gradient-to-r from-[#635BFF]..."
>
  <Sparkles className="w-4 h-4" />
  <span>Optimize Resume</span>
</button>
```

---

### 6. Optimization Results View
**Fichier:** `src/pages/CVOptimizerPage.tsx`  
**Élément:** Section qui affiche le CV optimisé avec score, keywords, download button  
**Attribut:** `data-tour="optimization-results"`

Chercher la section qui affiche les résultats après optimisation:
```tsx
{selectedOptimizedCV && (
  <div data-tour="optimization-results" className="...">
    {/* Results content */}
  </div>
)}
```

---

## Commandes pour trouver les éléments

```bash
# Chercher la zone d'upload
grep -n "drag.*drop\|Upload.*CV" src/pages/CVOptimizerPage.tsx

# Chercher le job URL input
grep -n "jobUrl\|job.*url.*input" src/pages/CVOptimizerPage.tsx

# Chercher le bouton optimize
grep -n "Optimize.*Resume\|handleOptimize" src/pages/CVOptimizerPage.tsx

# Chercher le mode toggle
grep -n "jobInputMode\|manual.*ai" src/pages/CVOptimizerPage.tsx
```

---

## Étapes de vérification

1. [ ] Ajouter tous les attributs `data-tour` listés ci-dessus
2. [ ] Vérifier que les selectors dans `TourContext.tsx` correspondent aux attributs ajoutés
3. [ ] Tester le tour en demandant à l'assistant: "Comment optimiser mon CV?"
4. [ ] Vérifier que chaque étape highlight le bon élément
5. [ ] Corriger les positions des tooltips si nécessaire
6. [ ] Commit les changements

---

## Notes

- Les attributs `data-tour` n'affectent pas le styling ni le comportement
- Ils servent uniquement de selectors pour le système de tours
- Convention: `kebab-case` pour tous les attributs
- Préfixer avec le nom de la feature si ambiguïté (ex: `cv-upload-optimizer` vs `cv-upload`)

---

**Statut:** ⏳ En attente  
**Priorité:** Medium  
**Temps estimé:** 15-20 minutes



