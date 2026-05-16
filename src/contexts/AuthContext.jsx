import { createContext, useContext, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          // Sync user with backend
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser({
              ...data.user,
              firebaseUser,
              token,
            });
          }
        } catch (err) {
          console.error('Backend sync error:', err);
          // Still set user from Firebase even if backend sync fails
          setUser({
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber,
            displayName: firebaseUser.displayName,
            photoUrl: firebaseUser.photoURL,
            firebaseUser,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [API_URL]);

  // Get fresh token for API calls
  const getToken = async () => {
    if (user?.firebaseUser) {
      return await user.firebaseUser.getIdToken();
    }
    return null;
  };

  // Set persistence based on "Remember Me" preference
  const applyPersistence = async (rememberMe) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
  };

  // Google Sign-In
  const signInWithGoogle = async (rememberMe = true) => {
    setError(null);
    try {
      await applyPersistence(rememberMe);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Email Sign-Up
  const signUpWithEmail = async (email, password, displayName, rememberMe = true) => {
    setError(null);
    try {
      await applyPersistence(rememberMe);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Email Sign-In
  const signInWithEmail = async (email, password, rememberMe = true) => {
    setError(null);
    try {
      await applyPersistence(rememberMe);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Phone Sign-In — Step 1: Send OTP
  const sendPhoneOtp = async (phoneNumber, recaptchaContainerId, rememberMe = true) => {
    setError(null);
    try {
      await applyPersistence(rememberMe);

      // Clean up existing reCAPTCHA verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        },
      });

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      return confirmationResult;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Phone Sign-In — Step 2: Verify OTP
  const verifyPhoneOtp = async (otp) => {
    setError(null);
    try {
      if (!window.confirmationResult) {
        throw new Error('No verification in progress');
      }
      const result = await window.confirmationResult.confirm(otp);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    logout,
    getToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
