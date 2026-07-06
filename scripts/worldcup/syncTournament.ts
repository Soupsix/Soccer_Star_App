import { TournamentService, TournamentDoc } from '../services/tournament.service';
import { Logger } from '../core/logger';

export async function syncTournament(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Starting World Cup tournament synchronization...", "SyncTournament");
  
  const tourney: TournamentDoc = {
    id: 't_wc_2026',
    name: 'FIFA World Cup 2026',
    shortName: 'World Cup 2026',
    logo: 'https://r2.thesportsdb.com/images/media/league/logo/jduyul1700824982.png',
    continent: 'World',
    isActive: true
  };

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const result = await TournamentService.upsertTournament(tourney);
    if (result === 'created' || result === 'merged') {
      updated = 1;
    } else {
      skipped = 1;
    }
    
    const durationMs = Date.now() - startTime;
    Logger.success("Tournament synchronization complete.", "SyncTournament");
    Logger.summary("Tournament", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to sync tournament metadata.", error, "SyncTournament");
    throw error;
  }
}
