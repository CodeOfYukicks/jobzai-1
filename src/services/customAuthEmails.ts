// Custom Auth Email Service
// Calls our Cloud Functions to send branded emails via Brevo

// Always use production URL for custom auth emails
const FUNCTIONS_BASE_URL = 'https://us-central1-jobzai.cloudfunctions.net';

/**
 * Send custom verification email via our Cloud Function
 */
export async function sendCustomVerificationEmail(
    email: string,
    displayName?: string,
    continueUrl?: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${FUNCTIONS_BASE_URL}/sendCustomVerificationEmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                displayName,
                continueUrl: continueUrl || `${window.location.origin}/complete-profile`,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error sending custom verification email:', error);
        return { success: false, message: error.message || 'Failed to send verification email' };
    }
}

/**
 * Send custom password reset email via our Cloud Function
 */
export async function sendCustomPasswordResetEmail(
    email: string,
    continueUrl?: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${FUNCTIONS_BASE_URL}/sendCustomPasswordResetEmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                continueUrl: continueUrl || `${window.location.origin}/login`,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error sending custom password reset email:', error);
        return { success: false, message: error.message || 'Failed to send password reset email' };
    }
}

/**
 * Send welcome email after verification via our Cloud Function
 */
export async function sendWelcomeEmail(
    email: string,
    displayName?: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${FUNCTIONS_BASE_URL}/sendWelcomeEmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                displayName,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error sending welcome email:', error);
        return { success: false, message: error.message || 'Failed to send welcome email' };
    }
}
