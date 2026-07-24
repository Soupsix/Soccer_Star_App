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

      // Return real events if present on match object
      if ((match as any)?.events && Array.isArray((match as any).events)) {
        return (match as any).events;
      }

      return [];
    } catch (error) {
      console.error(`Error in getMatchEvents for ${matchId}:`, error);
      return [];
    }
  }
}
