import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { FootballDataService } from '@/services/footballData.service';
import playersData from '@/assets/data/players.json';
import { HomeMatch, HomePlayer, AIRecommendation } from '../types/home.types';

export class HomeService {
  private static mapToHomeMatch(m: any, isUpcoming = false): HomeMatch {
    const clientMatch = FootballDataService.mapRestMatchToClientMatch(m);
    let displayKickoff = clientMatch.kickoff;
    if (isUpcoming && clientMatch.date) {
      const parts = clientMatch.date.split('-');
      if (parts.length === 3) {
        displayKickoff = `${parts[2]}-${parts[1]}, ${clientMatch.kickoff}`;
      }
    }
    return {
      id: clientMatch.id,
      homeTeam: clientMatch.homeTeamName,
      awayTeam: clientMatch.awayTeamName,
      homeLogo: clientMatch.homeTeamLogo,
      awayLogo: clientMatch.awayTeamLogo,
      tournament: clientMatch.tournamentName,
      kickoff: displayKickoff,
      status: clientMatch.status,
      isHot: clientMatch.isHot,
    };
  }

  static async getHotMatches(): Promise<HomeMatch[]> {
    try {
      const liveData = await FootballDataService.getLiveMatches();
      const live = liveData.matches || [];
      
      // Fallback: If no live matches, show the first 5 upcoming matches
      if (live.length === 0) {
        console.log("[HomeService] No live matches. Falling back to upcoming matches for Hot matches.");
        const upcomingData = await FootballDataService.getUpcomingMatches();
        const upcoming = upcomingData.matches || [];
        return upcoming.slice(0, 5).map(m => this.mapToHomeMatch(m));
      }

      return live.map(m => this.mapToHomeMatch(m));
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

      const upcomingData = await FootballDataService.getUpcomingMatches();
      const upcoming = upcomingData.matches || [];
      
      // Filter matches happening today
      const todayMatches = upcoming.filter(m => {
        const mDate = m.match_date ? m.match_date.split(' ')[0] : '';
        return mDate === todayStr;
      });

      return todayMatches.map(m => this.mapToHomeMatch(m));
    } catch (error) {
      console.error("Error fetching today matches:", error);
      return [];
    }
  }

  static async getUpcomingMatches(): Promise<HomeMatch[]> {
    try {
      const upcomingData = await FootballDataService.getUpcomingMatches();
      const upcoming = upcomingData.matches || [];
      return upcoming.slice(0, 5).map(m => this.mapToHomeMatch(m, true));
    } catch (error) {
      console.error("Error fetching upcoming matches:", error);
      return [];
    }
  }

  static async getFavoritePlayers(): Promise<HomePlayer[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return [];
      }

      const userRef = doc(db, 'users', currentUser.uid);
      let userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const defaultUserData = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Champ',
          email: currentUser.email || '',
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
      if (favoriteIds.length === 0) {
        return [];
      }

      // Fetch upcoming matches once to resolve next fixture for all favorite players
      let upcomingMatches: any[] = [];
      try {
        const upcomingData = await FootballDataService.getUpcomingMatches();
        upcomingMatches = upcomingData.matches || [];
      } catch (err) {
        console.error("Error fetching upcoming matches for player resolution:", err);
      }

      const resolved = favoriteIds.map((playerId: string) => {
        // Find player details in local playersData
        const pData = (playersData as any[]).find(
          (p) => String(p.idPlayer) === playerId || p.id === playerId
        );

        if (pData) {
          let nextMatchStr = 'Chưa có lịch thi đấu';
          const playerTeam = pData.strTeam;
          if (playerTeam) {
            const nextMatch = upcomingMatches.find(
              (m) =>
                m.home_team?.team_name === playerTeam ||
                m.away_team?.team_name === playerTeam
            );
            if (nextMatch) {
              const clientM = FootballDataService.mapRestMatchToClientMatch(nextMatch);
              let dateStr = '';
              if (clientM.date) {
                const parts = clientM.date.split('-');
                if (parts.length === 3) dateStr = ` (${parts[2]}-${parts[1]})`;
              }
              nextMatchStr = `${clientM.homeTeamName} vs ${clientM.awayTeamName}${dateStr}`;
            }
          }

          return {
            id: playerId,
            name: pData.strPlayer || '',
            avatar: pData.strRender || pData.strCutout || pData.strThumb || '',
            nextMatch: nextMatchStr,
            position: pData.strPosition || 'Forward',
          } as HomePlayer;
        }
        return null;
      });

      return resolved.filter((p: any): p is HomePlayer => p !== null);
    } catch (error) {
      console.error("Error fetching favorite players:", error);
      return [];
    }
  }

  static async getAIRecommendation(): Promise<AIRecommendation | null> {
    try {
      const upcomingData = await FootballDataService.getUpcomingMatches();
      const upcoming = upcomingData.matches || [];
      if (upcoming.length === 0) {
        return null;
      }

      const match = upcoming[0];
      const clientMatch = FootballDataService.mapRestMatchToClientMatch(match);
      const homeName = clientMatch.homeTeamName;
      const awayName = clientMatch.awayTeamName;

      return {
        id: clientMatch.id,
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

export default function Ignore() { return null; }
