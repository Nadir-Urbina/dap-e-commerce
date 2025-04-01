import { initializeApp, getApps, cert } from 'firebase-admin/app';

let adminApp: any;

export function initAdmin() {
  const apps = getApps();
  
  if (!apps.length) {
    try {
      // Get individual environment variables for the service account
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      // Check if all required variables are set
      if (!projectId || !clientEmail || !privateKey) {
        const missing = [];
        if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
        if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!privateKey) missing.push('FIREBASE_SERVICE_ACCOUNT_KEY');
        
        throw new Error(`Missing required Firebase Admin environment variables: ${missing.join(', ')}`);
      }
      
      // Create service account object manually
      const serviceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };
      
      // Initialize with the created service account
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      // Instead of throwing, return null with an error flag
      return { adminApp: null, error: error };
    }
  } else {
    adminApp = apps[0];
  }

  return { adminApp };
} 