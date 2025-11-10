#!/bin/bash

# Script pour redémarrer le serveur Express avec la route Stripe

echo "🔄 Arrêt des processus sur le port 3000..."

# Tuer tous les processus sur le port 3000
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null

# Attendre un peu
sleep 2

echo "✅ Port 3000 libéré"
echo ""
echo "📋 Pour redémarrer le serveur, exécutez :"
echo "   npm run dev:with-server"
echo ""
echo "   OU si vous avez deux terminaux séparés :"
echo "   Terminal 1: npm run server"
echo "   Terminal 2: npm run dev"
echo ""


