import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query,
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { ClientMatch } from '@/types/match.types';

export class MatchService {
  private static teamCache: Record<string, { name: string; logo: string }> = {};
  private static tournamentCache: Record<string, string> = {};
  private static stadiumCache: Record<string, string> = {};
  private static cachesLoaded = false;

  private static async preloadCache(): Promise<void> {
    try {
      const teamsRef = collection(db, 'teams');
      const teamsSnap = await getDocs(teamsRef);
      teamsSnap.docs.forEach(docSnap => {
        const d = docSnap.data();
        this.teamCache[docSnap.id] = {
          name: d?.name || 'Unknown Team',
          logo: d?.flagUrl || d?.logo || ''
        };
      });

      const tourneyRef = collection(db, 'tournaments');
      const tourneySnap = await getDocs(tourneyRef);
      tourneySnap.docs.forEach(docSnap => {
        const d = docSnap.data();
        this.tournamentCache[docSnap.id] = d?.name || 'Unknown Tournament';
      });

      const stadiumRef = collection(db, 'stadiums');
      const stadiumSnap = await getDocs(stadiumRef);
      stadiumSnap.docs.forEach(docSnap => {
        const d = docSnap.data();
        this.stadiumCache[docSnap.id] = d?.name || '';
      });
      this.cachesLoaded = true;
    } catch (error) {
      console.error("Error preloading caches in MatchService:", error);
    }
  }

  private static async resolveTeam(teamId: string): Promise<{ name: string; logo: string }> {
    if (!teamId) return { name: 'Unknown Team', logo: '' };
    if (!this.cachesLoaded) await this.preloadCache();
    if (this.teamCache[teamId]) return this.teamCache[teamId];
    try {
      const snap = await getDoc(doc(db, 'teams', teamId));
      if (snap.exists()) {
        const d = snap.data();
        const res = {
          name: d?.name || 'Unknown Team',
          logo: d?.flagUrl || d?.logo || ''
        };
        this.teamCache[teamId] = res;
        return res;
      }
    } catch {}
    return { name: 'Unknown Team', logo: '' };
  }

  private static async resolveTournament(tournamentId: string): Promise<string> {
    if (!tournamentId) return 'Unknown Tournament';
    if (!this.cachesLoaded) await this.preloadCache();
    if (this.tournamentCache[tournamentId]) return this.tournamentCache[tournamentId];
    try {
      const snap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (snap.exists()) {
        const name = snap.data()?.name || 'Unknown Tournament';
        this.tournamentCache[tournamentId] = name;
        return name;
      }
    } catch {}
    return 'Unknown Tournament';
  }

  private static async resolveStadiumName(stadiumId: string): Promise<string> {
    if (!stadiumId) return '';
    if (!this.cachesLoaded) await this.preloadCache();
    if (this.stadiumCache[stadiumId]) return this.stadiumCache[stadiumId];
    try {
      const snap = await getDoc(doc(db, 'stadiums', stadiumId));
      if (snap.exists()) {
        const name = snap.data()?.name || '';
        this.stadiumCache[stadiumId] = name;
        return name;
      }
    } catch {}
    return '';
  }

  static async getAllMatches(): Promise<ClientMatch[]> {
    try {
      if (!this.cachesLoaded) {
        await this.preloadCache();
      }
      const matchesRef = collection(db, 'matches');
      const snap = await getDocs(matchesRef);
      
      const promises = snap.docs.map(async docSnap => {
        const d = docSnap.data();
        const [home, away, tourney, stadium] = await Promise.all([
          this.resolveTeam(d.homeTeamId),
          this.resolveTeam(d.awayTeamId),
          this.resolveTournament(d.tournamentId),
          this.resolveStadiumName(d.stadiumId)
        ]);

        return {
          id: docSnap.id,
          tournamentId: d.tournamentId || '',
          tournamentName: tourney,
          homeTeamId: d.homeTeamId || '',
          homeTeamName: home.name,
          homeTeamLogo: home.logo,
          awayTeamId: d.awayTeamId || '',
          awayTeamName: away.name,
          awayTeamLogo: away.logo,
          kickoff: d.kickoff || '00:00',
          date: d.date || '',
          status: d.status || 'Scheduled',
          minute: d.minute !== undefined ? d.minute : null,
          homeScore: d.homeScore !== undefined ? d.homeScore : null,
          awayScore: d.awayScore !== undefined ? d.awayScore : null,
          penalty: d.penalty || null,
          isHot: !!d.isHot,
          stage: d.stage || 'Group Stage',
          group: d.group || null,
          stadiumId: d.stadiumId || '',
          stadiumName: stadium
        } as ClientMatch;
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error("Error in MatchService.getAllMatches:", error);
      return [];
    }
  }

  static async getMatchById(id: string): Promise<ClientMatch | null> {
    try {
      if (!this.cachesLoaded) {
        await this.preloadCache();
      }
      const docRef = doc(db, 'matches', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      
      const d = snap.data();
      const [home, away, tourney, stadium] = await Promise.all([
        this.resolveTeam(d.homeTeamId),
        this.resolveTeam(d.awayTeamId),
        this.resolveTournament(d.tournamentId),
        this.resolveStadiumName(d.stadiumId)
      ]);

      return {
        id: snap.id,
        tournamentId: d.tournamentId || '',
        tournamentName: tourney,
        homeTeamId: d.homeTeamId || '',
        homeTeamName: home.name,
        homeTeamLogo: home.logo,
        awayTeamId: d.awayTeamId || '',
        awayTeamName: away.name,
        awayTeamLogo: away.logo,
        kickoff: d.kickoff || '00:00',
        date: d.date || '',
        status: d.status || 'Scheduled',
        minute: d.minute !== undefined ? d.minute : null,
        homeScore: d.homeScore !== undefined ? d.homeScore : null,
        awayScore: d.awayScore !== undefined ? d.awayScore : null,
        penalty: d.penalty || null,
        isHot: !!d.isHot,
        stage: d.stage || 'Group Stage',
        group: d.group || null,
        stadiumId: d.stadiumId || '',
        stadiumName: stadium
      } as ClientMatch;
    } catch (error) {
      console.error(`Error in MatchService.getMatchById for ${id}:`, error);
      return null;
    }
  }

  static async getMatchEvents(matchId: string): Promise<any[]> {
    try {
      const ref = collection(db, 'match_events');
      const q = query(ref, where('matchId', '==', matchId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data()).sort((a, b) => (a.minute || 0) - (b.minute || 0));
    } catch (error) {
      console.error(`Error in getMatchEvents for ${matchId}:`, error);
      return [];
    }
  }
}
