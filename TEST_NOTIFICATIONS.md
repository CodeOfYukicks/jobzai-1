# 🧪 Guide de Test des Notifications

Ce guide vous permet de tester rapidement toutes les notifications du système.

## 🚀 Tests Rapides via Console

Ouvrez la console du navigateur (F12) sur n'importe quelle page de JobzAI et exécutez ces commandes :

### 1. Test: Analyse ATS Terminée ✅
```javascript
// Simuler une analyse ATS terminée
window.__TEST_NOTIFY__ = async () => {
  const { notify } = await import('./src/lib/notify.ts');
  await notify.taskComplete({
    taskType: 'ats_analysis',
    taskId: 'test-task-123',
    analysisId: 'test-analysis-456',
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    showToast: false
  });
  console.log('✅ Notification "Analyse ATS" créée !');
};
window.__TEST_NOTIFY__();
```

### 2. Test: Réponse Email Reçue 📧
```javascript
// Simuler une réponse email
window.__TEST_EMAIL_REPLY__ = async () => {
  const { notify } = await import('./src/lib/notify.ts');
  await notify.emailReply({
    contactName: 'Marie Dupont',
    contactEmail: 'marie@example.com',
    companyName: 'TechCorp',
    applicationId: 'test-app-123',
    showToast: true
  });
  console.log('✅ Notification "Réponse Email" créée !');
};
window.__TEST_EMAIL_REPLY__();
```

### 3. Test: Réponse Campagne 📨
```javascript
// Simuler une réponse de campagne
window.__TEST_CAMPAIGN_REPLY__ = async () => {
  const { notify } = await import('./src/lib/notify.ts');
  await notify.campaignReply({
    contactName: 'Jean Martin',
    contactEmail: 'jean@startup.com',
    companyName: 'Startup Innovante',
    campaignId: 'test-campaign-789',
    recipientId: 'test-recipient-456',
    showToast: true
  });
  console.log('✅ Notification "Réponse Campagne" créée !');
};
window.__TEST_CAMPAIGN_REPLY__();
```

### 4. Test: Carte Ajoutée au Board 📋
```javascript
// Simuler ajout carte au board
window.__TEST_CARD_ADDED__ = async () => {
  const { notify } = await import('./src/lib/notify.ts');
  await notify.cardAdded({
    contactName: 'Sophie Bernard',
    companyName: 'FinTech Solutions',
    boardName: 'Prospects Actifs',
    boardId: 'test-board-123',
    applicationId: 'test-app-789',
    showToast: false
  });
  console.log('✅ Notification "Carte Ajoutée" créée !');
};
window.__TEST_CARD_ADDED__();
```

### 5. Test: Rappel Interview 📅
```javascript
// Simuler un rappel d'interview
window.__TEST_INTERVIEW__ = async () => {
  const { createInterviewReminderNotification } = await import('./src/services/notificationCenterService.ts');
  const { auth } = await import('./src/lib/firebase.ts');
  
  if (auth.currentUser) {
    await createInterviewReminderNotification(auth.currentUser.uid, {
      companyName: 'Microsoft',
      position: 'Senior Frontend Developer',
      interviewType: 'technical',
      interviewDate: '2024-12-15',
      interviewTime: '14:30',
      applicationId: 'test-app-555',
      interviewId: 'test-interview-888',
      hoursUntil: 1.2 // Dans 1h
    });
    console.log('✅ Notification "Interview" créée !');
  }
};
window.__TEST_INTERVIEW__();
```

### 6. Test: Tout en Même Temps 🎉
```javascript
// Créer toutes les notifications de test
window.__TEST_ALL__ = async () => {
  await window.__TEST_NOTIFY__();
  await new Promise(r => setTimeout(r, 500));
  
  await window.__TEST_EMAIL_REPLY__();
  await new Promise(r => setTimeout(r, 500));
  
  await window.__TEST_CAMPAIGN_REPLY__();
  await new Promise(r => setTimeout(r, 500));
  
  await window.__TEST_CARD_ADDED__();
  await new Promise(r => setTimeout(r, 500));
  
  await window.__TEST_INTERVIEW__();
  
  console.log('✅ Toutes les notifications de test créées !');
  console.log('👉 Cliquez sur la cloche 🔔 en haut à droite pour les voir');
};
window.__TEST_ALL__();
```

---

## 🎯 Tests d'Intégration Réels

### Test 1: Analyse ATS Complète
1. Aller sur `/cv-analysis`
2. Uploader un CV et une offre d'emploi
3. Lancer l'analyse
4. Attendre la fin (processus en arrière-plan)
5. **Vérifier:** Notification apparaît dans la cloche avec lien vers résultats

### Test 2: Réponse Email Application
1. Aller sur `/applications`
2. Ouvrir une carte avec un contact
3. Envoyer un email via JobDetailPanel
4. Répondre à l'email depuis Gmail
5. Attendre 5 minutes (ou forcer le check)
6. **Vérifier:** Notification de réponse dans la cloche

### Test 3: Réponse Campagne
1. Aller sur `/campaigns-auto`
2. Créer une campagne et envoyer des emails
3. Répondre à un email depuis Gmail
4. Cliquer sur "Check Replies" dans l'interface
5. **Vérifier:** Notification pour chaque réponse détectée

### Test 4: Carte Ajoutée au Board
1. Aller sur `/campaigns-auto`
2. Sélectionner un destinataire d'une campagne
3. Cliquer sur le menu (⋮) → "Add to Board"
4. Choisir un board
5. **Vérifier:** Notification silencieuse apparaît dans la cloche

### Test 5: Interview à Venir
1. Aller sur `/applications`
2. Créer une candidature
3. Ajouter une interview dans moins de 24h
4. Attendre 30 minutes (check automatique)
5. **Vérifier:** Notification de rappel apparaît

---

## ✅ Checklist de Validation

Après avoir exécuté les tests, vérifier :

### Interface Notification Center
- [ ] Le badge de compteur non-lus s'affiche correctement
- [ ] L'animation de la cloche fonctionne
- [ ] Le dropdown s'ouvre au clic sur la cloche
- [ ] Les notifications sont groupées par date
- [ ] Les filtres "All" / "Unread" fonctionnent
- [ ] Le bouton "Mark all as read" fonctionne

### Notifications Individuelles
- [ ] Chaque type a une icône et couleur distincte
- [ ] Le titre et message sont clairs
- [ ] Le timestamp "X minutes ago" s'affiche
- [ ] Le bouton de suppression (X) fonctionne
- [ ] Le point bleu indique les non-lues
- [ ] Au survol, le label d'action apparaît ("View Result", "View Reply", etc.)

### Navigation
- [ ] Cliquer sur une notification marque comme lue
- [ ] Cliquer navigue vers la bonne page
- [ ] L'URL de destination est correcte
- [ ] Le panel se ferme après navigation

### Temps Réel
- [ ] Les nouvelles notifications apparaissent automatiquement
- [ ] Le compteur se met à jour en temps réel
- [ ] Pas besoin de rafraîchir la page

---

## 🐛 Troubleshooting

### "No userId set"
**Problème:** Les notifications ne se créent pas.  
**Solution:** Vérifier que vous êtes connecté et que `NotificationContext` est monté.

### Notifications n'apparaissent pas
**Problème:** Les notifications sont créées mais n'apparaissent pas dans l'UI.  
**Solution:** 
1. Vérifier la console pour les erreurs Firestore
2. Vérifier les règles Firestore pour `users/{userId}/notifications`
3. Vérifier que `subscribeToNotifications` est appelé

### ActionUrl ne fonctionne pas
**Problème:** Cliquer sur la notification ne navigue pas.  
**Solution:**
1. Vérifier que l'URL existe dans React Router
2. Vérifier la console pour les erreurs de navigation
3. Vérifier que `navigate()` est bien importé et utilisé

---

## 📊 Résultats Attendus

Après tous les tests, vous devriez voir dans la cloche :
- 🟣 Analyse ATS terminée (violet)
- 🟢 Réponse email reçue (émeraude)
- 🔵 Réponse campagne reçue (cyan)
- 🟣 Carte ajoutée au board (indigo)
- 🔵 Interview à venir (bleu)

Le compteur devrait afficher "5" (ou plus si tests multiples).

---

## 🎨 Codes Couleurs par Type

| Type | Icône | Couleur | Priorité |
|------|-------|---------|----------|
| `task_complete` | ✅ CheckCircle | Violet | Haute |
| `email_reply` | 📧 Mail | Émeraude | Haute |
| `campaign_reply` | 📨 Mail | Cyan | Haute |
| `card_added` | 📋 Kanban | Indigo | Moyenne |
| `interview_reminder` | 📅 Calendar | Bleu | Moyenne/Haute |
| `status_change` | 🔄 Refresh | Ambre | Basse |
| `achievement` | 🏆 Trophy | Rose | Basse |

---

**Dernière mise à jour:** Décembre 2024  
**Version:** 1.0





