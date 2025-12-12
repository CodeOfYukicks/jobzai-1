# Guide des Logs - Sélecteur d'IA

## Comment vérifier quel provider est utilisé

### 🔍 Logs Frontend (Console du navigateur)

Ouvrez la console de votre navigateur (F12) et vous verrez :

#### Lors de la sélection d'un modèle
```
🤖 [AI SELECTOR] User selected: Claude Sonnet 4.5 (anthropic)
✅ [AI SELECTOR] Preference saved to Firestore: anthropic
```

#### Lors de l'envoi d'un message
```
🤖 ════════════════════════════════════════════════════════
🤖 [REQUEST] Using AI Provider: Claude Sonnet 4.5
🤖 [REQUEST] Provider ID: anthropic
🤖 [REQUEST] Model: claude-sonnet-4.5
🤖 [REQUEST] Message: Bonjour, comment puis-je améliorer mon...
🤖 ════════════════════════════════════════════════════════
```

#### Lors de la réception de la réponse
```
✅ [RESPONSE] Received 542 characters from Claude Sonnet 4.5
```

### 🖥️ Logs Backend (Terminal du serveur)

Dans votre terminal où tourne le serveur, vous verrez :

```
🤖 ════════════════════════════════════════════════════════
🤖 AI Assistant endpoint called
🤖 ┌─────────────────────────────────────────────────────┐
🤖 │ AI Provider: ANTHROPIC                              │
🤖 │ User: Rouchdi                                       │
🤖 │ Message: Bonjour, comment puis-je améliorer...     │
🤖 └─────────────────────────────────────────────────────┘
📡 Sending request to ANTHROPIC for assistant response (streaming)...
🤖 ════════════════════════════════════════════════════════

🧠 [ANTHROPIC] Calling Claude Sonnet 4.5...
✅ Claude Assistant response completed (streamed)
   Response length: 542 chars
```

## Icônes par provider

| Provider | Icône | Couleur | Log |
|----------|-------|---------|-----|
| OpenAI | ✨ (SVG OpenAI logo) | Vert `#10a37f` | `✨ [OPENAI] Calling GPT-5.2...` |
| Anthropic | 🧠 (SVG Anthropic "A") | Orange `#d97757` | `🧠 [ANTHROPIC] Calling Claude Sonnet 4.5...` |
| Gemini | ⚡ (SVG Google Gemini) | Bleu `#4285f4` | `⚡ [GEMINI] Calling Gemini 3...` |

## Améliorations du Modal

### Avant
- Taille : `w-72` (288px)
- Icons : Sparkles, Brain, Zap génériques
- Padding : Large

### Après
- Taille : `w-64` (256px) - **Plus compact** ✅
- Icons : **Logos officiels OpenAI, Anthropic, Google** ✅
- Padding : Réduit pour un design plus serré
- Font sizes : Réduites (xs au lieu de sm)

## Exemple de flux complet

### 1. L'utilisateur clique sur le sélecteur
**Console navigateur :**
```
(Modal s'ouvre)
```

### 2. L'utilisateur sélectionne "Claude Sonnet 4.5"
**Console navigateur :**
```
🤖 [AI SELECTOR] User selected: Claude Sonnet 4.5 (anthropic)
✅ [AI SELECTOR] Preference saved to Firestore: anthropic
```

**Notification :** "Switched to Claude Sonnet 4.5" ✅

### 3. L'utilisateur envoie un message
**Console navigateur :**
```
🤖 ════════════════════════════════════════════════════════
🤖 [REQUEST] Using AI Provider: Claude Sonnet 4.5
🤖 [REQUEST] Provider ID: anthropic
🤖 [REQUEST] Model: claude-sonnet-4.5
🤖 [REQUEST] Message: Comment améliorer mon CV ?...
🤖 ════════════════════════════════════════════════════════
```

**Terminal serveur :**
```
🤖 ════════════════════════════════════════════════════════
🤖 AI Assistant endpoint called
🤖 ┌─────────────────────────────────────────────────────┐
🤖 │ AI Provider: ANTHROPIC                              │
🤖 │ User: Rouchdi                                       │
🤖 │ Message: Comment améliorer mon CV ?...              │
🤖 └─────────────────────────────────────────────────────┘
📡 Sending request to ANTHROPIC for assistant response (streaming)...
🤖 ════════════════════════════════════════════════════════

🧠 [ANTHROPIC] Calling Claude Sonnet 4.5...
```

### 4. La réponse arrive
**Console navigateur :**
```
✅ [RESPONSE] Received 1247 characters from Claude Sonnet 4.5
```

**Terminal serveur :**
```
✅ Claude Assistant response completed (streamed)
   Response length: 1247 chars
```

## Dépannage avec les logs

### Le provider ne change pas
❌ **Symptôme :** Vous sélectionnez Claude mais les logs montrent OpenAI
```
🤖 [REQUEST] Provider ID: openai  ← Devrait être "anthropic"
```

**Solutions :**
1. Vérifier dans Firestore : `users/{userId}/assistantAIProvider`
2. Rafraîchir la page
3. Vérifier les erreurs dans la console

### Erreur d'API
❌ **Symptôme :** Le serveur retourne une erreur
```
❌ Claude API error status: 401
```

**Solutions :**
1. Vérifier que la clé API est configurée dans Firestore : `settings/anthropic/apiKey`
2. Vérifier que la clé est valide
3. Vérifier les logs du serveur pour plus de détails

### Le streaming ne fonctionne pas
❌ **Symptôme :** Pas de texte qui apparaît progressivement

**Vérifier dans les logs :**
```
✅ [RESPONSE] Received 0 characters from ...  ← Devrait être > 0
```

**Solutions :**
1. Vérifier la connexion internet
2. Vérifier que l'API du provider est accessible
3. Vérifier les logs du serveur pour voir les erreurs de streaming

## Commandes utiles

### Filtrer les logs dans la console
```javascript
// Filtrer uniquement les logs AI
localStorage.setItem('debug', 'ai:*');

// Voir tous les logs
console.log.apply(console, arguments);
```

### Surveiller le serveur
```bash
# Dans le terminal où tourne le serveur
# Les logs s'afficheront automatiquement avec les emojis et couleurs
```

## Tips

1. **Garder la console ouverte** pendant les tests pour voir les logs en temps réel
2. **Comparer les logs frontend et backend** pour diagnostiquer les problèmes
3. **Les emojis facilitent la lecture** : ✨ = OpenAI, 🧠 = Claude, ⚡ = Gemini
4. **Les boîtes ASCII** rendent les logs serveur plus lisibles

