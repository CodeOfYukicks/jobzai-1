# ⚠️ IMPORTANT : Redémarrer le serveur Express

## Problème
Le serveur Express tourne avec une ancienne version qui n'a pas la route Stripe.

## Solution
**Vous DEVEZ redémarrer le serveur Express pour que la route Stripe fonctionne.**

### Étapes :

1. **Trouvez le terminal où tourne `npm run dev:with-server` ou `npm run server`**

2. **Arrêtez le serveur** :
   - Appuyez sur `Ctrl+C` dans le terminal

3. **Redémarrez le serveur** :
   ```bash
   npm run dev:with-server
   ```

4. **Vérifiez dans la console du serveur** que vous voyez :
   ```
   Stripe Checkout proxy available at http://localhost:3000/api/stripe/create-checkout-session
   ```

5. **Rechargez la page dans le navigateur** (Ctrl+Shift+R ou Cmd+Shift+R)

6. **Testez à nouveau** en cliquant sur "Proceed to Payment"

---

## Pourquoi c'est nécessaire ?

Le serveur Express charge le fichier `server.cjs` au démarrage. Si vous modifiez le fichier après le démarrage, le serveur ne connaît pas les nouvelles routes. Il faut le redémarrer pour qu'il recharge le fichier avec les nouvelles routes.

---

## Vérification

Après redémarrage, testez dans le navigateur :
- L'erreur 404 devrait disparaître
- Vous devriez être redirigé vers Stripe Checkout


