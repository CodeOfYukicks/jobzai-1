# 🔧 Guide de Debug - Enregistrement Vocal

## ✅ Corrections Appliquées

### 1. Utilisation de Refs pour l'État
**Problème:** Les callbacks `onerror` et `onend` utilisaient `isRecording` qui ne reflétait pas l'état actuel.

**Solution:** Ajout de `isRecordingRef` pour avoir l'état en temps réel dans les callbacks.

```typescript
const isRecordingRef = useRef<boolean>(false);
const restartAttempts = useRef<number>(0);
```

### 2. Limitation des Redémarrages
**Problème:** Boucle infinie de redémarrages en cas d'erreurs réseau répétées.

**Solution:** Limite de 10 tentatives de redémarrage.

```typescript
if (restartAttempts.current < 10) {
    restartAttempts.current++;
    recognitionRef.current.start();
} else {
    console.warn('Too many restart attempts, stopping');
    isRecordingRef.current = false;
}
```

### 3. Gestion Simplifiée des Erreurs Réseau
**Avant:** Tentative de redémarrage dans `onerror`
**Après:** Laisse `onend` gérer le redémarrage automatiquement

```typescript
if (event.error === 'network') {
    console.warn('Network error, will restart via onend');
    return; // Ne fait rien, onend va gérer
}
```

### 4. Logs de Debug Ajoutés
```typescript
// Dans onresult
console.log('Final transcript updated:', final.trim());

// Dans stopRecording
console.log('Recording stopped. Final transcript:', finalText);

// Dans handleNext
console.log('Sending transcript to next question:', finalText);

// Dans onend
console.log('Restarting speech recognition...');
```

## 🧪 Comment Tester

### Test 1: Enregistrement Simple
```
1. Ouvre la console (F12)
2. Clique sur le micro
3. Parle pendant 5-10 secondes
4. Clique sur Stop
5. Vérifie dans la console:
   ✅ "Final transcript updated: [ton texte]"
   ✅ "Recording stopped. Final transcript: [ton texte]"
6. Clique sur "Question Suivante"
7. Vérifie dans la console:
   ✅ "Sending transcript to next question: [ton texte]"
```

### Test 2: Enregistrement Long (avec reconnexions)
```
1. Ouvre la console
2. Clique sur le micro
3. Parle pendant 60+ secondes
4. Observe dans la console:
   ✅ "Restarting speech recognition..." (peut apparaître plusieurs fois)
   ✅ "Final transcript updated: ..." (à chaque phrase)
5. Clique sur Stop
6. Vérifie que tout le texte est bien là
```

### Test 3: Vérifier la Sauvegarde
```
1. Enregistre une réponse
2. Clique sur "Question Suivante"
3. Dans la console, cherche:
   "Sending transcript to next question: [ton texte]"
4. Vérifie que le texte n'est pas "No transcription available"
```

## 🔍 Messages de Console à Surveiller

### ✅ Messages Normaux (OK)
```
✅ "Final transcript updated: ..."
✅ "Recording stopped. Final transcript: ..."
✅ "Restarting speech recognition..."
✅ "Sending transcript to next question: ..."
```

### ⚠️ Messages d'Avertissement (Normal)
```
⚠️ "Speech recognition error: network"
⚠️ "Network error in speech recognition, will restart via onend"
⚠️ "Speech recognition error: no-speech"
```

### ❌ Messages d'Erreur (Problème)
```
❌ "Too many restart attempts, stopping recognition"
   → Problème de connexion persistant
   
❌ "Permission micro refusée"
   → Autoriser le micro dans le navigateur
   
❌ "Sending transcript to next question: No transcription available"
   → Rien n'a été enregistré
```

## 🐛 Si Rien Ne S'Enregistre

### Vérification 1: Micro Autorisé?
```
1. Clique sur l'icône de cadenas dans la barre d'adresse
2. Vérifie que "Microphone" est sur "Autoriser"
3. Recharge la page
```

### Vérification 2: Navigateur Compatible?
```
✅ Chrome - Recommandé
✅ Edge - Recommandé
⚠️ Safari - Peut nécessiter config spéciale
❌ Firefox - Support limité
```

### Vérification 3: Console Logs
```
1. Ouvre la console (F12)
2. Clique sur le micro
3. Parle
4. Tu DOIS voir:
   - "Final transcript updated: [texte]"
   
Si tu ne vois PAS ce message:
   → L'API de reconnaissance ne fonctionne pas
   → Vérifie la connexion internet
   → Essaie un autre navigateur
```

### Vérification 4: État de la Transcription
```
Après avoir parlé et cliqué sur Stop:
1. Regarde l'écran
2. Tu DOIS voir ton texte affiché dans une carte blanche
3. Si la carte est vide → Problème de sauvegarde
4. Regarde la console pour "Recording stopped. Final transcript: ..."
```

## 🔧 Solutions aux Problèmes Courants

### Problème: "Too many restart attempts"
**Cause:** Connexion internet instable
**Solution:** 
- Vérifie ta connexion
- Recharge la page
- Réessaie

### Problème: Transcription vide
**Cause:** Micro ne capte pas le son
**Solution:**
- Vérifie que le micro fonctionne (test dans paramètres système)
- Parle plus fort
- Rapproche-toi du micro

### Problème: Erreurs réseau en boucle
**Cause:** API Google Speech inaccessible
**Solution:**
- Vérifie ta connexion internet
- Essaie avec un VPN si bloqué
- Réessaie plus tard

### Problème: "No transcription available"
**Cause:** Rien n'a été capturé
**Solution:**
- Vérifie les logs dans la console
- Assure-toi que le micro est autorisé
- Parle pendant au moins 2-3 secondes

## 📊 Checklist de Fonctionnement

Avant de dire que ça ne marche pas, vérifie:

- [ ] Chrome ou Edge utilisé
- [ ] Micro autorisé dans le navigateur
- [ ] Connexion internet active
- [ ] Console ouverte pour voir les logs
- [ ] Parlé pendant au moins 3 secondes
- [ ] Vu "Final transcript updated" dans la console
- [ ] Vu le texte affiché après Stop
- [ ] Cliqué sur "Question Suivante"
- [ ] Vu "Sending transcript" dans la console

Si TOUS ces points sont ✅ et que ça ne marche toujours pas, il y a un vrai bug.

## 🎯 Prochaines Étapes

1. **Teste maintenant** avec la console ouverte
2. **Note les messages** que tu vois
3. **Copie les erreurs** s'il y en a
4. **Dis-moi ce qui se passe** exactement

Avec les logs, je pourrai voir exactement où ça bloque ! 🔍


