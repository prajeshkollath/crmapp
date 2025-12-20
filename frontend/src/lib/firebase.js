// Firebase configuration and initialization
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Set persistence to local (survives browser restarts)
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.';
    }
    return { user: null, error: message };
  }
};

export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    
    // Send email verification
    await sendEmailVerification(result.user);
    
    return { user: result.user, error: null };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    }
    return { user: null, error: message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email address.';
    }
    return { success: false, error: message };
  }
};

export const confirmReset = async (oobCode, newPassword) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const changePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await updatePassword(user, newPassword);
    return { success: true, error: null };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/requires-recent-login') {
      message = 'Please sign out and sign in again before changing your password.';
    }
    return { success: false, error: message };
  }
};

export const updateUserProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await updateProfile(user, updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await sendEmailVerification(user);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    // Clear any local storage data
    sessionStorage.removeItem('demo_user');
    localStorage.removeItem('crm_demo_contacts');
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

export { auth, onAuthStateChanged };
