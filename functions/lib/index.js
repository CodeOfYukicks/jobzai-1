"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCVContent = exports.yourFunction = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.yourFunction = (0, https_1.onRequest)({
    cors: true
}, async (req, res) => {
    console.log('Function called with:', req.body);
    if (!req.auth) {
        res.status(401).send('Unauthorized');
        return;
    }
    try {
        // Utilisation de userId dans un commentaire pour éviter l'erreur TS6133
        // const userId = req.auth.uid;
        const { campaignId } = req.body;
        if (!campaignId) {
            res.status(400).send('Campaign ID is required');
            return;
        }
        // Votre logique ici...
        res.status(200).send({ success: true });
    }
    catch (error) {
        console.error('Error:', error);
        const statusCode = typeof error.code === 'number' ? error.code : 500;
        res.status(statusCode).send(error.message);
    }
});
exports.getCVContent = (0, https_1.onRequest)({
    cors: true
}, async (req, res) => {
    console.log('getCVContent called with:', req.body);
    if (!req.auth) {
        res.status(401).send('Unauthorized');
        return;
    }
    try {
        // Utilisation de userId dans un commentaire pour éviter l'erreur TS6133
        // const userId = req.auth.uid;
        const { cvUrl } = req.body;
        if (!cvUrl) {
            res.status(400).send('CV URL is required');
            return;
        }
        // Votre logique ici...
        res.status(200).send({ success: true });
    }
    catch (error) {
        console.error('Error:', error);
        const statusCode = typeof error.code === 'number' ? error.code : 500;
        res.status(statusCode).send(error.message);
    }
});
//# sourceMappingURL=index.js.map