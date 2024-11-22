import * as functions from 'firebase-functions';
import axios from 'axios';

export const startCampaign = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    const response = await axios.post("https://hook.eu1.make.com/ormdfwy6ahw3315p13gfrryc4h5uJ1s", data);
    return { success: true };
  } catch (error) {
    console.error('Webhook error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to start campaign');
  }
}); 