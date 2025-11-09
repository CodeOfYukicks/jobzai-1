/**
 * Brevo Service
 * Service pour synchroniser les données utilisateur avec Brevo (ex-Sendinblue)
 */

export interface BrevoContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: any; // Pour les propriétés personnalisées
}

/**
 * Synchronise un utilisateur avec Brevo
 */
export async function syncUserToBrevo(
  contact: BrevoContact,
  eventName?: string,
  eventProperties?: Record<string, any>
): Promise<void> {
  try {
    console.log('🔄 Syncing user to Brevo:', contact.email);
    
    // Use Firebase Hosting rewrite to avoid CORS issues (same domain)
    const functionUrl = `/api/sync-brevo`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact,
        eventName,
        eventProperties,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as { success: boolean; message?: string; contactId?: string };
    
    if (data.success) {
      console.log('✅ User synced to Brevo successfully:', data.contactId);
    } else {
      console.warn('⚠️  Brevo sync failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error syncing user to Brevo:', error);
    // Ne pas bloquer l'utilisateur si Brevo échoue
  }
}


