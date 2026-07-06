import { db } from '../core/firebaseAdmin';
import { PlayerDoc } from '../normalizers/player.normalizer';

export class PlayerService {
  /**
   * Upserts a player document.
   */
  static async upsertPlayer(player: PlayerDoc): Promise<'created' | 'merged' | 'skipped'> {
    try {
      const docRef = db.collection('players').doc(player.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        await docRef.set(player);
        return 'created';
      }

      const existingData = docSnap.data() as PlayerDoc;
      let modified = false;
      const updates: Partial<PlayerDoc> = {};

      if (player.image && !existingData.image) {
        updates.image = player.image;
        modified = true;
      }
      if (player.position && existingData.position !== player.position) {
        updates.position = player.position;
        modified = true;
      }
      if (player.teamId && existingData.teamId !== player.teamId) {
        updates.teamId = player.teamId;
        modified = true;
      }

      if (modified) {
        await docRef.update(updates);
        return 'merged';
      }

      return 'skipped';
    } catch (error) {
      console.error(`Error in PlayerService.upsertPlayer for ${player.id}:`, error);
      throw error;
    }
  }

  /**
   * Links a match to a player as their next match if applicable.
   */
  static async updatePlayerNextMatch(playerId: string, matchId: string): Promise<void> {
    try {
      const docRef = db.collection('players').doc(playerId);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.update({ nextMatchId: matchId, updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error(`Error updating next match for player ${playerId}:`, error);
    }
  }
}
