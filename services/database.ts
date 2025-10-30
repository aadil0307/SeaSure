import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './auth';

// Trip log interface
export interface TripLog {
  id?: string;
  userId: string;
  date: Timestamp;
  departure: {
    time: Timestamp;
    location: {
      latitude: number;
      longitude: number;
      name: string;
    };
  };
  arrival?: {
    time: Timestamp;
    location: {
      latitude: number;
      longitude: number;
      name: string;
    };
  };
  catch: {
    species: string;
    quantity: number;
    weight: number;
    size?: number;
  }[];
  weatherConditions: {
    temperature: number;
    windSpeed: number;
    waveHeight: number;
    visibility: number;
  };
  fuelUsed: number;
  expenses: {
    fuel: number;
    bait: number;
    ice: number;
    other: number;
    total: number;
  };
  revenue?: number;
  notes?: string;
  images?: string[];
  createdAt: any;
  updatedAt: any;
}

// Alert interface
export interface Alert {
  id?: string;
  type: 'weather' | 'ban' | 'safety' | 'community' | 'market';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  validUntil: Timestamp;
  isActive: boolean;
  authorId?: string;
  targetUsers?: string[]; // specific user IDs, empty for all users
  createdAt: any;
  updatedAt: any;
}

// Fish market data interface
export interface MarketData {
  id?: string;
  location: string;
  species: string;
  price: number;
  currency: string;
  date: Timestamp;
  quality: 'poor' | 'average' | 'good' | 'excellent';
  availability: 'low' | 'medium' | 'high';
  reportedBy: string;
  createdAt: any;
}

class DatabaseService {
  // User operations
  async createUser(userProfile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userProfile.uid), userProfile);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Trip log operations
  async createTripLog(tripLog: Omit<TripLog, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'tripLogs'));
      const tripWithTimestamp = {
        ...tripLog,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, tripWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error creating trip log:', error);
      throw error;
    }
  }

  async getUserTripLogs(userId: string, limitCount = 20): Promise<TripLog[]> {
    try {
      const q = query(
        collection(db, 'tripLogs'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TripLog[];
    } catch (error) {
      console.error('Error fetching trip logs:', error);
      throw error;
    }
  }

  async updateTripLog(tripId: string, data: Partial<TripLog>): Promise<void> {
    try {
      await updateDoc(doc(db, 'tripLogs', tripId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating trip log:', error);
      throw error;
    }
  }

  // Alert operations
  async createAlert(alert: Omit<Alert, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'alerts'));
      const alertWithTimestamp = {
        ...alert,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, alertWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async getActiveAlerts(userLocation?: { latitude: number; longitude: number }): Promise<Alert[]> {
    try {
      const q = query(
        collection(db, 'alerts'),
        where('isActive', '==', true),
        where('validUntil', '>', Timestamp.now()),
        orderBy('validUntil', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Alert[];

      // Filter by location if provided
      if (userLocation) {
        return alerts.filter(alert => {
          if (!alert.location) return true; // Global alerts
          // Calculate distance and filter by radius
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            alert.location.latitude,
            alert.location.longitude
          );
          return distance <= alert.location.radius;
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  // Market data operations
  async addMarketData(marketData: Omit<MarketData, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'marketData'));
      const dataWithTimestamp = {
        ...marketData,
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, dataWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding market data:', error);
      throw error;
    }
  }

  async getMarketData(location?: string, species?: string): Promise<MarketData[]> {
    try {
      let q = query(
        collection(db, 'marketData'),
        orderBy('date', 'desc'),
        limit(50)
      );

      if (location) {
        q = query(q, where('location', '==', location));
      }

      if (species) {
        q = query(q, where('species', '==', species));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MarketData[];
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  // Utility functions
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Add user's favorite zones
  async addFavoriteZone(userId: string, zoneId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        favoriteZones: arrayUnion(zoneId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding favorite zone:', error);
      throw error;
    }
  }

  async removeFavoriteZone(userId: string, zoneId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        favoriteZones: arrayRemove(zoneId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing favorite zone:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
