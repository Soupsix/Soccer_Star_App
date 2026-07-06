export interface HomeMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  tournament: string;
  kickoff: string;
  status: string;
  isHot: boolean;
}

export interface HomePlayer {
  id: string;
  name: string;
  avatar: string;
  nextMatch: string;
  position: string;
}

export interface AIRecommendation {
  id: string;
  homeTeam: string;
  awayTeam: string;
  reason: string;
  confidence: number;
}
