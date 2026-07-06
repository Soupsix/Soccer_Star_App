import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { Tournament } from '@/types/tournament.types';

export class TournamentService {
  /**
   * Fetches all tournaments from Firestore.
   */
  static async getAllTournaments(): Promise<Tournament[]> {
    try {
      const tourRef = collection(db, 'tournaments');
      const snap = await getDocs(tourRef);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      return [];
    }
  }

  /**
   * Fetches a specific tournament by ID.
   */
  static async getTournament(id: string): Promise<Tournament | null> {
    try {
      const docRef = doc(db, 'tournaments', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return {
          id: snap.id,
          ...snap.data()
        } as Tournament;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching tournament with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Fetches all active tournaments.
   */
  static async getActiveTournament(): Promise<Tournament[]> {
    try {
      const tourRef = collection(db, 'tournaments');
      const q = query(tourRef, where('isActive', '==', true));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
    } catch (error) {
      console.error("Error fetching active tournaments:", error);
      return [];
    }
  }

  /**
   * Fetches all matches belonging to a specific tournament.
   */
  static async getMatchesByTournament(tournamentId: string): Promise<any[]> {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('tournamentId', '==', tournamentId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error fetching matches for tournament ${tournamentId}:`, error);
      return [];
    }
  }
}
