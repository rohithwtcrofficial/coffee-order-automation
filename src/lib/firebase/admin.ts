// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { adminConfig } from './config';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: adminConfig.projectId,
      clientEmail: adminConfig.clientEmail,
      privateKey: adminConfig.privateKey,
    }),
  });
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
}

export { adminApp, adminAuth, adminDb };