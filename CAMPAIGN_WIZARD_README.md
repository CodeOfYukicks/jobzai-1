# 🚀 Campaign Wizard - Guide de Démarrage Rapide

## 📋 Vue d'Ensemble

Le nouveau système de création de campagne offre **3 modes de génération d'emails** avec un design cohérent et une expérience utilisateur optimisée.

## ✨ Nouveautés

### 3 Modes de Génération

1. **🪄 AI Template** (Recommandé)
   - L'IA génère 2-3 templates d'emails
   - Vous choisissez et personnalisez celui qui vous plaît
   - Utilise des champs de fusion: `{{firstName}}`, `{{company}}`, etc.
   - Parfait pour: Contrôle + Personnalisation

2. **🧪 A/B Testing**
   - Créez 3-5 accroches différentes
   - Créez 2-3 corps de message différents
   - Créez 2-3 call-to-actions différents
   - Le système combine aléatoirement et track les performances
   - Parfait pour: Optimisation des conversions

3. **⚡ Auto-Generate**
   - L'IA génère un email unique pour chaque contact
   - Aucune configuration supplémentaire
   - Setup le plus rapide
   - Parfait pour: Rapidité et simplicité

### Design Cohérent

- ✅ Palette verte: `#b7e219` (accent principal)
- ✅ Dark mode optimisé avec teintes de gris
- ✅ Animations fluides avec Framer Motion
- ✅ Stepper dynamique qui s'adapte au mode choisi

## 🎯 Comment Utiliser

### Étape 1: Créer une Campagne

1. Allez sur la page **Campaigns**
2. Cliquez sur le bouton vert **"New Campaign"**
3. Suivez le wizard en 4-5 étapes:
   - **Targeting**: Définissez vos critères de recherche
   - **Gmail**: Connectez votre compte Gmail
   - **Preferences**: Choisissez le ton et la langue
   - **Mode**: Sélectionnez votre mode de génération
   - **Configuration**: (uniquement pour Template et A/B Testing)

### Étape 2: Mode Template

1. L'IA génère automatiquement 2-3 templates
2. Parcourez les options et sélectionnez votre préféré
3. Cliquez sur **"Edit Template"** pour personnaliser
4. Les champs de fusion sont mis en évidence en vert
5. Cliquez sur **"Launch Campaign"**

**Champs de fusion disponibles:**
- `{{firstName}}` - Prénom du contact
- `{{lastName}}` - Nom du contact
- `{{company}}` - Nom de l'entreprise
- `{{position}}` - Poste du contact
- `{{location}}` - Localisation

### Étape 3: Mode A/B Testing

1. Utilisez les **tabs** pour naviguer entre sections:
   - **Opening Hooks**: Premières phrases (3-5 variantes)
   - **Email Bodies**: Corps du message (2-3 variantes)
   - **Call-to-Actions**: Phrases de clôture (2-3 variantes)

2. Cliquez sur **"+ Add Variant"** pour ajouter des options
3. Utilisez le **Preview** pour voir les combinaisons
4. Sélectionnez différentes variantes dans les dropdowns
5. Cliquez sur **"Launch Campaign"**

**Le système va:**
- Combiner aléatoirement hook + body + cta pour chaque contact
- Tracker quelle combinaison performe le mieux
- Sauvegarder `variantConfig` pour analyse future

### Étape 4: Mode Auto-Generate

1. Sélectionnez **"Auto-Generate"**
2. Cliquez directement sur **"Launch Campaign"**
3. L'IA générera un email unique pour chaque contact

**Avantages:**
- Setup en 30 secondes
- Emails 100% personnalisés
- Pas de configuration manuelle

## 🎨 Design & UX

### Couleurs

- **Accent vert**: Boutons CTA, progress bar, checkmarks
- **Dark mode**: Backgrounds `#0a0a0a`, `#1a1a1a`, `#2b2a2c`
- **Borders**: `rgba(255, 255, 255, 0.08)` en dark mode

### Navigation

- **Stepper dynamique**: Le nombre d'étapes s'adapte au mode
- **Validation en temps réel**: Bouton "Continue" désactivé si invalide
- **Retour possible**: Cliquez sur "Back" pour revenir en arrière
- **Progress bar**: Indicateur visuel de progression

## 🔧 Configuration Requise

### Backend

Le serveur doit être démarré pour utiliser les nouveaux endpoints:

```bash
node server.cjs
```

### Variables d'Environnement

```env
OPENAI_API_KEY=sk-...
VITE_BACKEND_URL=http://localhost:3000
```

Ou configurez l'API key dans Firestore:
- Collection: `settings`
- Document: `openai`
- Champ: `apiKey`

### Gmail OAuth

Vous devez connecter Gmail dans l'étape 2 du wizard pour pouvoir envoyer des emails.

## 📊 Après le Lancement

### Génération des Emails

1. Retournez sur la page Campaigns
2. Sélectionnez votre campagne
3. Cliquez sur **"Generate"** pour créer les emails
4. Selon le mode:
   - **Template**: Remplace les merge fields
   - **A/B Testing**: Combine les variantes
   - **Auto**: Génère avec IA

### Envoi des Emails

1. Cliquez sur **"Send"** pour envoyer un batch de 10 emails
2. Attendez quelques minutes entre chaque batch
3. Cliquez sur **"Check Replies"** pour voir les réponses

### Suivi des Performances

- **Contacts**: Nombre total trouvé
- **Generated**: Emails créés
- **Sent**: Emails envoyés
- **Opened**: Taux d'ouverture
- **Replied**: Taux de réponse

Pour l'A/B testing, vous pouvez analyser les `variantConfig` dans Firestore pour voir quelles combinaisons performent le mieux.

## 🐛 Troubleshooting

### "Failed to generate templates"
- Vérifiez que l'API OpenAI est configurée
- Vérifiez les logs du serveur
- Vérifiez votre quota OpenAI

### "Gmail token expired"
- Reconnectez Gmail dans les settings
- Vérifiez que les tokens sont valides dans Firestore

### "No contacts found"
- Ajustez vos critères de targeting
- Vérifiez que l'API Apollo est configurée
- Essayez des critères plus larges

### Merge fields non remplacés
- Vérifiez que le mode est bien 'template'
- Vérifiez que `campaign.template` existe dans Firestore
- Vérifiez les logs: "Using generation mode: template"

## 📚 Ressources

- **Testing Guide**: `CAMPAIGN_WIZARD_TESTING_GUIDE.md`
- **Implementation Summary**: `CAMPAIGN_WIZARD_IMPLEMENTATION_SUMMARY.md`
- **Plan Original**: `campaign-creation.plan.md`

## 💡 Conseils & Best Practices

### Mode Template
- Choisissez un template qui résonne avec votre style
- Personnalisez-le pour qu'il soit authentique
- Testez avec quelques contacts d'abord

### Mode A/B Testing
- Créez des variantes vraiment différentes
- Testez des approches opposées (formel vs casual)
- Analysez les résultats après 50+ envois
- Gardez les variantes gagnantes pour la prochaine campagne

### Mode Auto-Generate
- Parfait pour des campagnes larges (100+ contacts)
- Assurez-vous que votre profil est à jour
- Ajoutez des "key points" dans les preferences

## 🎉 Profitez!

Le nouveau système de campagne est conçu pour vous faire gagner du temps tout en maximisant vos chances de succès. Choisissez le mode qui correspond à vos besoins et lancez votre première campagne!

**Questions?** Consultez les guides de test et d'implémentation pour plus de détails.

