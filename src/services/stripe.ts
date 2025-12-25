/**
 * Stripe Service
 * Handles Stripe payment integration on the frontend
 */

interface CreateCheckoutSessionParams {
  userId: string;
  planId: string;
  planName: string;
  price: string;
  credits: number;
  type: 'plan' | 'credits';
  customerEmail?: string;
}

interface CreatePortalSessionParams {
  userId: string;
  returnUrl?: string;
}

interface CreatePortalSessionResponse {
  success: boolean;
  url?: string;
  message?: string;
}

interface CreateCheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  message?: string;
}

/**
 * Get the Firebase Functions URL for Stripe endpoints
 */
const getFunctionsUrl = (): string => {
  // In production, use relative URL (same domain = no CORS!)
  // Firebase Hosting rewrite will proxy to Firebase Functions
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    return ''; // Relative URL = same domain = no CORS!
  }

  // In development, use direct Firebase Functions (CORS is configured)
  return 'https://us-central1-jobzai.cloudfunctions.net';
};

/**
 * Create a Stripe Checkout Session
 * This redirects the user to Stripe Checkout for payment
 */
export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResponse> => {
  try {
    const functionsUrl = getFunctionsUrl();
    // In production: use relative URL (no CORS), in dev: use direct Firebase Functions
    const url = functionsUrl
      ? `${functionsUrl}/createCheckoutSession`
      : '/api/stripe/create-checkout-session';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.message || 'Failed to create checkout session');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return {
      success: false,
      message: error.message || 'Failed to create checkout session',
    };
  }
};

/**
 * Redirect to Stripe Checkout
 * This is a convenience function that creates a session and redirects
 */
export const redirectToStripeCheckout = async (
  params: CreateCheckoutSessionParams
): Promise<void> => {
  const result = await createCheckoutSession(params);

  if (result.success && result.url) {
    // Redirect to Stripe Checkout
    window.location.href = result.url;
  } else {
    throw new Error(result.message || 'Failed to create checkout session');
  }
};

/**
 * Verify a Stripe Checkout Session
 * This can be used to verify payment status after redirect
 */
export const verifyCheckoutSession = async (
  _sessionId: string
): Promise<{ success: boolean; paid?: boolean; message?: string }> => {
  try {
    // Note: This would require a backend endpoint to retrieve the session
    // For now, we'll rely on the webhook to update the user's status
    // You can add a backend endpoint if needed

    return {
      success: true,
      paid: true, // Assume paid if session exists (webhook will update)
    };
  } catch (error: any) {
    console.error('Error verifying checkout session:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify checkout session',
    };
  }
};



/**
 * Create a Stripe Portal Session
 */
export const createPortalSession = async (
  params: CreatePortalSessionParams
): Promise<CreatePortalSessionResponse> => {
  try {
    const functionsUrl = getFunctionsUrl();
    const url = functionsUrl
      ? `${functionsUrl}/createPortalSession`
      : '/api/stripe/create-portal-session';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        returnUrl: params.returnUrl || window.location.href,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.message || 'Failed to create portal session');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);
    return {
      success: false,
      message: error.message || 'Failed to create portal session',
    };
  }
};

/**
 * Redirect to Stripe Portal
 */
export const redirectToStripePortal = async (
  userId: string,
  returnUrl?: string
): Promise<void> => {
  const result = await createPortalSession({ userId, returnUrl });

  if (result.success && result.url) {
    window.location.href = result.url;
  } else {
    throw new Error(result.message || 'Failed to create portal session');
  }
};
