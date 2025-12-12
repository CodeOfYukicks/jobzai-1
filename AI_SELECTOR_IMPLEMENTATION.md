# Sélecteur d'IA pour l'Assistant - Implémentation Complète

## Vue d'ensemble

L'assistant dispose maintenant d'un sélecteur d'IA permettant à l'utilisateur de choisir entre 3 modèles d'IA différents :
- **GPT-5.2** (OpenAI)
- **Claude Sonnet 4.5** (Anthropic)
- **Gemini 3** (Google)

Le système de contexte existant (mentions @, pageContext, userContext, pageData) est conservé et fonctionne avec tous les providers.

## Fonctionnalités

### Frontend

#### Sélecteur d'IA
- Bouton "Auto" remplacé par un sélecteur d'IA avec icône et nom du modèle
- Modal élégant avec les 3 options d'IA
- Indicateur visuel du modèle actuellement sélectionné
- Icônes distinctes pour chaque provider :
  - OpenAI : Sparkles ✨
  - Anthropic : Brain 🧠
  - Gemini : Zap ⚡

#### Sauvegarde de préférence
- La préférence est sauvegardée dans Firestore : `users/{userId}`
- Champ : `assistantAIProvider` (valeurs : 'openai', 'anthropic', 'gemini')
- Synchronisation automatique sur tous les appareils
- Chargement au montage du composant
- Pas besoin de règles spéciales, utilise le document utilisateur existant

### Backend

#### Récupération des clés API
Trois nouvelles fonctions dans `server.cjs` :
- `getAnthropicApiKey()` - Récupère depuis `settings/anthropic`
- `getGeminiApiKey()` - Récupère depuis `settings/gemini`
- `getOpenAIApiKey()` - Existant, récupère depuis `settings/openai`

Chaque fonction :
1. Essaie de récupérer depuis Firestore
2. Fallback sur les variables d'environnement
3. Retourne null si non trouvée

#### Fonctions d'appel API
Deux nouvelles fonctions pour gérer le streaming :
- `callClaudeAssistant(messages, systemPrompt, apiKey, res)`
- `callGeminiAssistant(messages, systemPrompt, apiKey, res)`

Chaque fonction :
- Convertit le format des messages pour l'API correspondante
- Gère le streaming SSE (Server-Sent Events)
- Maintient le système de contexte existant
- Log les erreurs et succès

#### Endpoint `/api/assistant`
Modifications :
1. Extrait `aiProvider` du body (default: 'openai')
2. Récupère la clé API appropriée selon le provider
3. Route vers la bonne fonction d'appel API
4. Conserve tout le système de contexte existant

## Configuration Firestore

### Clés API (Collection `settings`)
```
settings/
  ├── openai/
  │   └── apiKey: "sk-..."
  ├── anthropic/
  │   └── apiKey: "sk-ant-..."
  └── gemini/
      └── apiKey: "AIza..."
```

### Préférences utilisateur (Collection `users`)
```
users/
  └── {userId}/
      ├── name: "..."
      ├── email: "..."
      ├── assistantAIProvider: "openai" | "anthropic" | "gemini"  ← Nouveau champ
      └── ...autres champs existants
```

## Modèles utilisés

| Provider | Model | Endpoint |
|----------|-------|----------|
| OpenAI | `gpt-5.2` | `api.openai.com/v1/chat/completions` |
| Anthropic | `claude-sonnet-4.5` | `api.anthropic.com/v1/messages` |
| Google | `gemini-3` | `generativelanguage.googleapis.com/v1beta/models/gemini-3:streamGenerateContent` |

## Tests à effectuer

### 1. Test du sélecteur UI
- [ ] Ouvrir l'assistant
- [ ] Cliquer sur le bouton avec l'icône et le nom du modèle
- [ ] Vérifier que le modal s'ouvre avec les 3 options
- [ ] Sélectionner chaque option et vérifier le changement visuel
- [ ] Vérifier que le modal se ferme après sélection

### 2. Test de la sauvegarde Firestore
- [ ] Sélectionner un modèle différent
- [ ] Vérifier dans Firestore : `users/{userId}` → champ `assistantAIProvider`
- [ ] Rafraîchir la page
- [ ] Vérifier que le modèle sélectionné est conservé

### 3. Test OpenAI (GPT-5.2)
- [ ] Sélectionner GPT-5.2
- [ ] Envoyer un message simple : "Bonjour"
- [ ] Vérifier le streaming de la réponse
- [ ] Tester avec une mention @ (ex: @Applications)
- [ ] Vérifier que le contexte est bien pris en compte

### 4. Test Claude (Sonnet 4.5)
- [ ] Configurer la clé API dans `settings/anthropic`
- [ ] Sélectionner Claude Sonnet 4.5
- [ ] Envoyer un message : "Explique-moi comment améliorer mon CV"
- [ ] Vérifier le streaming de la réponse
- [ ] Tester avec pageContext (naviguer vers /applications)
- [ ] Vérifier que Claude comprend le contexte de la page

### 5. Test Gemini (Gemini 3)
- [ ] Configurer la clé API dans `settings/gemini`
- [ ] Sélectionner Gemini 3
- [ ] Envoyer un message : "Quelles sont mes candidatures en cours ?"
- [ ] Vérifier le streaming de la réponse
- [ ] Tester avec pageData (avoir des applications en cours)
- [ ] Vérifier que Gemini accède aux données de la page

### 6. Test de gestion d'erreurs
- [ ] Supprimer temporairement une clé API de Firestore
- [ ] Sélectionner ce provider
- [ ] Envoyer un message
- [ ] Vérifier qu'un message d'erreur clair s'affiche
- [ ] Vérifier le log dans la console serveur

### 7. Test de contexte avancé
- [ ] Créer une conversation avec plusieurs messages
- [ ] Changer de provider en cours de conversation
- [ ] Vérifier que l'historique est conservé
- [ ] Vérifier que le nouveau provider répond en contexte

## Dépannage

### Erreur : "API key is missing"
**Cause** : La clé API n'est pas configurée dans Firestore
**Solution** : 
1. Aller dans Firestore
2. Collection `settings`
3. Document `openai`, `anthropic`, ou `gemini`
4. Ajouter le champ `apiKey` avec la clé

### Erreur : "Failed to retrieve API key"
**Cause** : Problème de permissions Firestore
**Solution** : Vérifier les règles Firestore pour la collection `settings`

### Le streaming ne fonctionne pas
**Cause** : Headers SSE non configurés correctement
**Solution** : Vérifier que les headers sont définis avant l'envoi de données

### Le modèle ne change pas
**Cause** : Cache du navigateur ou préférence non sauvegardée
**Solution** :
1. Vérifier la console du navigateur pour les erreurs
2. Vérifier Firestore que la préférence est bien sauvegardée
3. Rafraîchir la page

## Fichiers modifiés

### Frontend
- `src/components/assistant/ChatInput.tsx`
  - Ajout du sélecteur d'IA
  - Logique de sauvegarde/chargement Firestore
  - Inclusion de `aiProvider` dans la requête

### Backend
- `server.cjs`
  - Ajout de `getAnthropicApiKey()`
  - Ajout de `getGeminiApiKey()`
  - Ajout de `callClaudeAssistant()`
  - Ajout de `callGeminiAssistant()`
  - Modification de l'endpoint `/api/assistant` pour router selon le provider

## Notes importantes

1. **Fallback GPT-5.2** : Si le modèle `gpt-5.2` n'existe pas encore, OpenAI utilisera automatiquement `gpt-4o` ou le modèle le plus récent disponible.

2. **Format des messages** : Chaque API a son propre format de messages. Les fonctions `callClaudeAssistant()` et `callGeminiAssistant()` convertissent automatiquement le format.

3. **Système de contexte** : Le système de contexte existant (`buildAssistantSystemPrompt()`) fonctionne avec tous les providers. Le system prompt est adapté selon l'API :
   - OpenAI : message avec `role: "system"`
   - Claude : paramètre `system` séparé
   - Gemini : ajouté comme premier message user/model

4. **Streaming** : Tous les providers supportent le streaming SSE pour une expérience utilisateur fluide.

5. **Sécurité** : Les clés API sont stockées dans Firestore et ne sont jamais exposées au client.

## Prochaines étapes

- [ ] Tester en production avec de vrais utilisateurs
- [ ] Monitorer les performances de chaque provider
- [ ] Ajouter des métriques (temps de réponse, qualité des réponses)
- [ ] Permettre à l'admin de désactiver certains providers
- [ ] Ajouter un fallback automatique si un provider est down

