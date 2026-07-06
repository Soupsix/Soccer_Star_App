import { db } from '../core/firebaseAdmin';
import { StadiumDoc } from '../normalizers/stadium.normalizer';

export class StadiumService {
  private static cache: Record<string, string> = {};

  /**
   * Upserts a stadium document, merging fresh metadata without overwriting existing data.
   */
  static async upsertStadium(stadium: StadiumDoc): Promise<'created' | 'merged' | 'skipped'> {
    try {
      const docRef = db.collection('stadiums').doc(stadium.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        await docRef.set(stadium);
        this.cache[stadium.id] = stadium.name;
        return 'created';
      }

      const existingData = docSnap.data() as StadiumDoc;
      let modified = false;
      const updates: Partial<StadiumDoc> = {};

      if (stadium.capacity > 0 && existingData.capacity !== stadium.capacity) {
        updates.capacity = stadium.capacity;
        modified = true;
      }
      if (stadium.image && !existingData.image) {
        updates.image = stadium.image;
        modified = true;
      }
      if (stadium.surface && existingData.surface !== stadium.surface) {
        updates.surface = stadium.surface;
        modified = true;
      }

      if (modified) {
        await docRef.update(updates);
        return 'merged';
      }

      this.cache[stadium.id] = existingData.name;
      return 'skipped';
    } catch (error) {
      console.error(`Error in StadiumService.upsertStadium for ${stadium.id}:`, error);
      throw error;
    }
  }

  /**
   * Resolves a stadium's unique ID by name, using cache when possible.
   */
  static async resolveStadiumIdByName(name: string): Promise<string | null> {
    if (!name) return null;

    // Search cache
    for (const [id, cachedName] of Object.entries(this.cache)) {
      if (cachedName.toLowerCase() === name.toLowerCase()) {
        return id;
      }
    }

    // Search Firestore
    try {
      const snap = await db.collection('stadiums')
        .where('name', '==', name)
        .limit(1)
        .get();

      if (!snap.empty) {
        const id = snap.docs[0].id;
        this.cache[id] = name;
        return id;
      }
      return null;
    } catch (error) {
      console.error(`Error resolving stadium by name: ${name}`, error);
      return null;
    }
  }
}
