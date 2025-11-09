/**
 * HubSpot Service
 * Service pour synchroniser les données utilisateur avec HubSpot
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface HubSpotContact {
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

export interface HubSpotEvent {
  eventName: string;
  email: string;
  properties?: Record<string, any>;
}

/**
 * Synchronise un utilisateur avec HubSpot
 */
export async function syncUserToHubSpot(
  contact: HubSpotContact,
  eventName?: string,
  eventProperties?: Record<string, any>
): Promise<void> {
  try {
    console.log('🔄 Syncing user to HubSpot:', contact.email);
    
    // Use Firebase Hosting rewrite to avoid CORS issues (same domain)
    const functionUrl = `/api/sync-hubspot`;
    
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
      console.log('✅ User synced to HubSpot successfully:', data.contactId);
    } else {
      console.warn('⚠️  HubSpot sync failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error syncing user to HubSpot:', error);
    // Ne pas bloquer l'utilisateur si HubSpot échoue
  }
}

/**
 * Envoie un événement à HubSpot
 */
export async function sendHubSpotEvent(
  email: string,
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    const sendEvent = httpsCallable(functions, 'sendHubSpotEventFunction');
    await sendEvent({
      email,
      eventName,
      properties,
    });
  } catch (error) {
    console.error('Error sending event to HubSpot:', error);
    // Ne pas bloquer l'utilisateur si HubSpot échoue
  }
}

