import { db } from '../core/firebaseAdmin';
import { MatchDoc, MatchEventDoc } from '../normalizers/match.normalizer';

export class MatchService {
  /**
   * Upserts a match document.
   */
  static async upsertMatch(match: MatchDoc): Promise<'created' | 'merged' | 'skipped'> {
    try {
      const docRef = db.collection('matches').doc(match.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        await docRef.set(match);
        return 'created';
      }

      const existingData = docSnap.data() as MatchDoc;
      let modified = false;
      const updates: Partial<MatchDoc> = {};

      if (existingData.status !== match.status) {
        updates.status = match.status;
        modified = true;
      }
      if (existingData.minute !== match.minute) {
        updates.minute = match.minute;
        modified = true;
      }
      if (existingData.homeScore !== match.homeScore) {
        updates.homeScore = match.homeScore;
        modified = true;
      }
      if (existingData.awayScore !== match.awayScore) {
        updates.awayScore = match.awayScore;
        modified = true;
      }
      if (match.penalty && (!existingData.penalty || existingData.penalty.home !== match.penalty.home || existingData.penalty.away !== match.penalty.away)) {
        updates.penalty = match.penalty;
        modified = true;
      }

      if (modified) {
        updates.updatedAt = new Date().toISOString();
        await docRef.update(updates);
        return 'merged';
      }

      return 'skipped';
    } catch (error) {
      console.error(`Error in MatchService.upsertMatch for ${match.id}:`, error);
      throw error;
    }
  }

  /**
   * Upserts multiple match events into the match_events collection.
   */
  static async upsertMatchEvents(events: MatchEventDoc[]): Promise<void> {
    if (events.length === 0) return;
    try {
      const batch = db.batch();
      events.forEach((event) => {
        const docRef = db.collection('match_events').doc(event.id);
        batch.set(docRef, event, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      console.error(`Error in MatchService.upsertMatchEvents:`, error);
      throw error;
    }
  }
}
