import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';

const functions = getFunctions(app, 'europe-west1');

export const emailService = {
  sendTestEmail: async (data: any) => {
    const sendEmailFn = httpsCallable(functions, 'sendEmail');
    return sendEmailFn(data);
  }
}; 
