# Plan d'Intégration HubSpot

## Vue d'ensemble

Ce document décrit le plan d'intégration HubSpot pour synchroniser les données des utilisateurs et permettre la création de campagnes marketing.

## Objectifs

1. **Synchronisation des contacts** : Envoyer les données des nouveaux utilisateurs à HubSpot
2. **Mise à jour des profils** : Synchroniser les mises à jour de profil avec HubSpot
3. **Suivi des événements** : Tracker les événements importants (inscription, complétion de profil, connexion)
4. **Campagnes marketing** : Permettre la création de workflows et campagnes dans HubSpot

## Architecture

### Approche Simple (Recommandée)

Utilisation de l'API HubSpot via Firebase Cloud Functions pour :
- Créer/mettre à jour des contacts lors de l'inscription
- Synchroniser les données de profil
- Envoyer des événements pour les workflows HubSpot

### Données à synchroniser

#### À l'inscription (minimum)
- Email (obligatoire)
- Prénom (firstName)
- Nom (lastName)
- Date de création (createdAt)
- Source d'inscription (email/password ou Google)

#### Lors de la complétion du profil (optionnel)
- Téléphone
- Localisation
- Titre professionnel
- Entreprise actuelle
- LinkedIn
- Autres données de profil pertinentes

#### Événements à tracker
- `user_signed_up` : Nouvelle inscription
- `email_verified` : Email vérifié
- `profile_completed` : Profil complété
- `user_logged_in` : Connexion (optionnel, peut être limité)

## Étapes d'implémentation

### Phase 1 : Configuration HubSpot (5 min)

1. **Créer un compte HubSpot** (si pas déjà fait)
2. **Créer un Private App** dans HubSpot :
   - Settings → Integrations → Private Apps
   - Permissions nécessaires :
     - `contacts` : read, write
     - `timeline` : write (pour les événements)
3. **Récupérer l'API Key** (ou utiliser OAuth pour plus de sécurité)

### Phase 2 : Service HubSpot (15 min)

Créer un service HubSpot dans `src/services/hubspot.ts` qui :
- Gère l'authentification API
- Crée/met à jour des contacts
- Envoie des événements

### Phase 3 : Firebase Functions (20 min)

Créer des Cloud Functions pour :
- `syncUserToHubSpot` : Synchroniser un utilisateur
- `onUserCreated` : Trigger Firestore pour nouvelles inscriptions
- `onUserUpdated` : Trigger Firestore pour mises à jour

### Phase 4 : Intégration dans AuthContext (10 min)

Modifier `AuthContext.tsx` pour :
- Appeler la fonction de sync après inscription
- Appeler la fonction de sync après complétion de profil

### Phase 5 : Configuration et Variables d'environnement (5 min)

- Stocker la clé API HubSpot dans Firestore (settings/hubspot)
- Ou utiliser Firebase Functions config

## Structure des données HubSpot

### Propriétés de contact personnalisées (à créer dans HubSpot)

- `jobzai_user_id` : ID Firebase de l'utilisateur
- `jobzai_signup_date` : Date d'inscription
- `jobzai_profile_completed` : Booléen
- `jobzai_last_login` : Dernière connexion
- `jobzai_credits` : Nombre de crédits
- `jobzai_source` : Source d'inscription (email/google)

### Événements Timeline

- `user_signed_up` : Inscription
- `email_verified` : Email vérifié
- `profile_completed` : Profil complété
- `campaign_created` : Campagne créée (futur)

## Sécurité

- **Clé API** : Stockée dans Firestore (settings/hubspot) ou Firebase Functions config
- **Validation** : Vérifier que l'utilisateur est authentifié avant sync
- **Gestion d'erreurs** : Ne pas bloquer l'inscription si HubSpot échoue (log seulement)

## Coûts et limites

- **HubSpot Free** : 1M contacts, API rate limit : 100 req/10s
- **HubSpot Starter** : Illimité, rate limit plus élevé
- Pour un volume faible, le plan gratuit suffit largement

## Tests

1. Tester l'inscription d'un nouvel utilisateur
2. Vérifier la création du contact dans HubSpot
3. Tester la mise à jour du profil
4. Vérifier les événements dans la timeline HubSpot

## Prochaines étapes (optionnel)

- Workflows HubSpot automatiques (bienvenue, onboarding)
- Segmentation des utilisateurs
- Campagnes email automatisées
- Analytics et reporting

## Notes importantes

- L'intégration est **non-bloquante** : si HubSpot échoue, l'inscription continue
- Les erreurs sont loggées mais n'affectent pas l'expérience utilisateur
- La synchronisation est **asynchrone** via Cloud Functions pour ne pas ralentir l'UI



