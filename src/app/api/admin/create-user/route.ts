import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: Request) {
  try {
    // Initialize Firebase Admin
    const { adminApp, error } = initAdmin();
    
    // Check if initialization failed
    if (error || !adminApp) {
      console.error('Firebase Admin initialization failed:', error);
      return NextResponse.json(
        { 
          message: 'Server configuration error. Please contact an administrator.', 
          error: error?.message || 'Unknown error' 
        },
        { status: 500 }
      );
    }

    // Get Admin SDK instances
    const adminAuth = getAuth(adminApp);
    const adminDb = getFirestore(adminApp);

    // Parse request body
    const body = await request.json();
    const { email, password, firstName, lastName, company, phone, role, locationId } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user with Firebase Admin SDK
    try {
      // This uses the Admin SDK which has full privileges
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`
      });

      // Create user document in Firestore using Admin SDK
      await adminDb.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        company: company || '',
        phone: phone || '',
        role: role || 'customer',
        locationId: locationId === 'none' ? null : locationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({ 
        success: true, 
        userId: userRecord.uid 
      });
    } catch (error: any) {
      // Check for specific Firebase error codes
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { message: 'This email is already in use', code: 'auth/email-already-in-use' },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Error in admin create-user API:', error);
    
    // Format the error message to be more client friendly
    const errorMessage = error.message || 'An error occurred while creating the user';
    const errorCode = error.code || 'unknown_error';
    
    return NextResponse.json(
      { message: errorMessage, code: errorCode },
      { status: 500 }
    );
  }
} 