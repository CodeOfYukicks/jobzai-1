# 🔔 Système de Notifications - Guide Complet

## Vue d'ensemble

Le système de notifications de JobzAI offre des notifications persistantes dans le centre de notifications (cloche en haut à droite) pour les événements importants. Les notifications sont stockées dans Firestore et mises à jour en temps réel.

## Types de Notifications

### 1. ✅ Analyse ATS/CV Terminée (`task_complete`)
**Déclencheur:** Quand une analyse ATS/CV ou génération de CV se termine en arrière-plan.

**Localisation:**
- Hook: `src/hooks/useBackgroundTasks.tsx`
- Service: `src/services/notificationCenterService.ts` → `createTaskCompleteNotification()`

**Données:**
```typescript
{
  taskType: 'cv_rewrite' | 'ats_analysis' | 'cover_letter',
  taskId: string,
  analysisId?: string,
  jobTitle?: string,
  company?: string
}
```

**Action URL:** `/ats-analysis/${analysisId}` - Mène directement à la page de résultats.

**Test:**
1. Lancer une analyse ATS depuis la page CV Analysis
2. Attendre la fin du traitement en arrière-plan
3. Vérifier qu'une notification apparaît dans la cloche
4. Cliquer sur la notification pour aller à la page de résultats

---

### 2. 📧 Réponse Email Reçue (`email_reply`)
**Déclencheur:** Quand un contact répond à un email envoyé depuis JobzAI (détecté par Gmail API).

**Localisation:**
- Hook: `src/hooks/useGmailReplyChecker.ts`
- Service: `src/services/notificationCenterService.ts` → `createEmailReplyNotification()`

**Données:**
```typescript
{
  contactName: string,
  contactEmail?: string,
  companyName?: string,
  threadId?: string,
  applicationId?: string
}
```

**Action URL:** `/applications` - Mène à la liste des candidatures.

**Test:**
1. Envoyer un email depuis JobDetailPanel à un contact
2. Répondre à cet email depuis Gmail
3. Attendre que `useGmailReplyChecker` détecte la réponse (check automatique toutes les 5 minutes)
4. Vérifier la notification dans la cloche

---

### 3. 📨 Réponse à une Campagne (`campaign_reply`)
**Déclencheur:** Quand un destinataire de campagne répond (détecté via endpoint backend `/api/campaigns/:campaignId/check-replies`).

**Localisation:**
- Backend: `server.cjs` → `/api/campaigns/:campaignId/check-replies`
- Service: `src/services/notificationCenterService.ts` → `createCampaignReplyNotification()`

**Données:**
```typescript
{
  contactName: string,
  contactEmail?: string,
  companyName?: string,
  campaignId: string,
  recipientId: string
}
```

**Action URL:** `/campaigns-auto?campaign=${campaignId}&recipient=${recipientId}` - Mène directement à la campagne avec le destinataire sélectionné.

**Test:**
1. Créer une campagne depuis la page Campaigns
2. Envoyer des emails via la campagne
3. Répondre à un email depuis Gmail
4. Cliquer sur "Check Replies" dans l'interface de campagne
5. Vérifier qu'une notification apparaît pour chaque réponse

---

### 4. 📋 Carte Ajoutée au Board (`card_added`)
**Déclencheur:** Quand un contact d'une campagne est ajouté à un board Kanban.

**Localisation:**
- Page: `src/pages/CampaignsAutoPage.tsx` → `addContactToBoard()`
- Service: `src/services/notificationCenterService.ts` → `createCardAddedNotification()`

**Données:**
```typescript
{
  contactName: string,
  companyName?: string,
  boardName: string,
  boardId: string,
  applicationId: string
}
```

**Action URL:** `/board/${boardId}` - Mène directement au board.

**Test:**
1. Aller sur Campaigns Auto
2. Sélectionner une campagne avec des destinataires
3. Cliquer sur "Add to Board" pour un destinataire
4. Choisir un board
5. Vérifier qu'une notification apparaît (silencieuse, pas de toast)

---

### 5. 📅 Rappel d'Interview (`interview_reminder`)
**Déclencheur:** Automatiquement selon la proximité de l'interview (24h, 3h, 1h avant).

**Localisation:**
- Service: `src/services/notificationService.ts` → `checkUpcomingInterviews()`
- Hook: Initialisé dans le contexte d'authentification

**Données:**
```typescript
{
  companyName: string,
  position?: string,
  interviewType: 'technical' | 'hr' | 'manager' | 'final' | 'other',
  interviewDate: string,
  interviewTime: string,
  applicationId: string,
  interviewId?: string,
  hoursUntil: number
}
```

**Action URL:** `/upcoming-interviews` - Mène à la page des interviews à venir.

**Priorité:**
- 1h avant: `high` (avec toast de warning)
- 3h avant: `medium` (silencieux)
- 24h avant: `medium` (silencieux)

**Test:**
1. Créer une candidature avec une interview programmée dans moins de 24h
2. Attendre que le système détecte l'interview (check toutes les 30 minutes)
3. Vérifier qu'une notification apparaît
4. Pour tester plus rapidement, modifier temporairement les seuils dans `notificationService.ts`

---

### 6. 🔄 Changement de Statut (`status_change`)
**Déclencheur:** Quand le statut d'une candidature change (non implémenté automatiquement, mais disponible).

**Localisation:**
- Service: `src/services/notificationCenterService.ts` → `createStatusChangeNotification()`

**Données:**
```typescript
{
  companyName: string,
  position: string,
  previousStatus: string,
  newStatus: string,
  applicationId: string
}
```

**Action URL:** `/applications` - Mène à la liste des candidatures.

**Test:**
```typescript
await notify.statusChange({
  companyName: 'Test Company',
  position: 'Software Engineer',
  previousStatus: 'applied',
  newStatus: 'interviewing',
  applicationId: 'test-id',
  showToast: true
});
```

---

### 7. 🏆 Achievement/Mission (`achievement`)
**Déclencheur:** Quand un utilisateur débloque un achievement ou complète une mission (système gamification).

**Localisation:**
- Service: `src/services/notificationCenterService.ts` → `createAchievementNotification()`

**Données:**
```typescript
{
  achievementName?: string,
  achievementId?: string,
  missionName?: string,
  missionId?: string,
  xpEarned?: number
}
```

**Action URL:** `/dashboard` - Mène au dashboard.

---

## Architecture Technique

### Services
1. **`notificationCenterService.ts`** - CRUD et création des notifications dans Firestore
2. **`notify.ts`** - API unifiée pour créer des notifications depuis l'application
3. **NotificationContext** - Gère l'état global et la synchronisation temps réel

### Composants
1. **`NotificationCenter.tsx`** - Dropdown de la cloche avec liste des notifications
2. **`NotificationItem.tsx`** - Item individuel de notification avec icône et actions

### Firestore Structure
```
users/{userId}/notifications/{notificationId}
  ├── type: NotificationType
  ├── title: string
  ├── message: string
  ├── icon: string
  ├── actionUrl?: string
  ├── actionLabel?: string
  ├── metadata: NotificationMetadata
  ├── read: boolean
  ├── priority: 'high' | 'medium' | 'low'
  └── createdAt: Timestamp
```

### Firestore Rules Nécessaires
```javascript
match /users/{userId}/notifications/{notificationId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId;
  allow delete: if request.auth.uid == userId;
}
```

---

## Utilisation dans le Code

### Créer une Notification Persistante

```typescript
import { notify } from '@/lib/notify';

// Task completed
await notify.taskComplete({
  taskType: 'ats_analysis',
  taskId: 'task-123',
  analysisId: 'analysis-456',
  jobTitle: 'Software Engineer',
  company: 'Google',
  showToast: false // Silent notification
});

// Email reply
await notify.emailReply({
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  companyName: 'Acme Corp',
  applicationId: 'app-123',
  showToast: true // Show brief toast
});

// Campaign reply
await notify.campaignReply({
  contactName: 'Jane Smith',
  companyName: 'TechCorp',
  campaignId: 'campaign-123',
  recipientId: 'recipient-456',
  showToast: false
});

// Card added to board
await notify.cardAdded({
  contactName: 'Bob Johnson',
  companyName: 'StartupXYZ',
  boardName: 'Active Prospects',
  boardId: 'board-123',
  applicationId: 'app-789',
  showToast: false
});
```

### Options Communes
- `showToast`: Si `true`, affiche un micro-feedback en plus de la notification persistante
- Toutes les notifications vont dans le centre de notifications
- Les notifications peuvent être marquées comme lues ou supprimées

---

## Tests Manuels

### Checklist Complète

- [ ] **Analyse ATS terminée**
  - [ ] Lancer une analyse ATS
  - [ ] Vérifier la notification dans la cloche
  - [ ] Cliquer pour naviguer vers les résultats
  - [ ] Marquer comme lu
  
- [ ] **Réponse email (jobApplications)**
  - [ ] Envoyer un email depuis une carte
  - [ ] Répondre depuis Gmail
  - [ ] Attendre la détection (ou forcer un check)
  - [ ] Vérifier la notification
  
- [ ] **Réponse campagne**
  - [ ] Créer une campagne
  - [ ] Envoyer des emails
  - [ ] Répondre depuis Gmail
  - [ ] Cliquer "Check Replies"
  - [ ] Vérifier les notifications (une par réponse)
  
- [ ] **Carte ajoutée au board**
  - [ ] Ajouter un contact de campagne à un board
  - [ ] Vérifier la notification silencieuse
  - [ ] Cliquer pour naviguer vers le board
  
- [ ] **Rappel d'interview**
  - [ ] Créer une interview dans <24h
  - [ ] Attendre le check automatique (ou modifier les seuils)
  - [ ] Vérifier les notifications à différents moments
  
- [ ] **UI du centre de notifications**
  - [ ] Badge de compteur non-lus
  - [ ] Animation de la cloche
  - [ ] Filtre All/Unread
  - [ ] Mark all as read
  - [ ] Suppression individuelle
  - [ ] Navigation vers actionUrl

---

## Notes de Développement

### Notifications Silencieuses vs Toast
- **Silencieuses** (`showToast: false`): Pour événements fréquents ou moins urgents (card added, task complete)
- **Avec Toast** (`showToast: true`): Pour événements importants nécessitant attention immédiate (email reply)

### Nettoyage Automatique
Les notifications lues de plus de 7 jours sont automatiquement nettoyées au démarrage de session (voir `cleanupOldNotifications` dans `notificationCenterService.ts`).

### Performance
- Abonnement temps réel limité aux 50 dernières notifications
- Pas de polling, utilise les onSnapshot de Firestore
- Les notifications sont créées côté serveur (Firebase Functions) quand possible pour garantir la livraison

---

## Améliorations Futures

1. **Push Notifications** - Intégrer Firebase Cloud Messaging pour les notifications browser
2. **Email Digest** - Envoyer un résumé quotidien par email des notifications non lues
3. **Préférences** - Permettre à l'utilisateur de configurer quels types de notifications recevoir
4. **Grouping** - Grouper les notifications similaires (ex: "3 nouvelles réponses à vos campagnes")
5. **Actions rapides** - Permettre des actions depuis la notification (répondre, archiver, etc.)

---

## Troubleshooting

### Les notifications n'apparaissent pas
1. Vérifier que `currentUserId` est défini dans `notify.ts`
2. Vérifier les règles Firestore pour `users/{userId}/notifications`
3. Vérifier la console pour les erreurs de création
4. Vérifier que le `NotificationContext` est bien monté dans l'arbre React

### Les notifications ne se mettent pas à jour en temps réel
1. Vérifier la connexion Firestore
2. Vérifier que `subscribeToNotifications` est appelé
3. Vérifier qu'il n'y a pas d'erreur de permission dans la console

### L'actionUrl ne fonctionne pas
1. Vérifier que l'URL est valide dans React Router
2. Vérifier que `navigate()` fonctionne correctement
3. Vérifier la console pour les erreurs de navigation

---

**Dernière mise à jour:** Décembre 2024
**Version:** 2.0




