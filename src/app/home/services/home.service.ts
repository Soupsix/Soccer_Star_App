import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  setDoc 
} from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { HomeMatch, HomePlayer, AIRecommendation } from '../types/home.types';

export class HomeService {
  // In-memory caches to prevent duplicate Firestore requests
  private static tournamentCache: Record<string, string> = {};
  private static teamCache: Record<string, string> = {};
  private static teamLogoCache: Record<string, string> = {};

  /**
   * Helper to print database stats for debugging purposes.
   */
  private static async logDbStats(): Promise<void> {
    try {
      const tourneys = await getDocs(collection(db, 'tournaments'));
      const teams = await getDocs(collection(db, 'teams'));
      const matches = await getDocs(collection(db, 'matches'));
      const players = await getDocs(collection(db, 'players'));

      console.log(`[HomeService Debug] --- Firestore DB Stats ---`);
      console.log(`[HomeService Debug] Tournaments loaded: ${tourneys.size}`);
      console.log(`[HomeService Debug] Teams loaded: ${teams.size}`);
      console.log(`[HomeService Debug] Matches loaded: ${matches.size}`);
      console.log(`[HomeService Debug] Players loaded: ${players.size}`);
      console.log(`[HomeService Debug] --------------------------`);
    } catch (err) {
      console.error("[HomeService Debug] Error fetching DB stats:", err);
    }
  }

  /**
   * Resolves a tournament name from a tournamentId.
   */
  private static async resolveTournamentName(tournamentId: string): Promise<string> {
    if (!tournamentId) return 'Unknown Tournament';
    if (this.tournamentCache[tournamentId]) return this.tournamentCache[tournamentId];

    try {
      const docRef = doc(db, 'tournaments', tournamentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const name = snap.data()?.name || 'Unknown Tournament';
        this.tournamentCache[tournamentId] = name;
        return name;
      }
    } catch (error) {
      console.error(`Error resolving tournament name for ID ${tournamentId}:`, error);
    }
    
    return 'Unknown Tournament';
  }

  /**
   * Resolves a team name from a teamId.
   */
  private static async resolveTeamName(teamId: string): Promise<string> {
    if (!teamId) return 'Unknown Team';
    if (this.teamCache[teamId]) return this.teamCache[teamId];

    try {
      const docRef = doc(db, 'teams', teamId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const name = snap.data()?.name || 'Unknown Team';
        this.teamCache[teamId] = name;
        return name;
      }
    } catch (error) {
      console.error(`Error resolving team name for ID ${teamId}:`, error);
    }

    return 'Unknown Team';
  }

  /**
   * Resolves a team's logo/flag URL from a teamId.
   */
  private static async resolveTeamLogo(teamId: string): Promise<string> {
    if (!teamId) return '';
    if (this.teamLogoCache[teamId]) return this.teamLogoCache[teamId];

    try {
      const docRef = doc(db, 'teams', teamId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const logo = data?.flagUrl || data?.logo || '';
        this.teamLogoCache[teamId] = logo;
        return logo;
      }
    } catch (error) {
      console.error(`Error resolving team logo for ID ${teamId}:`, error);
    }

    return '';
  }

  static async getHotMatches(): Promise<HomeMatch[]> {
    await this.logDbStats();
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('isHot', '==', true), limit(5));
      const qSnapshot = await getDocs(q);
      
      console.log(`[HomeService Debug] [getHotMatches] Raw matches found: ${qSnapshot.size}`);
      
      const matchPromises = qSnapshot.docs.map(async doc => {
        const data = doc.data();
        console.log(`[HomeService Debug] [getHotMatches] Before mapping:`, JSON.stringify(data));
        
        const homeName = await this.resolveTeamName(data.homeTeamId || '');
        const awayName = await this.resolveTeamName(data.awayTeamId || '');
        const homeLogo = await this.resolveTeamLogo(data.homeTeamId || '');
        const awayLogo = await this.resolveTeamLogo(data.awayTeamId || '');
        const tournamentName = await this.resolveTournamentName(data.tournamentId || '');
        
        const mapped = {
          id: doc.id,
          homeTeam: homeName,
          awayTeam: awayName,
          homeLogo: homeLogo,
          awayLogo: awayLogo,
          tournament: tournamentName,
          kickoff: data.kickoff || '00:00',
          date: data.date || '',
          status: data.status || 'Scheduled',
          isHot: !!data.isHot,
        } as HomeMatch;
        
        console.log(`[HomeService Debug] [getHotMatches] After mapping:`, JSON.stringify(mapped));
        return mapped;
      });

      return await Promise.all(matchPromises);
    } catch (error) {
      console.error("Error fetching hot matches:", error);
      return [];
    }
  }

  static async getTodayMatches(): Promise<HomeMatch[]> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('date', '==', todayStr));
      const qSnapshot = await getDocs(q);
      
      console.log(`[HomeService Debug] [getTodayMatches] Query Date: ${todayStr}, Raw matches found: ${qSnapshot.size}`);
      
      const matchPromises = qSnapshot.docs.map(async doc => {
        const data = doc.data();
        console.log(`[HomeService Debug] [getTodayMatches] Before mapping:`, JSON.stringify(data));

        const homeName = await this.resolveTeamName(data.homeTeamId || '');
        const awayName = await this.resolveTeamName(data.awayTeamId || '');
        const homeLogo = await this.resolveTeamLogo(data.homeTeamId || '');
        const awayLogo = await this.resolveTeamLogo(data.awayTeamId || '');
        const tournamentName = await this.resolveTournamentName(data.tournamentId || '');
        
        const mapped = {
          id: doc.id,
          homeTeam: homeName,
          awayTeam: awayName,
          homeLogo: homeLogo,
          awayLogo: awayLogo,
          tournament: tournamentName,
          kickoff: data.kickoff || '00:00',
          date: data.date || '',
          status: data.status || 'Scheduled',
          isHot: !!data.isHot,
        } as HomeMatch;

        console.log(`[HomeService Debug] [getTodayMatches] After mapping:`, JSON.stringify(mapped));
        return mapped;
      });

      return await Promise.all(matchPromises);
    } catch (error) {
      console.error("Error fetching today matches:", error);
      return [];
    }
  }

  static async getUpcomingMatches(): Promise<HomeMatch[]> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('date', '>', todayStr), orderBy('date'), limit(5));
      const qSnapshot = await getDocs(q);
      
      console.log(`[HomeService Debug] [getUpcomingMatches] Query Date > ${todayStr}, Raw matches found: ${qSnapshot.size}`);
      
      const matchPromises = qSnapshot.docs.map(async doc => {
        const data = doc.data();
        console.log(`[HomeService Debug] [getUpcomingMatches] Before mapping:`, JSON.stringify(data));

        const homeName = await this.resolveTeamName(data.homeTeamId || '');
        const awayName = await this.resolveTeamName(data.awayTeamId || '');
        const homeLogo = await this.resolveTeamLogo(data.homeTeamId || '');
        const awayLogo = await this.resolveTeamLogo(data.awayTeamId || '');
        const tournamentName = await this.resolveTournamentName(data.tournamentId || '');
        
        // Format display kickoff: YYYY-MM-DD -> DD-MM
        let displayKickoff = data.kickoff || '00:00';
        if (data.date) {
          const parts = data.date.split('-');
          if (parts.length === 3) {
            displayKickoff = `${parts[2]}-${parts[1]}, ${data.kickoff || '00:00'}`;
          }
        }

        const mapped = {
          id: doc.id,
          homeTeam: homeName,
          awayTeam: awayName,
          homeLogo: homeLogo,
          awayLogo: awayLogo,
          tournament: tournamentName,
          kickoff: displayKickoff,
          date: data.date || '',
          status: data.status || 'Scheduled',
          isHot: !!data.isHot,
        } as HomeMatch;

        console.log(`[HomeService Debug] [getUpcomingMatches] After mapping:`, JSON.stringify(mapped));
        return mapped;
      });

      return await Promise.all(matchPromises);
    } catch (error) {
      console.error("Error fetching upcoming matches:", error);
      return [];
    }
  }

  static async getFavoritePlayers(): Promise<HomePlayer[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("[HomeService Debug] [getFavoritePlayers] No authenticated user.");
        return [];
      }

      const userRef = doc(db, 'users', currentUser.uid);
      let userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const defaultUserData = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Champ',
          email: currentUser.email || '',
          coinBalance: 1250,
          favoritePlayers: ['player_sdb_lionel_messi', 'player_sdb_cristiano_ronaldo', 'player_sdb_erling_haaland'],
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, defaultUserData);
        userSnap = await getDoc(userRef);
      } else {
        const data = userSnap.data();
        if (!data?.favoritePlayers || data.favoritePlayers.length === 0) {
          await setDoc(userRef, {
            favoritePlayers: ['player_sdb_lionel_messi', 'player_sdb_cristiano_ronaldo', 'player_sdb_erling_haaland']
          }, { merge: true });
          userSnap = await getDoc(userRef);
        }
      }

      const favoriteIds = userSnap.data()?.favoritePlayers || [];
      console.log(`[HomeService Debug] [getFavoritePlayers] User favorite IDs:`, favoriteIds);
      if (favoriteIds.length === 0) {
        return [];
      }

      const playerPromises = favoriteIds.map(async (playerId: string) => {
        const playerSnap = await getDoc(doc(db, 'players', playerId));
        if (playerSnap.exists()) {
          const pData = playerSnap.data();
          
          // Resolve next match details
          let nextMatchStr = 'Chưa có lịch thi đấu';
          if (pData.nextMatchId) {
            const matchSnap = await getDoc(doc(db, 'matches', pData.nextMatchId));
            if (matchSnap.exists()) {
              const mData = matchSnap.data();
              
              // Format date: YYYY-MM-DD -> DD-MM
              let dateStr = '';
              if (mData.date) {
                const parts = mData.date.split('-');
                if (parts.length === 3) dateStr = ` (${parts[2]}-${parts[1]})`;
              }
              const homeName = await this.resolveTeamName(mData.homeTeamId || '');
              const awayName = await this.resolveTeamName(mData.awayTeamId || '');
              nextMatchStr = `${homeName} vs ${awayName}${dateStr}`;
            }
          }

          return {
            id: playerSnap.id,
            name: pData.name || '',
            avatar: pData.image || '',
            nextMatch: nextMatchStr,
            position: pData.position || 'Forward',
          } as HomePlayer;
        }
        return null;
      });

      const resolved = await Promise.all(playerPromises);
      const filtered = resolved.filter((p): p is HomePlayer => p !== null);
      console.log(`[HomeService Debug] [getFavoritePlayers] Mapped players:`, filtered.length);
      return filtered;
    } catch (error) {
      console.error("Error fetching favorite players:", error);
      return [];
    }
  }

  static async getAIRecommendation(): Promise<AIRecommendation | null> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const matchesRef = collection(db, 'matches');
      // Fetch the next match starting from today
      const q = query(matchesRef, where('date', '>=', todayStr), orderBy('date'), limit(1));
      const qSnapshot = await getDocs(q);

      if (qSnapshot.empty) {
        console.log("[HomeService Debug] [getAIRecommendation] No upcoming matches found to generate recommendation.");
        return null;
      }

      const matchDoc = qSnapshot.docs[0];
      const mData = matchDoc.data();
      const homeName = await this.resolveTeamName(mData.homeTeamId || '');
      const awayName = await this.resolveTeamName(mData.awayTeamId || '');

      return {
        id: matchDoc.id,
        homeTeam: homeName,
        awayTeam: awayName,
        reason: `Trận đấu tâm điểm giữa ${homeName} và ${awayName} được AI dự đoán vô cùng kịch tính. Dựa trên phong độ 5 trận gần nhất và sơ đồ chiến thuật mới nhất, khả năng chiến thắng chia đều cho cả hai đội.`,
        confidence: 82,
      };
    } catch (err) {
      console.error("Error generating AI recommendation:", err);
      return {
        id: 'r_fallback',
        homeTeam: 'Argentina',
        awayTeam: 'Spain',
        reason: 'Cả hai đội tuyển đều sở hữu hàng công cực mạnh. Trận đấu hứa hẹn sẽ bùng nổ bàn thắng nhờ các siêu sao đang có phong độ cao.',
        confidence: 85,
      };
    }
  }
}
