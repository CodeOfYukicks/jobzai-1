/**
 * Tracking Events — Meta Pixel (fbq) & TikTok Pixel (ttq)
 *
 * Centralised helpers for firing conversion events.
 * Both pixels are loaded globally via index.html; these wrappers
 * gracefully no-op when the scripts haven't loaded (ad-blockers, etc.).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        ttq?: { track: (...args: any[]) => void };
    }
}

/** EVENT 1 — Signup (free account created) */
export function trackLead(): void {
    try {
        if (typeof window.fbq !== 'undefined') {
            window.fbq('track', 'Lead');
        }
        if (typeof window.ttq !== 'undefined') {
            window.ttq.track('CompleteRegistration');
        }
        console.log('[Tracking] Lead / CompleteRegistration fired');
    } catch (e) {
        console.warn('[Tracking] Error firing Lead event:', e);
    }
}

/** EVENT 2 — First dashboard visit (new user) */
export function trackStartTrial(): void {
    try {
        if (typeof window.fbq !== 'undefined') {
            window.fbq('track', 'StartTrial');
        }
        if (typeof window.ttq !== 'undefined') {
            window.ttq.track('Subscribe');
        }
        console.log('[Tracking] StartTrial / Subscribe fired');
    } catch (e) {
        console.warn('[Tracking] Error firing StartTrial event:', e);
    }
}

/** EVENT 3 — Successful Stripe payment */
export function trackPurchase(value: number, currency = 'EUR'): void {
    try {
        if (typeof window.fbq !== 'undefined') {
            window.fbq('track', 'Purchase', { value, currency });
        }
        if (typeof window.ttq !== 'undefined') {
            window.ttq.track('PlaceAnOrder', {
                contents: [{ content_type: 'product' }],
                value,
                currency,
            });
        }
        console.log(`[Tracking] Purchase / PlaceAnOrder fired — €${value}`);
    } catch (e) {
        console.warn('[Tracking] Error firing Purchase event:', e);
    }
}
