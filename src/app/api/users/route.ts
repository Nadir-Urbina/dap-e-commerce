import { NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
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

    // Since we're hitting permission issues with the Firebase Auth API in server context,
    // we'll return a specific response to handle user creation on the client side
    return NextResponse.json({
      success: false,
      needsClientAuth: true,
      userData: {
        email,
        password,
        firstName,
        lastName,
        company: company || '',
        phone: phone || '',
        role: role || 'customer',
        locationId: locationId === 'none' ? null : locationId
      }
    });
  } catch (error: any) {
    console.error('Error in user API:', error);
    
    // Format the error message to be more client friendly
    const errorMessage = error.code === 'auth/email-already-in-use'
      ? 'This email is already in use'
      : error.message || 'An error occurred while creating the user';
    
    return NextResponse.json(
      { message: errorMessage, code: error.code },
      { status: 400 }
    );
  }
} 