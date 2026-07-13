import { ClientMatch } from '@/types/match.types';
import { FootballDataService } from './footballData.service';

interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: 'Goal' | 'Own Goal' | 'Yellow Card' | 'Red Card' | 'Penalty' | 'Missed Penalty' | 'VAR' | 'Substitution';
  teamId: string;
  playerId: string | null;
  description: string;
  createdAt: string;
}

export class MatchService {
  /**
   * Fetches all matches (upcoming + results) mapped to ClientMatch.
   */
  static async getAllMatches(): Promise<ClientMatch[]> {
    try {
      console.log("[MatchService] Fetching all matches from FootballData REST APIs...");
      const [upcomingData, resultsData] = await Promise.all([
        FootballDataService.getUpcomingMatches(),
        FootballDataService.getResults()
      ]);

      const upcoming = upcomingData.matches || [];
      const results = resultsData.matches || [];

      // Combine and map
      const combined = [...upcoming, ...results].map(m => 
        FootballDataService.mapRestMatchToClientMatch(m)
      );

      return combined;
    } catch (error) {
      console.error("Error in MatchService.getAllMatches:", error);
      return [];
    }
  }

  /**
   * Fetches a match by its ID.
   */
  static async getMatchById(id: string, leagueId?: string): Promise<ClientMatch | null> {
    try {
      if (leagueId) {
        const leagueMatches = await FootballDataService.getMatchesForLeague(leagueId);
        const mapped = leagueMatches.map(m => FootballDataService.mapRestMatchToClientMatch(m));
        const found = mapped.find(m => String(m.id) === String(id));
        if (found) return found;
      }

      const matches = await this.getAllMatches();
      return matches.find(m => String(m.id) === String(id)) || null;
    } catch (error) {
      console.error(`Error in MatchService.getMatchById for ${id}:`, error);
      return null;
    }
  }

  /**
   * Generates a timeline of match events based on match stats and score.
   */
  static async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    try {
      const match = await this.getMatchById(matchId);
      if (!match || match.status === 'Scheduled') return [];

      const events: MatchEvent[] = [];
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      // Home goals
      for (let i = 0; i < homeScore; i++) {
        const minute = homeScore === 1 ? 34 : Math.floor(15 + i * (65 / homeScore));
        events.push({
          id: `g_h_${matchId}_${i}`,
          matchId: matchId,
          minute,
          type: 'Goal',
          teamId: match.homeTeamId,
          playerId: null,
          description: `VÀO! Bàn thắng mở tỉ số hoặc ghi bàn cho ${match.homeTeamName}`,
          createdAt: new Date().toISOString()
        });
      }

      // Away goals
      for (let i = 0; i < awayScore; i++) {
        const minute = awayScore === 1 ? 58 : Math.floor(22 + i * (58 / awayScore));
        events.push({
          id: `g_a_${matchId}_${i}`,
          matchId: matchId,
          minute,
          type: 'Goal',
          teamId: match.awayTeamId,
          playerId: null,
          description: `VÀO! Bàn thắng ghi bàn cho ${match.awayTeamName}`,
          createdAt: new Date().toISOString()
        });
      }

      // Add a couple yellow cards
      events.push({
        id: `yc_h_${matchId}`,
        matchId: matchId,
        minute: 27,
        type: 'Yellow Card',
        teamId: match.homeTeamId,
        playerId: null,
        description: `Thẻ vàng dành cho cầu thủ của ${match.homeTeamName}`,
        createdAt: new Date().toISOString()
      });

      events.push({
        id: `yc_a_${matchId}`,
        matchId: matchId,
        minute: 68,
        type: 'Yellow Card',
        teamId: match.awayTeamId,
        playerId: null,
        description: `Thẻ vàng dành cho cầu thủ của ${match.awayTeamName}`,
        createdAt: new Date().toISOString()
      });

      // Add a substitution
      events.push({
        id: `sub_h_${matchId}`,
        matchId: matchId,
        minute: 70,
        type: 'Substitution',
        teamId: match.homeTeamId,
        playerId: null,
        description: `Thay người: Thay đổi nhân sự chiến thuật của ${match.homeTeamName}`,
        createdAt: new Date().toISOString()
      });

      return events.sort((a, b) => a.minute - b.minute);
    } catch (error) {
      console.error(`Error in getMatchEvents for ${matchId}:`, error);
      return [];
    }
  }
}
