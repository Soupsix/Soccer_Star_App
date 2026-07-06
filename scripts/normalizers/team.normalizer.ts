import { getCountryCode, getFlagUrl } from '../utils/country';
import { generateNaturalId } from '../utils/mapper';

export interface TeamDoc {
  id: string;
  name: string;
  shortName: string;
  countryCode: string;
  fifaCode: string;
  type: 'national' | 'club';
  logo: string | null;
  flagUrl: string;
  stadiumId: string | null;
  description: string;
  source: 'worldcup' | 'sportsdb';
  createdAt: string;
  updatedAt: string;
}

export class TeamNormalizer {
  /**
   * Normalizes World Cup 2026 API team payloads.
   */
  static normalizeWorldCup(raw: any): TeamDoc {
    const country = raw.name_en || raw.name || '';
    const countryCode = raw.country_code || getCountryCode(country);
    
    return {
      id: generateNaturalId(`team_wc_${country}`),
      name: country,
      shortName: raw.short_name || country.slice(0, 3).toUpperCase(),
      countryCode,
      fifaCode: raw.fifa_code || countryCode + 'X',
      type: 'national',
      logo: null, // To be resolved via SportsDB
      flagUrl: getFlagUrl(countryCode),
      stadiumId: raw.stadium_id ? generateNaturalId(`stadium_wc_${raw.stadium_name || raw.stadium_id}`) : null,
      description: raw.description || `Đội tuyển quốc gia ${country}`,
      source: 'worldcup',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalizes TheSportsDB API team payloads.
   */
  static normalizeSportsDb(raw: any, leagueType: string): TeamDoc {
    const teamName = raw.strTeam || '';
    const country = raw.strCountry || '';
    const countryCode = getCountryCode(country);
    
    return {
      id: generateNaturalId(`team_sdb_${teamName}`),
      name: teamName,
      shortName: raw.strTeamShort || teamName.slice(0, 3).toUpperCase(),
      countryCode,
      fifaCode: teamName.slice(0, 3).toUpperCase(),
      type: leagueType.toLowerCase().includes('cup') || leagueType.toLowerCase().includes('world') ? 'national' : 'club',
      logo: raw.strTeamBadge || null,
      flagUrl: getFlagUrl(countryCode),
      stadiumId: raw.strStadium ? generateNaturalId(`stadium_sdb_${raw.strStadium}`) : null,
      description: raw.strDescriptionEN || '',
      source: 'sportsdb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
