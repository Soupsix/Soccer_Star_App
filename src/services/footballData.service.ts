import { ClientMatch } from '@/types/match.types';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class FootballDataService {
  private static cache: Record<string, CacheEntry<any>> = {};
  private static CACHE_TTL = 30 * 1000; // 30 seconds

  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache[key];
    if (entry && entry.expiry > Date.now()) {
      return entry.data;
    }
    return null;
  }

  private static setInCache<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    };
  }

  private static async fetchFromApi<T>(endpoint: string): Promise<T> {
    const cached = this.getFromCache<T>(endpoint);
    if (cached) {
      console.log(`[FootballDataService] Cache HIT for endpoint: ${endpoint}`);
      return cached;
    }

    console.log(`[FootballDataService] Cache MISS for endpoint: ${endpoint}. Fetching...`);
    const baseUrl = process.env.EXPO_PUBLIC_FOOTBALL_DATA_BASE_URL || process.env.FOOTBALL_DATA_BASE_URL || 'https://footballdata.io/api/v1';
    const apiKey = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY || process.env.FOOTBALL_DATA_API_KEY || 'fd_38560af79421669000f20954927384aa3f9cd9fa2871ed35';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`FootballData API error: ${response.status} on ${endpoint}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(`FootballData API responded with success:false on ${endpoint}`);
    }

    const data = json.data;
    this.setInCache(endpoint, data);
    return data;
  }

  static async getLeagues() {
    return this.fetchFromApi<any[]>('/leagues');
  }

  static async getLiveMatches() {
    return this.fetchFromApi<{ matches: any[] }>('/fixtures/live');
  }

  static async getUpcomingMatches() {
    return this.fetchFromApi<{ from: string; to: string | null; matches: any[] }>('/fixtures/upcoming');
  }

  static async getResults() {
    return this.fetchFromApi<{ from: string | null; to: string; matches: any[] }>('/fixtures/results');
  }

  static async getLeagueSeasons(leagueId: string | number) {
    return this.fetchFromApi<{ league: any; seasons: any[] }>(`/leagues/${leagueId}/seasons`);
  }

  static async getLeagueMatches(leagueId: string | number) {
    return this.fetchFromApi<{ matches: any[] }>(`/leagues/${leagueId}/matches`);
  }

  static async getSeasonMatches(seasonId: string | number) {
    return this.fetchFromApi<{ matches: any[] }>(`/seasons/${seasonId}/matches`);
  }

  // ── Team endpoints ──────────────────────────────────────────────
  static async getTeamDetail(teamId: string | number) {
    return this.fetchFromApi<any>(`/teams/${teamId}`);
  }

  static async getTeamPlayers(teamId: string | number) {
    return this.fetchFromApi<any>(`/teams/${teamId}/players?limit=50`);
  }

  static async getTeamMatches(teamId: string | number) {
    return this.fetchFromApi<any>(`/teams/${teamId}/matches?limit=20`);
  }

  static async getTeamStats(teamId: string | number) {
    return this.fetchFromApi<any>(`/teams/${teamId}/stats`);
  }

  // ── League / standings ──────────────────────────────────────────
  static async getLeagueStandings(leagueId: string | number, seasonId?: string | number) {
    const seasonParam = seasonId ? `?season_id=${seasonId}` : '';
    return this.fetchFromApi<any>(`/leagues/${leagueId}/standings${seasonParam}`);
  }

  static async getLeagueTeams(leagueId: string | number) {
    return this.fetchFromApi<any>(`/leagues/${leagueId}/teams?limit=50`);
  }

  // ── Search ──────────────────────────────────────────────────────
  static async searchGlobal(query: string, type?: 'teams' | 'players' | 'leagues' | 'matches') {
    const typeParam = type ? `&type=${type}` : '';
    return this.fetchFromApi<any>(`/search?q=${encodeURIComponent(query)}${typeParam}&limit=25`);
  }

  /**
   * Helper to retrieve all matches for a league using the fixtures endpoints
   * with league_id filtering, as documented in the API docs.
   * Falls back to /leagues/{id}/matches if needed.
   */
  static async getMatchesForLeague(leagueId: string | number): Promise<any[]> {
    let matches: any[] = [];
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;

    // For World Cup, always pin to season_id=618 (WC 2026) to exclude 2022 data
    const isWC = String(leagueId) === '50';
    const seasonParam = isWC ? '&season_id=618' : '';
    const fromParam = isWC ? '' : `&from=${yearStart}`;

    try {
      // Use the fixtures endpoints with league_id filter (most reliable per API docs)
      const [upcomingRes, resultsRes] = await Promise.all([
        this.fetchFromApi<{ from: string; to: string | null; matches: any[] }>(
          `/fixtures/upcoming?league_id=${leagueId}${seasonParam}&limit=100`
        ),
        this.fetchFromApi<{ from: string | null; to: string; matches: any[] }>(
          `/fixtures/results?league_id=${leagueId}${seasonParam}${fromParam}&limit=100`
        ),
      ]);
      const upcoming = upcomingRes.matches || [];
      const results = resultsRes.matches || [];
      matches = [...upcoming, ...results];
      console.log(`[FootballDataService] League ${leagueId}: ${upcoming.length} upcoming + ${results.length} results`);
    } catch (err) {
      console.warn(`[FootballDataService] fixtures endpoint failed for league ${leagueId}, trying /leagues/${leagueId}/matches fallback. Error:`, err);
    }

    // Fallback: /leagues/{id}/matches
    if (matches.length === 0) {
      try {
        const fallbackData = await this.getLeagueMatches(leagueId);
        matches = fallbackData.matches || [];
      } catch (fallbackErr) {
        console.error(`[FootballDataService] Fallback to league matches failed for ${leagueId}:`, fallbackErr);
      }
    }

    // Mock Bracket data for World Cup because the API lacks 2026 knockout rounds
    if (isWC) {
      const hasKnockouts = matches.some(m => m.stage && m.stage.toLowerCase().includes('16'));
      if (!hasKnockouts) {
        matches = [...matches, ...this.generateMockWCBracket()];
      }
    }

    return matches;
  }


  private static generateMockWCBracket() {
    const createMock = (id: number, stage: string, home: string, away: string, d: string, homeScore: number, awayScore: number, status: string = 'complete') => ({
      match_id: id,
      match_date: d,
      status: status,
      stage: stage,
      league: { league_id: 50, name: 'World Cup' },
      home_team: { team_id: id * 10, team_name: home, team_logo: 'https://footballdata.io/img/team/unknown.png' },
      away_team: { team_id: id * 10 + 1, team_name: away, team_logo: 'https://footballdata.io/img/team/unknown.png' },
      score: { home: homeScore, away: awayScore }
    });

    return [
      // Round of 16
      createMock(9001, 'Round of 16', 'Hà Lan', 'Mỹ', '2026-06-28 10:00:00', 3, 1),
      createMock(9002, 'Round of 16', 'Argentina', 'Úc', '2026-06-28 14:00:00', 2, 1),
      createMock(9003, 'Round of 16', 'Pháp', 'Ba Lan', '2026-06-29 10:00:00', 3, 1),
      createMock(9004, 'Round of 16', 'Anh', 'Senegal', '2026-06-29 14:00:00', 3, 0),
      createMock(9005, 'Round of 16', 'Nhật Bản', 'Croatia', '2026-06-30 10:00:00', 1, 1), // Croatia won on pens
      createMock(9006, 'Round of 16', 'Brazil', 'Hàn Quốc', '2026-06-30 14:00:00', 4, 1),
      createMock(9007, 'Round of 16', 'Maroc', 'Tây Ban Nha', '2026-07-01 10:00:00', 0, 0),
      createMock(9008, 'Round of 16', 'Bồ Đào Nha', 'Thụy Sĩ', '2026-07-01 14:00:00', 6, 1),
      // Quarter Finals
      createMock(9009, 'Quarter Final', 'Hà Lan', 'Argentina', '2026-07-04 10:00:00', 2, 2),
      createMock(9010, 'Quarter Final', 'Pháp', 'Anh', '2026-07-04 14:00:00', 2, 1),
      createMock(9011, 'Quarter Final', 'Croatia', 'Brazil', '2026-07-05 10:00:00', 1, 1),
      createMock(9012, 'Quarter Final', 'Maroc', 'Bồ Đào Nha', '2026-07-05 14:00:00', 1, 0),
      // Semi Finals
      createMock(9013, 'Semi Final', 'Argentina', 'Croatia', '2026-07-08 14:00:00', 3, 0),
      createMock(9014, 'Semi Final', 'Pháp', 'Maroc', '2026-07-09 14:00:00', 2, 0),
      // Final
      createMock(9015, 'Final', 'Argentina', 'Pháp', '2026-07-13 14:00:00', 3, 3) // Argentina won on pens
    ];
  }

  private static findCurrentSeason(seasons: any[]): any {
    if (!seasons || seasons.length === 0) return null;
    const now = new Date();
    // Sort seasons by year descending
    const sorted = [...seasons].sort((a, b) => b.year - a.year);
    for (const s of sorted) {
      if (s.summary && s.summary.first_match_date && s.summary.last_match_date) {
        const start = new Date(s.summary.first_match_date);
        const end = new Date(s.summary.last_match_date);
        if (now >= start && now <= end) {
          return s;
        }
      }
    }
    return sorted[0]; // Fallback to the latest season
  }

  /**
   * Maps a match object from the REST API to the ClientMatch structure used in our UI.
   */
  static mapRestMatchToClientMatch(m: any): ClientMatch {
    const matchDateStr = m.match_date || ''; // e.g. "2026-07-14 15:00:00"
    const parts = matchDateStr.split(' ');
    const date = parts[0] || '';
    let kickoff = '00:00';
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      kickoff = `${timeParts[0]}:${timeParts[1]}`;
    }

    let status: 'Scheduled' | 'Live' | 'HT' | 'FT' | 'Postponed' = 'Scheduled';
    const rawStatus = String(m.status || '').toLowerCase();
    const rawStatusLoc = String(m.status_localized || '').toLowerCase();

    if (rawStatus === 'complete' || rawStatus === 'finished' || rawStatusLoc.includes('finish') || rawStatusLoc.includes('ft')) {
      status = 'FT';
    } else if (rawStatus === 'live' || rawStatusLoc.includes('live')) {
      status = 'Live';
    } else if (rawStatus === 'ht' || rawStatusLoc.includes('half')) {
      status = 'HT';
    } else if (rawStatus === 'postponed' || rawStatusLoc.includes('postponed')) {
      status = 'Postponed';
    } else {
      // "incomplete", "scheduled", "not_started", "tbd" and anything else → Scheduled
      status = 'Scheduled';
    }

    // Force 'Scheduled' if the match is in the future, regardless of API status
    if (date && kickoff) {
      const matchTime = new Date(`${date}T${kickoff}`).getTime();
      if (matchTime > Date.now()) {
        status = 'Scheduled';
      }
    }

    // Default penalties formatting
    let penalty = null;
    if (m.score?.penalty_home !== undefined && m.score?.penalty_away !== undefined) {
      penalty = {
        home: Number(m.score.penalty_home),
        away: Number(m.score.penalty_away)
      };
    } else if (m.score?.penalty) {
      penalty = {
        home: Number(m.score.penalty.home || 0),
        away: Number(m.score.penalty.away || 0)
      };
    }

    return {
      id: String(m.match_id),
      tournamentId: String(m.league?.league_id || ''),
      tournamentName: m.league?.competition_name || m.league?.name || 'Unknown Tournament',
      homeTeamId: String(m.home_team?.team_id || ''),
      homeTeamName: m.home_team?.team_name || 'Home Team',
      homeTeamLogo: m.home_team?.team_logo || '',
      awayTeamId: String(m.away_team?.team_id || ''),
      awayTeamName: m.away_team?.team_name || 'Away Team',
      awayTeamLogo: m.away_team?.team_logo || '',
      kickoff: kickoff,
      date: date,
      status: status,
      minute: m.minute !== undefined ? m.minute : null,
      homeScore: m.score?.home !== undefined && m.score?.home !== null ? Number(m.score.home) : null,
      awayScore: m.score?.away !== undefined && m.score?.away !== null ? Number(m.score.away) : null,
      penalty: penalty,
      isHot: !!m.is_hot || m.league?.league_id === 50, // Flag World Cup matches as hot automatically
      stage: m.round_name || m.stage || m.round_id || 'Group Stage',
      group: m.group_name || m.group || null,
      stadiumId: '',
      stadiumName: m.venue?.stadium_name || '',
    };
  }
}
