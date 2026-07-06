export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  continent: string;
  isActive: boolean;
}

export interface MatchDetail {
  id: string;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  kickoff: string;
  status: string;
  group?: string;
  matchday?: number;
  stage?: string;
}
