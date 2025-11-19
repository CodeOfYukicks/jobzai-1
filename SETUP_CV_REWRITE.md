# CV Rewrite - Configuration Rapide

## ⚠️ Les boutons AI ne marchent pas?

**Raison:** L'API key OpenAI n'est pas configurée.

---

## ✅ Solution Rapide (2 minutes)

### **Option 1: Configure l'API Key** (Pour tester maintenant)

1. **Obtiens ta clé API OpenAI:**
   - Va sur https://platform.openai.com/api-keys
   - Crée une nouvelle clé API
   - Copie la clé

2. **Configure la clé:**
   ```bash
   cd /Users/rouchditouil/jobzai-1-3
   
   # Crée ou édite .env.local
   echo "VITE_OPENAI_API_KEY=sk-proj-..." > .env.local
   # Remplace sk-proj-... avec ta vraie clé
   ```

3. **Restart le serveur:**
   ```bash
   # Arrête le serveur (Ctrl+C)
   npm run dev
   ```

4. **Test!**
   - Refresh la page CV Rewrite
   - Clique sur un bouton AI
   - Ça devrait marcher! ✨

---

### **Option 2: Run une Nouvelle Analyse** (Meilleur pour production)

Le Cloud Function est déjà déployé avec le CV Rewrite automatique!

```
1. Va sur /cv-analysis
2. Click "New Analysis"  
3. Upload CV + job details
4. Attends l'analyse (~60-90s)
5. Le CV Rewrite sera PRÉ-GÉNÉRÉ
6. Click "CV Rewrite" tab
7. ✨ Tout sera déjà là!
```

**Avantages:**
- ✅ Pas besoin d'API key client
- ✅ CV rewrite instantané
- ✅ 6 templates déjà générés
- ✅ Meilleure expérience utilisateur

---

## 🎯 Quelle Option Choisir?

### **Pour tester MAINTENANT:**
→ **Option 1** (API key)

### **Pour la meilleure expérience:**
→ **Option 2** (Nouvelle analyse)

---

## 💡 Note Importante

**Les boutons AI** (Rewrite, Improve Tone, etc.) sont des **améliorations en temps réel** qui nécessitent l'API key.

**Le CV Rewrite initial** (généré par l'analyse) n'a PAS besoin d'API key client - il est fait server-side!

Donc:
- ✅ Nouvelle analyse → CV rewrite auto-généré (gratuit pour le client)
- ✅ Boutons AI → Améliorations en temps réel (nécessite API key)

---

## 🚀 Configuration Complète

```bash
# 1. Configure API key
cd /Users/rouchditouil/jobzai-1-3
nano .env.local

# Ajoute:
VITE_OPENAI_API_KEY=your_actual_openai_key_here

# 2. Restart
npm run dev

# 3. Test
# Clique sur un bouton AI → Devrait marcher!
```

---

## ✅ Checklist

- [ ] API key obtenue sur OpenAI
- [ ] Fichier .env.local créé
- [ ] VITE_OPENAI_API_KEY configuré
- [ ] Serveur restarté
- [ ] Page refreshée
- [ ] Bouton AI testé

**Une fois configuré, tous les 6 boutons AI marcheront parfaitement!** ⚡



