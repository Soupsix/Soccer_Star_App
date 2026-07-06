import { MatchService } from '@/services/match.service';
import { ClientMatch } from '@/types/match.types';

export interface GroupedTournamentMatches {
  tournamentId: string;
  tournamentName: string;
  matches: ClientMatch[];
}

export interface GroupedStageMatches {
  stage: string;
  matches: ClientMatch[];
}

export class MatchRepository {
  /**
   * Fetches all matches.
   */
  static async getAllMatches(): Promise<ClientMatch[]> {
    return await MatchService.getAllMatches();
  }

  /**
   * Fetches matches and groups them by tournament.
   */
  static async getMatchesGroupedByTournament(): Promise<GroupedTournamentMatches[]> {
    const matches = await MatchService.getAllMatches();
    const groups: Record<string, { tournamentName: string; matches: ClientMatch[] }> = {};

    matches.forEach(match => {
      // Filter out matches that have already occurred (Full Time)
      if (match.status === 'FT') return;

      const tourneyId = match.tournamentId || 'unknown_tourney';
      if (!groups[tourneyId]) {
        groups[tourneyId] = {
          tournamentName: match.tournamentName,
          matches: []
        };
      }
      groups[tourneyId].matches.push(match);
    });

    return Object.entries(groups).map(([id, group]) => ({
      tournamentId: id,
      tournamentName: group.tournamentName,
      matches: group.matches
    }));
  }

  /**
   * Fetches matches for a tournament and groups them by stage (for brackets).
   */
  static async getMatchesGroupedByStage(tournamentId: string): Promise<GroupedStageMatches[]> {
    const matches = await MatchService.getAllMatches();
    const tourneyMatches = matches.filter(m => m.tournamentId === tournamentId);
    
    // Ordered list of stages
    const stageOrder = [
      'Round of 32',
      'Round of 16',
      'Quarter Final',
      'Quarter-finals',
      'Semi Final',
      'Semi-finals',
      'Final'
    ];

    const groups: Record<string, ClientMatch[]> = {};
    tourneyMatches.forEach(match => {
      // Normalize stage names slightly if needed
      let stage = match.stage || 'Group Stage';
      if (stage === 'Quarter-finals') stage = 'Quarter Final';
      if (stage === 'Semi-finals') stage = 'Semi Final';

      // Ignore group stage for bracket rendering
      if (stage.toLowerCase().includes('group')) return;

      if (!groups[stage]) {
        groups[stage] = [];
      }
      groups[stage].push(match);
    });

    // Sort stages based on the stageOrder
    return Object.entries(groups)
      .map(([stage, stageMatches]) => ({
        stage,
        matches: stageMatches
      }))
      .sort((a, b) => {
        const idxA = stageOrder.indexOf(a.stage);
        const idxB = stageOrder.indexOf(b.stage);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
  }
}
