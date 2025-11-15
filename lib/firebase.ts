import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

let adminInitialized = false;

function initAdmin() {
	if (adminInitialized) return;
	const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
	if (saEnv) {
		try {
			const serviceAccount = JSON.parse(saEnv) as ServiceAccount;
			initializeApp({ credential: cert(serviceAccount) });
		} catch {
			// Fallback to default credentials if parsing fails
			initializeApp({ credential: applicationDefault() });
		}
	} else if (!getApps().length) {
		initializeApp({ credential: applicationDefault() });
	}
	adminInitialized = true;
}

export function getAdminDb() {
	initAdmin();
	return getFirestore();
}




