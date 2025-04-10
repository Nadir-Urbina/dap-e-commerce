'use client';

import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Simple JavaScript version without TypeScript
export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            console.warn('User document not found in Firestore');
            setUserData(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError(err instanceof Error ? err : new Error('Unknown error fetching user data'));
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register a new user
  const register = async (email, password, firstName, lastName, company, phone) => {
    try {
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        company: company,
        phone: phone,
        role: 'customer',
        paymentMethods: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return firebaseUser;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err : new Error('Unknown registration error'));
      throw err;
    }
  };

  // Sign in existing user
  const signIn = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err : new Error('Unknown sign in error'));
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Unknown sign out error'));
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (data) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('No user is signed in');
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Refresh user data
      const updatedDoc = await getDoc(userDocRef);
      if (updatedDoc.exists()) {
        setUserData(updatedDoc.data());
      }
      
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err : new Error('Unknown profile update error'));
      throw err;
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    isAdmin: userData?.role === 'admin',
    isStaff: userData?.role === 'staff',
    register,
    signIn,
    signOut,
    updateUserProfile
  };
} 