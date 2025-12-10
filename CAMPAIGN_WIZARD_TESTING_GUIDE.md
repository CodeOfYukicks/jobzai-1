# Campaign Wizard - Testing & Validation Guide

## ✅ Implémentation Complète

Tous les composants et endpoints ont été implémentés avec succès:

### Frontend
- ✅ `src/lib/designSystem.ts` - Système de couleurs cohérent
- ✅ `src/components/campaigns/steps/EmailGenerationModeStep.tsx` - Sélection du mode
- ✅ `src/components/campaigns/steps/TemplateGenerationStep.tsx` - Génération de templates IA
- ✅ `src/components/campaigns/steps/ABTestingStep.tsx` - Configuration A/B testing
- ✅ `src/components/campaigns/NewCampaignModal.tsx` - Modal refondé avec navigation conditionnelle
- ✅ `src/pages/CampaignsAutoPage.tsx` - Couleurs vertes cohérentes

### Backend
- ✅ `server.cjs` - Endpoint `/api/campaigns/generate-templates`
- ✅ `server.cjs` - Endpoint `/api/campaigns/:id/generate-emails` mis à jour pour 3 modes

## 🧪 Plan de Test

### Test 1: Mode Template
1. Ouvrir la page Campaigns
2. Cliquer sur "New Campaign" (bouton vert)
3. Compléter l'étape 1 (Targeting)
4. Compléter l'étape 2 (Gmail OAuth)
5. Compléter l'étape 3 (Email Preferences)
6. **Étape 4: Sélectionner "AI Template"**
7. **Étape 5: Vérifier que 2-3 templates sont générés**
8. Sélectionner un template
9. Cliquer sur "Edit Template" pour personnaliser
10. Sauvegarder et lancer la campagne
11. Vérifier que les emails utilisent le template avec merge fields

**Résultat attendu**: Les emails générés remplacent `{{firstName}}`, `{{company}}`, etc. avec les vraies valeurs

### Test 2: Mode A/B Testing
1. Créer une nouvelle campagne
2. Compléter les étapes 1-3
3. **Étape 4: Sélectionner "A/B Testing"**
4. **Étape 5: Créer des variantes**
   - Ajouter 3 hooks différents
   - Ajouter 2 bodies différents
   - Ajouter 2 CTAs différents
5. Utiliser le preview pour voir les combinaisons
6. Lancer la campagne
7. Vérifier que chaque recipient reçoit une combinaison aléatoire
8. Vérifier que `variantConfig` est sauvegardé dans Firestore

**Résultat attendu**: Chaque contact reçoit une combinaison unique (hook + body + cta)

### Test 3: Mode Auto-Generate
1. Créer une nouvelle campagne
2. Compléter les étapes 1-3
3. **Étape 4: Sélectionner "Auto-Generate"**
4. Lancer directement (pas d'étape 5)
5. Cliquer sur "Generate Emails"
6. Vérifier que chaque email est unique et personnalisé

**Résultat attendu**: Emails complètement uniques générés par IA pour chaque contact

### Test 4: Design Cohérence
1. Vérifier que le bouton "New Campaign" est vert (`#b7e219`)
2. Vérifier que la progress bar du modal est verte
3. Vérifier que le bouton "Launch Campaign" est vert
4. Vérifier les dots du stepper sont verts quand actifs
5. Vérifier le dark mode avec les teintes de gris (`#0a0a0a`, `#1a1a1a`, `#2b2a2c`)

**Résultat attendu**: Design cohérent avec la palette verte/grise

## 🔍 Points de Validation

### Firestore Structure
Vérifier que les documents campaigns contiennent:

```javascript
{
  emailGenerationMode: 'template' | 'abtest' | 'auto',
  
  // Si mode template
  template: {
    subject: "...",
    body: "..."
  },
  
  // Si mode A/B testing
  abTestVariants: {
    hooks: ["...", "..."],
    bodies: ["...", "..."],
    ctas: ["...", "..."]
  }
}
```

### Recipients avec A/B Testing
```javascript
{
  variantId: "0-1-0",
  variantConfig: {
    hookIndex: 0,
    bodyIndex: 1,
    ctaIndex: 0
  }
}
```

## 🚀 Démarrage

### Frontend
```bash
npm run dev
```

### Backend
```bash
node server.cjs
```

Ou si déjà en cours d'exécution, redémarrer pour charger les nouveaux endpoints.

## 📊 Métriques de Succès

- [ ] Les 3 modes de génération fonctionnent
- [ ] Les templates IA sont générés correctement
- [ ] Les merge fields sont remplacés
- [ ] L'A/B testing distribue aléatoirement les variantes
- [ ] Le design est cohérent (vert accent)
- [ ] La navigation conditionnelle fonctionne
- [ ] Pas d'erreurs dans la console
- [ ] Les données sont correctement sauvegardées dans Firestore

## 🐛 Debugging

### Problème: Templates non générés
- Vérifier que l'API OpenAI est configurée
- Vérifier les logs du serveur: `📝 Generating templates`
- Vérifier la réponse de l'endpoint dans Network tab

### Problème: Merge fields non remplacés
- Vérifier que le mode est bien 'template' dans Firestore
- Vérifier que `campaign.template` existe
- Vérifier les logs: `Using generation mode: template`

### Problème: A/B testing ne distribue pas
- Vérifier que `campaign.abTestVariants` existe
- Vérifier que les arrays ne sont pas vides
- Vérifier `variantConfig` dans les recipients

## 📝 Notes Importantes

1. **OpenAI API Key**: Doit être configurée dans Firestore (`settings/openai`) ou en variable d'environnement
2. **Gmail OAuth**: Doit être connecté avant de pouvoir envoyer des emails
3. **Apollo API**: Nécessaire pour la recherche de contacts
4. **Firestore Rules**: S'assurer que l'utilisateur peut écrire dans `campaigns` et `recipients`

## 🎨 Palette de Couleurs

- **Vert accent**: `#b7e219` (primary), `#a5cb17` (hover), `#9fc015` (border)
- **Dark backgrounds**: `#0a0a0a` (principal), `#1a1a1a` (cards), `#2b2a2c` (hover)
- **Borders dark**: `rgba(255, 255, 255, 0.08)`

## ✨ Fonctionnalités Bonus

- Preview en temps réel pour A/B testing
- Édition de templates avant lancement
- Validation à chaque étape
- Navigation conditionnelle basée sur le mode
- Stepper dynamique qui s'adapte au flow

