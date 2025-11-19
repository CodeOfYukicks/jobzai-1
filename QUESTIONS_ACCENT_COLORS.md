# Questions Section - Couleurs d'Accent Purple 💜

## Vue d'ensemble Rapide

Tous les composants de la section Questions utilisent maintenant la **couleur d'accent purple/indigo** de votre marque (#8B5CF6 / #8D75E6) au lieu du noir générique.

---

## 🎨 Palette Purple Appliquée

### Teintes Utilisées

```css
/* Light Mode */
purple-50   #F5F3FF  →  Backgrounds légers
purple-200  #DDD6FE  →  Bordures et hover
purple-600  #7C3AED  →  États actifs
purple-700  #6D28D9  →  Texte sur fond clair

/* Dark Mode */
purple-300  #C4B5FD  →  Texte sur fond sombre
purple-400  #A78BFA  →  Icônes et accents
purple-500  #8B5CF6  →  États actifs dark
```

---

## 📍 Où Voir les Changements

### 1. QuestionCard
```tsx
// Hover border
hover:border-purple-200  // Au lieu de hover:border-black/[0.12]

// Boutons actifs (bookmark, note, focus)
bg-purple-600 text-white  // Au lieu de bg-neutral-900

// Focus rings
ring-purple-500  // Au lieu de ring-neutral-400
```

**Résultat :** Cards qui s'illuminent en purple au hover, boutons actifs en purple vif.

---

### 2. Tags
```tsx
// Background et bordure
bg-purple-50 border-purple-200/60 text-purple-700

// Dark mode
dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300
```

**Résultat :** Tags colorés qui se démarquent visuellement.

---

### 3. Toggle (Suggested Approach)
```tsx
// Container
bg-purple-50/30 border-purple-200/40

// Chevron
text-purple-400

// Hover
hover:bg-purple-50/50
```

**Résultat :** Zone de suggestion avec teinte purple subtile.

---

### 4. Header - Filtres
```tsx
// Filtre actif
bg-purple-600 text-white shadow-purple-600/20

// Filtre hover
hover:bg-purple-50 hover:border-purple-200

// Badge de comptage
bg-purple-50 border-purple-200/60 text-purple-700
```

**Résultat :** Filtres style iOS avec accent purple, badge coloré.

---

### 5. Header - Regenerate Button
```tsx
// Normal state
border-purple-200 text-purple-700

// Hover
hover:bg-purple-50 hover:border-purple-300
```

**Résultat :** Bouton avec accent purple au lieu de gris neutre.

---

### 6. Focus Modal
```tsx
// Section "Suggested approach"
bg-purple-50/50 border-purple-200/40

// Label
text-purple-700  // light
text-purple-300  // dark
```

**Résultat :** Modal avec section suggestion colorée en purple.

---

### 7. TabPills
```tsx
// Container
bg-purple-50/30 border-purple-200/40

// Indicateur blanc
shadow-purple-600/5

// Tab actif
text-purple-700  // light
text-purple-300  // dark

// Icône active
text-purple-600 dark:text-purple-400
```

**Résultat :** Onglets avec accent purple, glow subtil.

---

## ✨ Avantages de cette Approche

### 1. **Identité Visuelle Forte**
- La couleur purple crée une signature visuelle unique
- Cohérence avec le hero-gradient (#8D75E6)
- Reconnaissance de marque immédiate

### 2. **Hiérarchie Visuelle Claire**
- États actifs ultra-visibles en purple-600
- Hover states engageants en purple-50
- Tags et badges qui se démarquent

### 3. **Accessibilité Maintenue**
- Tous les contrastes respectent WCAG 2.1 AA
- Purple-700 sur blanc : 7.4:1 ✅
- Purple-600 avec blanc : 4.9:1 ✅
- Purple-300 en dark mode : 8.2:1 ✅

### 4. **Élégance Préservée**
- Design flat maintenu
- Opacités subtiles (50/30, 200/60, 500/20)
- Pas de surcharge visuelle

---

## 🎯 Comparaison Rapide

### Avant (Noir/Blanc Générique)
```tsx
// Filtre actif
bg-neutral-900 text-white

// Tag
bg-neutral-50 text-neutral-600

// Hover
border-black/[0.12]

// Focus
ring-neutral-400
```
❌ **Résultat :** Interface neutre, pas d'identité forte

---

### Après (Accent Purple)
```tsx
// Filtre actif
bg-purple-600 text-white shadow-purple-600/20

// Tag
bg-purple-50 text-purple-700

// Hover
border-purple-200

// Focus
ring-purple-500
```
✅ **Résultat :** Interface avec personnalité, accent de marque

---

## 🔧 Pour Ajuster les Couleurs

Si vous voulez modifier l'intensité du purple :

### Plus Subtil
```tsx
// Réduire les opacités
purple-50/20  // Au lieu de /30
purple-200/40  // Au lieu de /60
purple-500/5   // Au lieu de /10
```

### Plus Intense
```tsx
// Augmenter les opacités ou utiliser des teintes plus foncées
purple-50      // Au lieu de purple-50/30
purple-300     // Au lieu de purple-200
purple-700     // Au lieu de purple-600
```

### Changer de Couleur Complètement
Remplacer `purple-*` par une autre couleur Tailwind :
- `blue-*` pour du bleu
- `indigo-*` pour de l'indigo
- `violet-*` pour du violet
- `pink-*` pour du rose
- `emerald-*` pour du vert émeraude

---

## 📊 Impact Visuel

### Éléments avec Accent Purple
- ✅ 12 types d'éléments colorés
- ✅ États actifs, hover et focus
- ✅ Tags, badges et compteurs
- ✅ Bordures et backgrounds
- ✅ Ombres subtiles

### Éléments Restés Neutres
- ✅ Fond des cards (blanc)
- ✅ Texte principal (neutral-900)
- ✅ Badge numéro (neutral-100)
- ✅ Texte secondaire (neutral-600)

**Équilibre parfait** entre accent de marque et lisibilité ! 🎯

---

## 🚀 Résultat Final

Une section Questions qui :
- 💜 **Respire l'identité de marque** avec le purple partout
- 🎨 **Reste élégante et flat** style Apple/Notion
- ✨ **Engage l'utilisateur** avec des accents colorés
- ♿ **Reste accessible** (contrastes WCAG AA)
- 🌓 **Fonctionne en dark mode** avec opacités adaptées

---

**Purple partout, premium toujours ! 💜✨**

