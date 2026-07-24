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
  predictedScore?: string;
  homeWinProb?: number;
  drawProb?: number;
  awayWinProb?: number;
  keyFactors?: string[];
  headToHead?: string;
  overUnder?: string;
}

export default function Ignore() { return null; }
