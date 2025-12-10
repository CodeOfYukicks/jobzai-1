# 🚀 Démarrage du Campaign Wizard

## ⚠️ Prérequis Important

Le wizard utilise maintenant un endpoint backend pour générer les templates IA. Vous devez démarrer le serveur Express.

## 📝 Étapes de Démarrage

### 1. Démarrer le Backend

Dans un terminal:

```bash
node server.cjs
```

Le serveur devrait afficher:
```
✅ OpenAI client initialized
✅ Firebase Admin initialized
Server running on port 3000
```

### 2. Démarrer le Frontend

Dans un autre terminal:

```bash
npm run dev
```

### 3. Variables d'Environnement

Créez ou vérifiez votre fichier `.env`:

```env
# Backend URL
VITE_BACKEND_URL=http://localhost:3000

# OpenAI API Key (ou configurez dans Firestore)
OPENAI_API_KEY=sk-...
VITE_OPENAI_API_KEY=sk-...
```

**Alternative**: Configurez l'API key dans Firestore:
- Collection: `settings`
- Document: `openai`
- Champ: `apiKey` avec votre clé OpenAI

## 🧪 Test du Nouveau Wizard

### Flux Rapide - Mode Auto (3 étapes)

1. Cliquez sur le bouton vert **"New Campaign"**
2. **Étape 1**: Ajoutez un job title et une location → Continue
3. **Étape 2**: Connectez Gmail → Continue
4. **Étape 3**: Sélectionnez **"Auto-Generate"** → **Launch Campaign**

✨ C'est tout! La campagne est créée en 3 étapes.

### Flux Complet - Mode Template (4 étapes)

1. **Étape 1**: Targeting → Continue
2. **Étape 2**: Gmail → Continue
3. **Étape 3**: Sélectionnez **"AI Template"** → Continue
4. **Étape 4**: 
   - Configurez Tone / Language / Key Points
   - Les templates se génèrent automatiquement
   - Sélectionnez votre template préféré
   - Éditez si nécessaire
   - **Launch Campaign**

### Flux Avancé - Mode A/B Testing (4 étapes)

1. **Étape 1**: Targeting → Continue
2. **Étape 2**: Gmail → Continue
3. **Étape 3**: Sélectionnez **"A/B Testing"** → Continue
4. **Étape 4**:
   - Configurez Tone / Language / Key Points
   - Créez vos variantes dans les 3 sections (Hooks/Bodies/CTAs)
   - Utilisez le Preview pour voir les combinaisons
   - **Launch Campaign**

## 🐛 Résolution des Erreurs

### ❌ "Failed to generate templates" / 404 Not Found

**Problème**: Le backend n'est pas démarré

**Solution**:
```bash
# Dans un terminal
node server.cjs
```

Attendez de voir `Server running on port 3000`

### ❌ "Uncaught ReferenceError: firstName is not defined"

**Problème**: Fixed! Les accolades doubles `{{}}` dans JSX causaient des erreurs

**Solution**: Déjà corrigé dans les fichiers

### ❌ "OpenAI API key not found"

**Problème**: L'API key n'est pas configurée

**Solution 1** - Variable d'environnement:
```bash
export OPENAI_API_KEY=sk-...
node server.cjs
```

**Solution 2** - Firestore:
1. Allez dans Firestore
2. Collection: `settings`
3. Document: `openai`
4. Ajoutez le champ: `apiKey: "sk-..."`

### ❌ "Gmail token expired"

**Problème**: Les tokens Gmail ont expiré

**Solution**: Reconnectez Gmail dans l'étape 2 du wizard

## ✅ Checklist de Vérification

Avant de tester le wizard:

- [ ] Backend démarré (`node server.cjs`)
- [ ] Frontend démarré (`npm run dev`)
- [ ] OpenAI API key configurée
- [ ] Variable `VITE_BACKEND_URL` définie
- [ ] Gmail OAuth configuré
- [ ] Apollo API configurée (pour la recherche de contacts)

## 🎨 Design Vérifié

Le nouveau design utilise:
- ✅ Bouton "New Campaign" en vert (`#b7e219`)
- ✅ Progress bar verte
- ✅ Stepper avec dots verts
- ✅ Bouton "Launch Campaign" vert
- ✅ Checkmarks verts sur sélection
- ✅ Dark mode avec `#0a0a0a`, `#1a1a1a`, `#2b2a2c`

## 📊 Vérification du Flow

### Test Simple - Mode Auto
```
Clic "New Campaign" 
  → Targeting (30s)
    → Gmail (10s)
      → Mode: Auto (5s)
        → Launch! ✨

Total: ~45 secondes
```

### Test Avancé - Mode Template
```
Clic "New Campaign"
  → Targeting (30s)
    → Gmail (10s)
      → Mode: Template (5s)
        → Preferences + Templates (60s)
          → Launch! ✨

Total: ~105 secondes
```

## 🎉 Prêt à Tester!

Une fois le backend démarré, rafraîchissez votre page et testez le nouveau wizard. 

Le flow est maintenant beaucoup plus court et intuitif! 🚀

