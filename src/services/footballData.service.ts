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
    const apiKey = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY || process.env.FOOTBALL_DATA_API_KEY || 'fd_f6703770e48d38c8f3ed7c20712c1b32c084080289614d5d';

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
    try {
      const res = await this.fetchFromApi<any>('/leagues');
      let leagues = Array.isArray(res) ? res : (res?.leagues || []);
      const saudiId = 'saudi_pro_league';
      const hasSaudi = leagues.some((l: any) => 
        String(l.league_id || l.id) === saudiId || 
        String(l.league_id || l.id) === '307' || 
        (l.name && l.name.toLowerCase().includes('saudi')) ||
        (l.league_name && l.league_name.toLowerCase().includes('saudi'))
      );

      if (!hasSaudi) {
        leagues.push({
          league_id: saudiId,
          league_name: 'Saudi Pro League',
          name: 'Saudi Pro League',
          country: 'Saudi Arabia',
          league_image: 'https://r2.thesportsdb.com/images/media/league/badge/6n2l9l1692290740.png',
          logo: 'https://r2.thesportsdb.com/images/media/league/badge/6n2l9l1692290740.png'
        });
      }
      return leagues;
    } catch (err) {
      console.warn('[FootballDataService] Failed to fetch leagues, returning defaults:', err);
      return [
        {
          league_id: 50,
          league_name: 'World Cup 2026',
          name: 'World Cup 2026',
          country: 'World',
          league_image: 'https://r2.thesportsdb.com/images/media/league/badge/sp24d51717871279.png'
        },
        {
          league_id: 'saudi_pro_league',
          league_name: 'Saudi Pro League',
          name: 'Saudi Pro League',
          country: 'Saudi Arabia',
          league_image: 'https://r2.thesportsdb.com/images/media/league/badge/6n2l9l1692290740.png'
        }
      ];
    }
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
    const isSaudi = String(leagueId) === 'saudi_pro_league' || String(leagueId) === '307' || String(leagueId).toLowerCase().includes('saudi');
    try {
      const seasonParam = seasonId ? `?season_id=${seasonId}` : '';
      const res = await this.fetchFromApi<any>(`/leagues/${leagueId}/standings${seasonParam}`);
      if (res && (res.standings || res.data)) return res;
      if (isSaudi) return this.getMockSaudiStandings();
      return res;
    } catch (err) {
      if (isSaudi) return this.getMockSaudiStandings();
      throw err;
    }
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
    const isSaudi = 
      String(leagueId) === 'saudi_pro_league' || 
      String(leagueId) === '307' || 
      String(leagueId).toLowerCase().includes('saudi');

    if (isSaudi) {
      return this.generateMockSaudiLeagueMatches(leagueId);
    }

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


  private static getMockSaudiStandings() {
    return {
      standings: [
        { rank: 1, team_name: 'Al-Nassr', played: 18, won: 14, draw: 3, lost: 1, points: 45, team_logo: 'https://r2.thesportsdb.com/images/media/team/badge/66t26m1692290884.png' },
        { rank: 2, team_name: 'Al-Hilal', played: 18, won: 13, draw: 4, lost: 1, points: 43, team_logo: 'https://r2.thesportsdb.com/images/media/team/badge/vt8b521692290945.png' },
        { rank: 3, team_name: 'Al-Ittihad', played: 18, won: 11, draw: 5, lost: 2, points: 38, team_logo: 'https://r2.thesportsdb.com/images/media/team/badge/4vsmv21692291004.png' },
        { rank: 4, team_name: 'Al-Ahli', played: 18, won: 10, draw: 5, lost: 3, points: 35, team_logo: 'https://r2.thesportsdb.com/images/media/team/badge/3w2g9q1692291054.png' },
        { rank: 5, team_name: 'Al-Ettifaq', played: 18, won: 9, draw: 3, lost: 6, points: 30, team_logo: 'https://r2.thesportsdb.com/images/media/team/badge/5k8m2p1692291100.png' },
        { rank: 6, team_name: 'Al-Shabab', played: 18, won: 8, draw: 4, lost: 6, points: 28, team_logo: 'https://r2.thesportsdb.com/images/media/team/badge/8m3k211692291150.png' },
      ]
    };
  }

  static getTeamLogoByName(name: string): string {
    const n = (name || '').toLowerCase().trim();
    if (!n) return 'https://r2.thesportsdb.com/images/media/team/badge/66t26m1692290884.png';

    // Saudi Pro League Teams
    if (n.includes('nassr')) return 'https://r2.thesportsdb.com/images/media/team/badge/66t26m1692290884.png';
    if (n.includes('hilal')) return 'https://r2.thesportsdb.com/images/media/team/badge/vt8b521692290945.png';
    if (n.includes('ittihad')) return 'https://r2.thesportsdb.com/images/media/team/badge/4vsmv21692291004.png';
    if (n.includes('ahli')) return 'https://r2.thesportsdb.com/images/media/team/badge/3w2g9q1692291054.png';
    if (n.includes('ettifaq')) return 'https://r2.thesportsdb.com/images/media/team/badge/5k8m2p1692291100.png';
    if (n.includes('shabab')) return 'https://r2.thesportsdb.com/images/media/team/badge/8m3k211692291150.png';
    if (n.includes('taawoun')) return 'https://r2.thesportsdb.com/images/media/team/badge/7n2l9l1692290741.png';
    if (n.includes('fateh')) return 'https://r2.thesportsdb.com/images/media/team/badge/6n2l9l1692290740.png';
    if (n.includes('khaleej')) return 'https://r2.thesportsdb.com/images/media/team/badge/4vsmv21692291004.png';
    if (n.includes('weihda') || n.includes('wehda')) return 'https://r2.thesportsdb.com/images/media/team/badge/3w2g9q1692291054.png';
    if (n.includes('fayha')) return 'https://r2.thesportsdb.com/images/media/team/badge/5k8m2p1692291100.png';
    if (n.includes('raed')) return 'https://r2.thesportsdb.com/images/media/team/badge/8m3k211692291150.png';
    if (n.includes('damac') || n.includes('damak')) return 'https://r2.thesportsdb.com/images/media/team/badge/7n2l9l1692290741.png';

    // International Teams
    if (n.includes('tây ban nha') || n.includes('spain')) return 'https://r2.thesportsdb.com/images/media/team/badge/x97p1w1546257007.png';
    if (n.includes('đức') || n.includes('germany')) return 'https://r2.thesportsdb.com/images/media/team/badge/794v9g1546257077.png';
    if (n.includes('argentina')) return 'https://r2.thesportsdb.com/images/media/team/badge/stssww1420747201.png';
    if (n.includes('pháp') || n.includes('france')) return 'https://r2.thesportsdb.com/images/media/team/badge/x9s31a1546257039.png';
    if (n.includes('anh') || n.includes('england')) return 'https://r2.thesportsdb.com/images/media/team/badge/p3h3v91546257022.png';
    if (n.includes('brazil')) return 'https://r2.thesportsdb.com/images/media/team/badge/8z34411546257106.png';
    if (n.includes('bồ đào nha') || n.includes('portugal')) return 'https://r2.thesportsdb.com/images/media/team/badge/u36b2r1546257057.png';
    if (n.includes('nhật bản') || n.includes('japan')) return 'https://r2.thesportsdb.com/images/media/team/badge/9y01i21546257121.png';
    if (n.includes('mỹ') || n.includes('usa')) return 'https://r2.thesportsdb.com/images/media/team/badge/25r5i71546257134.png';
    if (n.includes('ý') || n.includes('italy')) return 'https://r2.thesportsdb.com/images/media/team/badge/9r0g6g1546257091.png';
    if (n.includes('hà lan') || n.includes('netherlands')) return 'https://r2.thesportsdb.com/images/media/team/badge/t0i56i1546257147.png';

    // Global Clubs
    if (n.includes('real madrid')) return 'https://r2.thesportsdb.com/images/media/team/badge/03vthd1621590488.png';
    if (n.includes('barcelona')) return 'https://r2.thesportsdb.com/images/media/team/badge/9651581621590518.png';
    if (n.includes('manchester city') || n.includes('man city')) return 'https://r2.thesportsdb.com/images/media/team/badge/v22hvu1621590547.png';
    if (n.includes('inter miami')) return 'https://r2.thesportsdb.com/images/media/team/badge/8z34411546257106.png';

    return 'https://r2.thesportsdb.com/images/media/team/badge/66t26m1692290884.png';
  }

  private static generateMockSaudiLeagueMatches(leagueId?: string | number) {
    const tourneyId = leagueId ? String(leagueId) : 'saudi_pro_league';
    const createMockMatch = (id: number, home: string, away: string, date: string, kickoff: string, homeScore: number | null, awayScore: number | null, status: string, minute?: number) => ({
      match_id: id,
      match_date: `${date} ${kickoff}:00`,
      status: status,
      minute: minute ?? null,
      stage: 'Vòng đấu chính',
      league: { league_id: tourneyId, name: 'Saudi Pro League' },
      home_team: { team_id: id * 10, team_name: home, team_logo: this.getTeamLogoByName(home) },
      away_team: { team_id: id * 10 + 1, team_name: away, team_logo: this.getTeamLogoByName(away) },
      score: { home: homeScore, away: awayScore }
    });

    return [
      createMockMatch(8001, 'Al-Nassr', 'Al-Hilal', '2026-07-20', '20:00', 3, 2, 'complete'),
      createMockMatch(8002, 'Al-Ittihad', 'Al-Ahli', '2026-07-22', '19:30', 1, 1, 'complete'),
      createMockMatch(8003, 'Al-Nassr', 'Al-Ettifaq', '2026-07-24', '20:00', 2, 1, 'live', 65),
      createMockMatch(8004, 'Al-Nassr', 'Al-Shabab', '2026-07-28', '20:00', null, null, 'scheduled'),
      createMockMatch(8005, 'Al-Taawoun', 'Al-Hilal', '2026-08-01', '19:00', null, null, 'scheduled'),
    ];
  }

  private static generateMockWCBracket() {
    const createMock = (id: number, stage: string, home: string, away: string, d: string, homeScore: number, awayScore: number, status: string = 'complete') => ({
      match_id: id,
      match_date: d,
      status: status,
      stage: stage,
      league: { league_id: 50, name: 'World Cup 2026' },
      home_team: { team_id: id * 10, team_name: home, team_logo: 'https://footballdata.io/img/team/unknown.png' },
      away_team: { team_id: id * 10 + 1, team_name: away, team_logo: 'https://footballdata.io/img/team/unknown.png' },
      score: { home: homeScore, away: awayScore }
    });

    return [
      // Round of 16 - World Cup 2026
      createMock(9001, 'Round of 16', 'Tây Ban Nha', 'Đức', '2026-06-28 10:00:00', 2, 1),
      createMock(9002, 'Round of 16', 'Argentina', 'Mexico', '2026-06-28 14:00:00', 3, 1),
      createMock(9003, 'Round of 16', 'Pháp', 'Hà Lan', '2026-06-29 10:00:00', 2, 0),
      createMock(9004, 'Round of 16', 'Anh', 'Ý', '2026-06-29 14:00:00', 1, 0),
      createMock(9005, 'Round of 16', 'Nhật Bản', 'Mỹ', '2026-06-30 10:00:00', 2, 1),
      createMock(9006, 'Round of 16', 'Brazil', 'Uruguay', '2026-06-30 14:00:00', 3, 1),
      createMock(9007, 'Round of 16', 'Bồ Đào Nha', 'Bỉ', '2026-07-01 10:00:00', 2, 1),
      createMock(9008, 'Round of 16', 'Maroc', 'Colombia', '2026-07-01 14:00:00', 1, 0),
      // Quarter Finals
      createMock(9009, 'Quarter Final', 'Tây Ban Nha', 'Argentina', '2026-07-04 10:00:00', 1, 2),
      createMock(9010, 'Quarter Final', 'Pháp', 'Anh', '2026-07-04 14:00:00', 2, 1),
      createMock(9011, 'Quarter Final', 'Nhật Bản', 'Brazil', '2026-07-05 10:00:00', 1, 3),
      createMock(9012, 'Quarter Final', 'Bồ Đào Nha', 'Maroc', '2026-07-05 14:00:00', 2, 1),
      // Semi Finals
      createMock(9013, 'Semi Final', 'Argentina', 'Pháp', '2026-07-08 14:00:00', 1, 2),
      createMock(9014, 'Semi Final', 'Brazil', 'Bồ Đào Nha', '2026-07-09 14:00:00', 3, 2),
      // Final - World Cup 2026
      createMock(9015, 'Final', 'Pháp', 'Brazil', '2026-07-19 14:00:00', 2, 1)
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

    const homeName = m.home_team?.team_name || 'Home Team';
    const awayName = m.away_team?.team_name || 'Away Team';
    const rawHomeLogo = m.home_team?.team_logo || m.home_team?.logo || m.home_team?.badge || '';
    const rawAwayLogo = m.away_team?.team_logo || m.away_team?.logo || m.away_team?.badge || '';

    const homeTeamLogo = (rawHomeLogo && !rawHomeLogo.includes('unknown')) 
      ? rawHomeLogo 
      : this.getTeamLogoByName(homeName);

    const awayTeamLogo = (rawAwayLogo && !rawAwayLogo.includes('unknown')) 
      ? rawAwayLogo 
      : this.getTeamLogoByName(awayName);

    return {
      id: String(m.match_id),
      tournamentId: String(m.league?.league_id || ''),
      tournamentName: m.league?.competition_name || m.league?.name || 'Unknown Tournament',
      homeTeamId: String(m.home_team?.team_id || ''),
      homeTeamName: homeName,
      homeTeamLogo: homeTeamLogo,
      awayTeamId: String(m.away_team?.team_id || ''),
      awayTeamName: awayName,
      awayTeamLogo: awayTeamLogo,
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
