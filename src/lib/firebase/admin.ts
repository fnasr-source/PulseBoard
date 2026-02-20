import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

function getServiceAccount() {
    // Try environment variable first
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

    // Fall back to the JSON file at project root
    const serviceAccountPath = path.join(
        process.cwd(),
        'pulseboard-ab03b-firebase-adminsdk-fbsvc-0f445bbb1f.json'
    );

    if (fs.existsSync(serviceAccountPath)) {
        const raw = fs.readFileSync(serviceAccountPath, 'utf-8');
        return JSON.parse(raw);
    }

    throw new Error(
        'Firebase Admin SDK service account not found. Set FIREBASE_SERVICE_ACCOUNT_KEY env var or place the JSON file at project root.'
    );
}

let adminApp: App;

if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'pulseboard-ab03b',
        storageBucket: 'pulseboard-ab03b.firebasestorage.app',
    });
} else {
    adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

export default adminApp;
