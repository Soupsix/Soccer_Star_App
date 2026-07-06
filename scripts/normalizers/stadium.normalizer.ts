import { generateNaturalId } from '../utils/mapper';

export interface StadiumDoc {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  capacity: number;
  latitude: number;
  longitude: number;
  image: string | null;
  surface: string;
  opened: number;
  source: 'worldcup' | 'sportsdb';
}

export class StadiumNormalizer {
  /**
   * Normalizes World Cup 2026 API stadium payloads.
   */
  static normalizeWorldCup(raw: any): StadiumDoc {
    const stadiumName = raw.stadium_name || raw.name || '';
    
    return {
      id: generateNaturalId(`stadium_wc_${stadiumName}`),
      name: stadiumName,
      city: raw.city || '',
      state: raw.state || null,
      country: raw.country || 'USA',
      capacity: raw.capacity ? parseInt(raw.capacity, 10) : 0,
      latitude: raw.latitude ? parseFloat(raw.latitude) : 0,
      longitude: raw.longitude ? parseFloat(raw.longitude) : 0,
      image: raw.image_url || null,
      surface: raw.surface_type || 'Grass',
      opened: raw.year_opened ? parseInt(raw.year_opened, 10) : 0,
      source: 'worldcup',
    };
  }

  /**
   * Normalizes TheSportsDB API stadium payloads.
   */
  static normalizeSportsDb(raw: any): StadiumDoc {
    const stadiumName = raw.strStadium || '';
    
    return {
      id: generateNaturalId(`stadium_sdb_${stadiumName}`),
      name: stadiumName,
      city: raw.strStadiumLocation || '',
      state: null,
      country: raw.strCountry || '',
      capacity: raw.intStadiumCapacity ? parseInt(raw.intStadiumCapacity, 10) : 0,
      latitude: 0,
      longitude: 0,
      image: raw.strStadiumThumb || null,
      surface: 'Grass',
      opened: 0,
      source: 'sportsdb',
    };
  }
}
