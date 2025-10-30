import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  AuthError,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from './firebase';
import { GOOGLE_OAUTH_CLIENT_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: {
    state: string;
    port: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  boatDetails?: {
    name: string;
    registrationNumber: string;
    type: string;
    length: number;
  };
  experience?: {
    yearsOfFishing: number;
    specialization: string[];
    preferredZones: string[];
  };
  createdAt?: any;
  updatedAt?: any;
}

class AuthService {
  // Register new user with email and password
  async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location: {
          state: '',
          port: ''
        },
        experience: {
          yearsOfFishing: 0,
          specialization: [],
          preferredZones: []
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Google sign-in timeout - please try again'));
        }, 30000); // 30 second timeout
      });

      // Create the actual sign-in promise
      const signInPromise = this.performGoogleSignIn();

      // Race between sign-in and timeout
      const user = await Promise.race([signInPromise, timeoutPromise]);
      return user;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      if (error.message?.includes('timeout')) {
        throw new Error('Google sign-in timed out. Please check your internet connection and try again.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  private async performGoogleSignIn(): Promise<User> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'seasure',
      });

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_OAUTH_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_OAUTH_CLIENT_ID,
            code: result.params.code,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
            redirectUri,
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        if (tokenResult.accessToken) {
          const credential = GoogleAuthProvider.credential(tokenResult.idToken, tokenResult.accessToken);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          const existingProfile = await this.getUserProfile(user.uid);
          if (!existingProfile) {
            const userProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              location: {
                state: '',
                port: ''
              },
              experience: {
                yearsOfFishing: 0,
                specialization: [],
                preferredZones: []
              }
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);
          }

          return user;
        } else {
          throw new Error('Failed to get access token');
        }
      } else {
        throw new Error('Google Sign-In was cancelled or failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  // Sign in with email and password with timeout
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Login timeout - please check your internet connection and try again'));
        }, 15000); // 15 second timeout
      });

      // Race between login and timeout
      const userCredential = await Promise.race([
        signInWithEmailAndPassword(auth, email, password),
        timeoutPromise
      ]);

      return userCredential.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle common Firebase auth errors with better messages
      if (error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your internet and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please wait a few minutes and try again.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update user location
  async updateUserLocation(uid: string, location: UserProfile['location']): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        location,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }

  // Update user boat details
  async updateUserBoatDetails(uid: string, boatDetails: UserProfile['boatDetails']): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        boatDetails,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user boat details:', error);
      throw error;
    }
  }

  // Update user experience
  async updateUserExperience(uid: string, experience: UserProfile['experience']): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        experience,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user experience:', error);
      throw error;
    }
  }

  // Update profile picture
  async updateProfilePicture(uid: string, photoURL: string): Promise<void> {
    try {
      // Update Firebase Auth profile
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { photoURL });
      }

      // Update Firestore profile
      await updateDoc(doc(db, 'users', uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();