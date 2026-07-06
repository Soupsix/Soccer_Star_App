import { generateNaturalId, normalizeEventType } from '../utils/mapper';
import { normalizeMatchStatus } from '../utils/status';

export interface MatchDoc {
  id: string;
  tournamentId: string;
  stadiumId: string;
  homeTeamId: string;
  awayTeamId: string;
  stage: string;
  group: string | null;
  kickoff: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'HT' | 'FT' | 'Postponed';
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  penalty: {
    home: number;
    away: number;
  } | null;
  isHot: boolean;
  source: 'worldcup' | 'sportsdb';
  updatedAt: string;
}

export interface MatchEventDoc {
  id: string;
  matchId: string;
  minute: number;
  type: 'Goal' | 'Own Goal' | 'Yellow Card' | 'Red Card' | 'Penalty' | 'Missed Penalty' | 'VAR' | 'Substitution';
  teamId: string;
  playerId: string | null;
  description: string;
  createdAt: string;
}

export class MatchNormalizer {
  /**
   * Normalizes World Cup 2026 API game payloads.
   */
  static normalizeWorldCup(raw: any, resolvedIds: { homeId: string; awayId: string; stadiumId: string; tourneyId: string }): { match: MatchDoc; events: MatchEventDoc[] } {
    const matchId = generateNaturalId(`match_wc_${raw.game_id || raw.id}`);
    
    // Parse date and kickoff from raw.local_date (format "06/11/2026 13:00")
    let dateStr = '';
    let kickoffStr = '';
    if (raw.local_date) {
      const parts = raw.local_date.split(' ');
      if (parts.length === 2) {
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
          // MM/DD/YYYY format. June 11, 2026.
          const month = dateParts[0].padStart(2, '0');
          const day = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          dateStr = `${year}-${month}-${day}`;
        }
        kickoffStr = parts[1]; // e.g. "13:00"
      }
    }
    if (!dateStr) {
      const now = new Date();
      dateStr = now.toISOString().split('T')[0];
      kickoffStr = '00:00';
    }

    const match: MatchDoc = {
      id: matchId,
      tournamentId: resolvedIds.tourneyId,
      stadiumId: resolvedIds.stadiumId,
      homeTeamId: resolvedIds.homeId,
      awayTeamId: resolvedIds.awayId,
      stage: raw.stage_name || 'Group Stage',
      group: raw.group_name || null,
      kickoff: kickoffStr,
      date: dateStr,
      status: normalizeMatchStatus(raw.status || 'Scheduled'),
      minute: raw.current_minute !== undefined ? parseInt(raw.current_minute, 10) : null,
      homeScore: raw.home_score !== undefined ? parseInt(raw.home_score, 10) : null,
      awayScore: raw.away_score !== undefined ? parseInt(raw.away_score, 10) : null,
      penalty: raw.has_penalties ? { home: parseInt(raw.home_penalties, 10), away: parseInt(raw.away_penalties, 10) } : null,
      isHot: raw.is_critical || raw.isHot || false,
      source: 'worldcup',
      updatedAt: new Date().toISOString(),
    };

    const events: MatchEventDoc[] = (raw.goal_events || []).map((e: any, index: number) => ({
      id: generateNaturalId(`event_wc_${matchId}_${index}`),
      matchId,
      minute: parseInt(e.minute, 10) || 0,
      type: normalizeEventType(e.type || 'Goal'),
      teamId: e.team_type === 'home' ? resolvedIds.homeId : resolvedIds.awayId,
      playerId: e.player_name ? generateNaturalId(`player_wc_${e.player_name}`) : null,
      description: e.description || `${e.player_name || 'Player'} ghi bàn`,
      createdAt: new Date().toISOString(),
    }));

    return { match, events };
  }

  /**
   * Normalizes TheSportsDB API game payloads.
   */
  static normalizeSportsDb(raw: any, resolvedIds: { homeId: string; awayId: string; stadiumId: string; tourneyId: string }): { match: MatchDoc; events: MatchEventDoc[] } {
    const matchId = generateNaturalId(`match_sdb_${raw.idEvent || raw.id}`);
    
    // dateEvent is YYYY-MM-DD
    const dateStr = raw.dateEvent || new Date().toISOString().split('T')[0];
    const kickoffStr = raw.strTime ? raw.strTime.slice(0, 5) : '00:00';

    const match: MatchDoc = {
      id: matchId,
      tournamentId: resolvedIds.tourneyId,
      stadiumId: resolvedIds.stadiumId,
      homeTeamId: resolvedIds.homeId,
      awayTeamId: resolvedIds.awayId,
      stage: raw.strRound || 'Regular Season',
      group: null,
      kickoff: kickoffStr,
      date: dateStr,
      status: normalizeMatchStatus(raw.strStatus || 'Scheduled'),
      minute: null,
      homeScore: raw.intHomeScore !== null && raw.intHomeScore !== undefined ? parseInt(raw.intHomeScore, 10) : null,
      awayScore: raw.intAwayScore !== null && raw.intAwayScore !== undefined ? parseInt(raw.intAwayScore, 10) : null,
      penalty: null,
      isHot: false,
      source: 'sportsdb',
      updatedAt: new Date().toISOString(),
    };

    const events: MatchEventDoc[] = [];
    
    const parseScorers = (scorerString: string, teamId: string) => {
      if (!scorerString) return;
      const parts = scorerString.split(';');
      parts.forEach((part, index) => {
        const matchTime = part.match(/\d+/);
        const minute = matchTime ? parseInt(matchTime[0], 10) : 0;
        const playerName = part.replace(/\d+'/, '').replace('Goal', '').replace('Goal (OG)', '').trim();
        if (playerName) {
          events.push({
            id: generateNaturalId(`event_sdb_${matchId}_${teamId}_${index}`),
            matchId,
            minute,
            type: part.includes('OG') ? 'Own Goal' : 'Goal',
            teamId,
            playerId: generateNaturalId(`player_sdb_${playerName}`),
            description: part.trim(),
            createdAt: new Date().toISOString(),
          });
        }
      });
    };

    parseScorers(raw.strHomeGoal, resolvedIds.homeId);
    parseScorers(raw.strAwayGoal, resolvedIds.awayId);

    return { match, events };
  }
}
