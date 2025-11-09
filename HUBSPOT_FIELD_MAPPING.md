# Mapping des Champs HubSpot

## ✅ Champs qui se mappent automatiquement

Ces champs sont déjà gérés par l'intégration et se synchroniseront automatiquement :

| Champ HubSpot | Propriété HubSpot | Source | Status |
|---------------|-------------------|--------|--------|
| **Nom** | `firstname` / `lastname` | Inscription / Profil | ✅ Automatique |
| **E-Mail** | `email` | Inscription | ✅ Automatique |
| **Numéro De Téléphone** | `phone` | Complétion profil | ✅ Automatique |
| **Firebase ID** | `jobzai_user_id` | Inscription | ✅ Automatique |
| **Source** | `jobzai_source` | Inscription | ✅ Automatique |
| **Date De Création** | `jobzai_signup_date` | Inscription | ✅ Automatique |

## ⚠️ Champs personnalisés nécessitant une configuration

Ces champs nécessitent de créer des propriétés personnalisées dans HubSpot :

| Champ HubSpot | Propriété personnalisée à créer | Type | Action requise |
|---------------|--------------------------------|------|---------------|
| **Newsletter** | `jobzai_newsletter_opt_in` | Boolean | Créer dans HubSpot + Inclure dans profileData |
| **Campaigns EA** | `jobzai_campaigns_ea_opt_in` | Boolean | Créer dans HubSpot + Inclure dans profileData |
| **Membership** | `jobzai_membership_level` | Text | Créer dans HubSpot + Inclure dans profileData |

## 📋 Guide de configuration des champs personnalisés

### Étape 1 : Créer les propriétés personnalisées dans HubSpot

1. Allez dans **Settings** → **Properties** → **Contact properties**
2. Cliquez sur **Create property**
3. Pour chaque champ, créez une propriété :

#### Newsletter
- **Internal name** : `jobzai_newsletter_opt_in`
- **Label** : `JobzAI Newsletter Opt-In`
- **Type** : `Boolean` (Checkbox)
- **Group** : `Contact information` (ou créez un groupe "JobzAI")

#### Campaigns EA
- **Internal name** : `jobzai_campaigns_ea_opt_in`
- **Label** : `JobzAI Campaigns Early Access`
- **Type** : `Boolean` (Checkbox)
- **Group** : `Contact information` (ou créez un groupe "JobzAI")

#### Membership
- **Internal name** : `jobzai_membership_level`
- **Label** : `JobzAI Membership Level`
- **Type** : `Text` (Single-line text)
- **Group** : `Contact information` (ou créez un groupe "JobzAI")

### Étape 2 : Inclure ces champs dans le profil utilisateur

Pour que ces champs soient synchronisés avec HubSpot, ils doivent être inclus dans `profileData` lors de la complétion du profil.

#### Option A : Modifier `completeProfile` dans AuthContext

Si vous collectez ces données lors de la complétion du profil, elles seront automatiquement synchronisées car le code utilise `...profileData`.

#### Option B : Ajouter manuellement dans le code

Si vous voulez ajouter ces champs manuellement, modifiez `src/contexts/AuthContext.tsx` dans la fonction `completeProfile` :

```typescript
await syncUserToHubSpot(
  {
    email: currentUser.email || '',
    firstName: profileData.firstName || userData?.firstName || '',
    lastName: profileData.lastName || userData?.lastName || '',
    phone: profileData.phone || '',
    company: profileData.company || '',
    jobtitle: profileData.jobTitle || profileData.title || '',
    city: profileData.city || '',
    state: profileData.state || '',
    country: profileData.country || '',
    jobzai_user_id: currentUser.uid,
    jobzai_profile_completed: true,
    // Ajoutez les champs personnalisés ici
    jobzai_newsletter_opt_in: profileData.newsletter || false,
    jobzai_campaigns_ea_opt_in: profileData.campaignsEA || false,
    jobzai_membership_level: profileData.membership || '',
    ...profileData,
  },
  'profile_completed',
  {
    userId: currentUser.uid,
    completedAt: new Date().toISOString(),
  }
);
```

## 🔍 Vérification

Après avoir configuré les propriétés personnalisées :

1. **Créez un nouveau compte utilisateur** ou **complétez un profil existant**
2. **Vérifiez dans HubSpot** que les champs personnalisés sont remplis
3. **Vérifiez les logs Firebase Functions** pour voir si les données sont envoyées

## 📝 Notes importantes

1. **Noms internes** : Les noms internes des propriétés HubSpot doivent correspondre exactement (ex: `jobzai_newsletter_opt_in`)
2. **Types de données** : Assurez-vous que les types correspondent (Boolean pour les opt-ins, Text pour membership)
3. **Synchronisation** : Les champs personnalisés ne seront synchronisés que s'ils sont présents dans `profileData` lors de la complétion du profil
4. **Mise à jour** : Si vous modifiez un champ personnalisé après la complétion du profil, vous devrez soit :
   - Re-synchroniser manuellement via une Cloud Function
   - Créer un trigger Firestore pour synchroniser automatiquement les mises à jour

## 🚀 Amélioration future (optionnel)

Pour synchroniser automatiquement les mises à jour de profil, vous pouvez créer un trigger Firestore :

```typescript
// Dans functions/src/index.ts
export const onUserUpdated = onDocumentUpdated(
  'users/{userId}',
  async (event) => {
    // Synchroniser avec HubSpot lors de chaque mise à jour
    // ...
  }
);
```



