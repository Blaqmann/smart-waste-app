import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile, UserRole, NigerianState } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to sync user profile with auth state
  const syncUserProfile = async (firebaseUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;

        // Check if emailVerified status needs to be updated
        if (profileData.emailVerified !== firebaseUser.emailVerified) {

          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            emailVerified: firebaseUser.emailVerified,
            updatedAt: new Date()
          });

          // Fetch updated profile
          const updatedDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const updatedData = updatedDoc.data() as UserProfile;

          setUserProfile(updatedData);
          return true;
        } else {
          setUserProfile(profileData);
          return false;
        }
      } else {
        console.warn('User profile not found in Firestore');
        setUserProfile(null);
        return false;
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
      setUserProfile(null);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Always reload user to get latest email verification status
        await firebaseUser.reload();
        const currentUser = auth.currentUser;

        if (currentUser) {
          setUser(currentUser);
          await syncUserProfile(currentUser);
        } else {
          setUser(firebaseUser);
          await syncUserProfile(firebaseUser);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Always reload to get latest verification status
    await result.user.reload();
    const updatedUser = auth.currentUser;

    if (!updatedUser) {
      throw new Error('Authentication failed');
    }

    // Check if email is verified
    if (!updatedUser.emailVerified) {
      await sendEmailVerification(updatedUser);
      throw new Error('Please verify your email before logging in. A new verification email has been sent.');
    }

    // Sync user profile after login
    await syncUserProfile(updatedUser);

    return result;
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    region: NigerianState,
    role: UserRole = 'user'
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with display name
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

      // Send email verification
      await sendEmailVerification(auth.currentUser);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        displayName: displayName,
        role: role,
        region: region,
        emailVerified: false, // Start as false, will update when verified
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);

      // Always reload to get latest user data
      await result.user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        setUser(updatedUser);
        setUserProfile(userProfile);
      }
    }

    return result;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // New function to refresh user data (call this after email verification)
  const refreshUserData = async () => {
    if (user) {
      // Reload the user to get latest email verification status
      await user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        setUser({ ...updatedUser });
        const updated = await syncUserProfile(updatedUser);
        return updated;
      }
    }
    return false;
  };

  // Function to resend verification email
  const resendVerificationEmail = async () => {
    if (user) {
      await sendEmailVerification(user);
    }
  };

  // Function to check if email is verified in real-time
  const checkEmailVerification = async () => {
    if (user) {
      await user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        const wasUpdated = await syncUserProfile(updatedUser);
        return {
          isVerified: updatedUser.emailVerified,
          user: updatedUser,
          profileUpdated: wasUpdated
        };
      }
    }
    return { isVerified: false, user: null, profileUpdated: false };
  };

  return {
    user,
    userProfile,
    login,
    register,
    logout,
    loading,
    refreshUserData,
    resendVerificationEmail,
    checkEmailVerification
  };
};