import { generateNaturalId } from '../utils/mapper';

export interface GroupStandingTeam {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number;
}

export interface GroupStandingsDoc {
  id: string;
  tournamentId: string;
  name: string;
  standings: GroupStandingTeam[];
  updatedAt: string;
}

export class GroupNormalizer {
  /**
   * Normalizes World Cup 2026 standing responses.
   */
  static normalizeWorldCup(raw: any, tournamentId: string, teamIdResolver: (name: string) => string): GroupStandingsDoc {
    const groupName = raw.group_name || raw.name || 'Group A';
    const id = generateNaturalId(`${tournamentId}_${groupName}`);

    const standings: GroupStandingTeam[] = (raw.teams || []).map((t: any, index: number) => ({
      teamId: teamIdResolver(t.name || t.team_name || t.team_name_en || t.teamName || t.team || ''),
      played: parseInt(t.played, 10) || 0,
      won: parseInt(t.won, 10) || 0,
      drawn: parseInt(t.drawn, 10) || 0,
      lost: parseInt(t.lost, 10) || 0,
      goalsFor: parseInt(t.goals_for, 10) || 0,
      goalsAgainst: parseInt(t.goals_against, 10) || 0,
      points: parseInt(t.points, 10) || 0,
      rank: index + 1,
    }));

    return {
      id,
      tournamentId,
      name: groupName,
      standings,
      updatedAt: new Date().toISOString(),
    };
  }
}
