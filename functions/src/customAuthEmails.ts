// Custom Auth Emails via Brevo
// Sends branded transactional emails instead of Firebase default emails

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import {
    getEmailVerificationTemplate,
    getPasswordResetTemplate,
    getWelcomeEmailTemplate,
    EmailTemplateData
} from './lib/emailTemplates';

// Get Brevo API key from Firestore
const getBrevoApiKey = async (): Promise<string | null> => {
    try {
        const settingsDoc = await admin.firestore().collection('settings').doc('brevo').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            return data?.apiKey || data?.api_key || null;
        }
    } catch (error) {
        console.error('Failed to get Brevo API key from Firestore:', error);
    }

    // Fallback to environment
    if (process.env.BREVO_API_KEY) {
        return process.env.BREVO_API_KEY;
    }

    // Fallback to Firebase config
    try {
        const config = functions.config();
        if (config.brevo?.api_key) {
            return config.brevo.api_key;
        }
    } catch (e) {
        console.warn('Could not access Firebase config');
    }

    return null;
};

// Send email via Brevo transactional API
const sendBrevoEmail = async (
    apiKey: string,
    to: { email: string; name?: string },
    subject: string,
    htmlContent: string
): Promise<boolean> => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey.trim(),
            },
            body: JSON.stringify({
                sender: {
                    name: 'Cubbbe',
                    email: 'hello@cubbbe.com',
                },
                to: [to],
                subject,
                htmlContent,
                // Optional: Add reply-to
                replyTo: {
                    email: 'hello@cubbbe.com',
                    name: 'Cubbbe Support',
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Brevo API error:', response.status, errorText);
            return false;
        }

        console.log('✅ Email sent successfully via Brevo');
        return true;
    } catch (error) {
        console.error('Error sending email via Brevo:', error);
        return false;
    }
};

/**
 * Send custom verification email
 * Called from the client after user registration
 */
export const sendCustomVerificationEmail = onRequest({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    try {
        const { email, displayName, continueUrl } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        console.log('📧 Sending custom verification email to:', email);

        // Get Brevo API key
        const apiKey = await getBrevoApiKey();
        if (!apiKey) {
            console.error('Brevo API key not configured');
            res.status(500).json({ success: false, message: 'Email service not configured' });
            return;
        }

        // Generate Firebase verification link
        const actionCodeSettings = {
            url: continueUrl || 'https://cubbbe.com/complete-profile',
            handleCodeInApp: false,
        };

        const verificationLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
        console.log('✅ Verification link generated');

        // Prepare template data
        const templateData: EmailTemplateData = {
            recipientEmail: email,
            recipientName: displayName || undefined,
            verificationLink,
            appName: 'Cubbbe',
        };

        // Generate HTML
        const htmlContent = getEmailVerificationTemplate(templateData);

        // Send email via Brevo
        const success = await sendBrevoEmail(
            apiKey,
            { email, name: displayName || undefined },
            'Welcome to Cubbbe! Verify your email ✨',
            htmlContent
        );

        if (success) {
            res.status(200).json({ success: true, message: 'Verification email sent' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error: any) {
        console.error('Error in sendCustomVerificationEmail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

/**
 * Send custom password reset email
 * Can be called from client or triggered by Firebase
 */
export const sendCustomPasswordResetEmail = onRequest({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    try {
        const { email, continueUrl } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        console.log('🔐 Sending custom password reset email to:', email);

        // Get Brevo API key
        const apiKey = await getBrevoApiKey();
        if (!apiKey) {
            console.error('Brevo API key not configured');
            res.status(500).json({ success: false, message: 'Email service not configured' });
            return;
        }

        // Get user info for name
        let displayName: string | undefined;
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            displayName = userRecord.displayName || undefined;
        } catch (e) {
            // User might not exist, continue anyway
        }

        // Generate Firebase password reset link
        const actionCodeSettings = {
            url: continueUrl || 'https://cubbbe.com/login',
            handleCodeInApp: false,
        };

        const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
        console.log('✅ Password reset link generated');

        // Prepare template data
        const templateData: EmailTemplateData = {
            recipientEmail: email,
            recipientName: displayName,
            resetLink,
            appName: 'Cubbbe',
        };

        // Generate HTML
        const htmlContent = getPasswordResetTemplate(templateData);

        // Send email via Brevo
        const success = await sendBrevoEmail(
            apiKey,
            { email, name: displayName },
            'Reset your Cubbbe password 🔐',
            htmlContent
        );

        if (success) {
            res.status(200).json({ success: true, message: 'Password reset email sent' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error: any) {
        console.error('Error in sendCustomPasswordResetEmail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

/**
 * Send welcome email after verification
 * Called after user verifies their email
 */
export const sendWelcomeEmail = onRequest({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    try {
        const { email, displayName } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        console.log('🎉 Sending welcome email to:', email);

        // Get Brevo API key
        const apiKey = await getBrevoApiKey();
        if (!apiKey) {
            res.status(500).json({ success: false, message: 'Email service not configured' });
            return;
        }

        // Prepare template data
        const templateData: EmailTemplateData = {
            recipientEmail: email,
            recipientName: displayName || undefined,
            appName: 'Cubbbe',
        };

        // Generate HTML
        const htmlContent = getWelcomeEmailTemplate(templateData);

        // Send email via Brevo
        const success = await sendBrevoEmail(
            apiKey,
            { email, name: displayName || undefined },
            "You're all set! Let's find your dream job 🚀",
            htmlContent
        );

        if (success) {
            res.status(200).json({ success: true, message: 'Welcome email sent' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error: any) {
        console.error('Error in sendWelcomeEmail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

/**
 * Send test email
 * Use this to verify Brevo configuration and template rendering
 */
export const sendTestEmail = onRequest({
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    try {
        const { email, type = 'verification' } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        console.log(`🧪 Sending test email (${type}) to:`, email);

        // Get Brevo API key
        const apiKey = await getBrevoApiKey();
        if (!apiKey) {
            res.status(500).json({ success: false, message: 'Email service not configured' });
            return;
        }

        let htmlContent = '';
        let subject = '';

        const templateData: EmailTemplateData = {
            recipientEmail: email,
            recipientName: 'Test User',
            verificationLink: 'https://cubbbe.com/verify-test',
            resetLink: 'https://cubbbe.com/reset-test',
            appName: 'Cubbbe',
        };

        switch (type) {
            case 'welcome':
                htmlContent = getWelcomeEmailTemplate(templateData);
                subject = 'Test: Welcome Email';
                break;
            case 'reset':
                htmlContent = getPasswordResetTemplate(templateData);
                subject = 'Test: Password Reset';
                break;
            case 'verification':
            default:
                htmlContent = getEmailVerificationTemplate(templateData);
                subject = 'Test: Email Verification';
                break;
        }

        // Send email via Brevo
        const success = await sendBrevoEmail(
            apiKey,
            { email, name: 'Test User' },
            subject,
            htmlContent
        );

        if (success) {
            res.status(200).json({ success: true, message: `Test email (${type}) sent` });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error: any) {
        console.error('Error in sendTestEmail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
