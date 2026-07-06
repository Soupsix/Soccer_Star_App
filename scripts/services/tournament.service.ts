import { db } from '../core/firebaseAdmin';

export interface TournamentDoc {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  continent: string;
  isActive: boolean;
}

export class TournamentService {
  private static nameCache: Record<string, string> = {};

  /**
   * Upserts a tournament document.
   */
  static async upsertTournament(tourney: TournamentDoc): Promise<'created' | 'merged' | 'skipped'> {
    try {
      const docRef = db.collection('tournaments').doc(tourney.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        await docRef.set(tourney);
        this.nameCache[tourney.id] = tourney.name;
        return 'created';
      }

      const existingData = docSnap.data() as TournamentDoc;
      let modified = false;
      const updates: Partial<TournamentDoc> = {};

      if (tourney.logo && !existingData.logo) {
        updates.logo = tourney.logo;
        modified = true;
      }
      if (existingData.isActive !== tourney.isActive) {
        updates.isActive = tourney.isActive;
        modified = true;
      }

      if (modified) {
        await docRef.update(updates);
        return 'merged';
      }

      this.nameCache[tourney.id] = existingData.name;
      return 'skipped';
    } catch (error) {
      console.error(`Error in TournamentService.upsertTournament for ${tourney.id}:`, error);
      throw error;
    }
  }

  /**
   * Resolves a tournament name by ID, using in-memory cache to optimize read count.
   */
  static async getTournamentName(id: string): Promise<string> {
    if (this.nameCache[id]) {
      return this.nameCache[id];
    }

    try {
      const docSnap = await db.collection('tournaments').doc(id).get();
      if (docSnap.exists) {
        const name = docSnap.data()?.name || 'Unknown Tournament';
        this.nameCache[id] = name;
        return name;
      }
      return 'Unknown Tournament';
    } catch (error) {
      console.error(`Error resolving tournament name for ID ${id}:`, error);
      return 'Unknown Tournament';
    }
  }
}
