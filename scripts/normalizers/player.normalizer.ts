import { generateNaturalId } from '../utils/mapper';

export interface PlayerDoc {
  id: string;
  name: string;
  image: string | null;
  teamId: string;
  nextMatchId: string | null;
  position: string;
  dateBorn: string;
  nationality: string;
  source: 'sportsdb';
  createdAt: string;
  updatedAt: string;
}

export class PlayerNormalizer {
  /**
   * Normalizes TheSportsDB API player payloads.
   */
  static normalizeSportsDb(raw: any, teamId: string): PlayerDoc {
    const playerName = raw.strPlayer || '';
    
    return {
      id: generateNaturalId(`player_sdb_${playerName}`),
      name: playerName,
      image: raw.strCutout || raw.strThumb || null,
      teamId,
      nextMatchId: null, // To be dynamically mapped later by services
      position: raw.strPosition || 'Forward',
      dateBorn: raw.dateBorn || '',
      nationality: raw.strNationality || '',
      source: 'sportsdb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
