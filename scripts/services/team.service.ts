import { db } from '../core/firebaseAdmin';
import { TeamDoc } from '../normalizers/team.normalizer';

export class TeamService {
  private static nameToIdCache: Record<string, string> = {};

  /**
   * Upserts a team document. Merges additional data fields without corrupting existing records.
   */
  static async upsertTeam(team: TeamDoc): Promise<'created' | 'merged' | 'skipped'> {
    try {
      const docRef = db.collection('teams').doc(team.id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        await docRef.set(team);
        this.nameToIdCache[team.name.toLowerCase()] = team.id;
        return 'created';
      }

      const existingData = docSnap.data() as TeamDoc;
      let modified = false;
      const updates: Partial<TeamDoc> = {};

      if (team.logo && !existingData.logo) {
        updates.logo = team.logo;
        modified = true;
      }
      if (team.stadiumId && !existingData.stadiumId) {
        updates.stadiumId = team.stadiumId;
        modified = true;
      }
      if (team.description && existingData.description !== team.description) {
        updates.description = team.description;
        modified = true;
      }

      if (modified) {
        await docRef.update(updates);
        return 'merged';
      }

      this.nameToIdCache[existingData.name.toLowerCase()] = existingData.id;
      return 'skipped';
    } catch (error) {
      console.error(`Error in TeamService.upsertTeam for ${team.id}:`, error);
      throw error;
    }
  }

  /**
   * Resolves a team's ID by name, using cache when possible.
   */
  static async resolveTeamIdByName(name: string): Promise<string | null> {
    if (!name) return null;

    const lowerName = name.toLowerCase().trim();
    if (this.nameToIdCache[lowerName]) {
      return this.nameToIdCache[lowerName];
    }

    try {
      // Find in Firestore
      const snap = await db.collection('teams')
        .where('name', '==', name)
        .limit(1)
        .get();

      if (!snap.empty) {
        const id = snap.docs[0].id;
        this.nameToIdCache[lowerName] = id;
        return id;
      }

      // Try searching case-insensitive through all teams in cache
      // Since Firestore doesn't support easy case-insensitive queries, we build a partial cache
      const allSnap = await db.collection('teams').limit(150).get();
      allSnap.docs.forEach((doc: any) => {
        const d = doc.data() as TeamDoc;
        this.nameToIdCache[d.name.toLowerCase()] = d.id;
      });

      if (this.nameToIdCache[lowerName]) {
        return this.nameToIdCache[lowerName];
      }

      return null;
    } catch (error) {
      console.error(`Error resolving team name ${name}:`, error);
      return null;
    }
  }
}
