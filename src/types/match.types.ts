export interface ClientMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
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
  stage: string;
  group: string | null;
  stadiumId?: string;
  stadiumName?: string;
}
