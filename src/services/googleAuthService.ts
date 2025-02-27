import { gapi } from 'gapi-script';

const CLIENT_ID = 'VOTRE_CLIENT_ID'; // Récupérez-le depuis Google Cloud Console
const API_KEY = 'VOTRE_API_KEY'; // Optionnel, pour les requêtes publiques
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export const initGoogleApi = async () => {
  try {
    await new Promise((resolve, reject) => {
      gapi.load('client:auth2', () => resolve(true));
    });

    await gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: [DISCOVERY_DOC],
      scope: SCOPES,
    });

    // Vérifier si déjà connecté
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error initializing Google API:', error);
    throw error;
  }
};

export const signInToGoogle = async () => {
  try {
    const auth = gapi.auth2.getAuthInstance();
    const user = await auth.signIn();
    return user;
  } catch (error) {
    console.error('Error signing in to Google:', error);
    throw error;
  }
};

export const signOutFromGoogle = async () => {
  try {
    const auth = gapi.auth2.getAuthInstance();
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out from Google:', error);
    throw error;
  }
}; 