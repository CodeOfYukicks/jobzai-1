# Correctifs appliqués - Sélecteur d'IA

## Problèmes résolus

### 1. ❌ React is not defined
**Problème** : `React.cloneElement()` utilisé sans importer React
**Solution** : Ajouté `React` à l'import
```typescript
import React, { useState, useRef, ... } from 'react';
```

### 2. ❌ Missing or insufficient permissions (Firestore)
**Problème** : Tentative d'accès à une sous-collection `users/{userId}/settings/assistant` sans permissions
**Solution** : Utilisation du document utilisateur principal `users/{userId}` avec le champ `assistantAIProvider`

#### Avant (ne fonctionnait pas)
```typescript
// Lecture
const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'assistant');
const settingsDoc = await getDoc(settingsRef);

// Écriture
await setDoc(settingsRef, { aiProvider: provider }, { merge: true });
```

#### Après (fonctionne)
```typescript
// Lecture
const userRef = doc(db, 'users', currentUser.uid);
const userDoc = await getDoc(userRef);
const preference = userDoc.data()?.assistantAIProvider;

// Écriture
await updateDoc(userRef, { assistantAIProvider: provider });
```

## Structure Firestore mise à jour

### Document utilisateur
```
users/{userId}
  - name: string
  - email: string
  - plan: string
  - credits: number
  - assistantAIProvider: "openai" | "anthropic" | "gemini"  ← NOUVEAU
  - ... autres champs
```

## Avantages de cette approche

1. **Pas de règles Firestore supplémentaires** : Utilise les permissions existantes du document utilisateur
2. **Plus simple** : Un seul document au lieu d'une sous-collection
3. **Plus rapide** : Une seule requête au lieu de deux
4. **Cohérent** : Toutes les préférences utilisateur au même endroit

## Vérification

Pour vérifier que tout fonctionne :

1. Ouvrir l'assistant
2. Cliquer sur le bouton du sélecteur d'IA
3. Sélectionner un modèle différent
4. Vérifier dans Firestore Console :
   - Collection : `users`
   - Document : `{votre userId}`
   - Chercher le champ : `assistantAIProvider`
   - Valeur attendue : `"openai"`, `"anthropic"`, ou `"gemini"`

## Prochaines étapes

Maintenant que les erreurs sont corrigées, vous pouvez :

1. **Configurer les clés API** dans Firestore :
   - `settings/openai` → `apiKey: "sk-..."`
   - `settings/anthropic` → `apiKey: "sk-ant-..."`
   - `settings/gemini` → `apiKey: "AIza..."`

2. **Tester les 3 providers** :
   - Sélectionner chaque modèle
   - Envoyer des messages
   - Vérifier que le streaming fonctionne
   - Tester avec des mentions @ pour le contexte

3. **Monitoring** :
   - Surveiller les logs du serveur pour voir quel provider est utilisé
   - Vérifier les temps de réponse
   - Comparer la qualité des réponses

