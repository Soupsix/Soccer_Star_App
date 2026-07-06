import { db } from '../core/firebaseAdmin';
import { SportsDbClient } from '../clients/sportsdb.client';
import { PlayerNormalizer } from '../normalizers/player.normalizer';
import { PlayerService } from '../services/player.service';
import { Logger } from '../core/logger';

export async function syncPlayers(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Starting SportsDB squad players synchronization...", "SyncSportsDbPlayers");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Get tracked club teams
    const clubsSnap = await db.collection('teams')
      .where('type', '==', 'club')
      .limit(10) // Limit clubs during sync to prevent API rate limits (or process all in production)
      .get();

    if (clubsSnap.empty) {
      Logger.warn("No club teams found in database. Skipping squad players sync.", "SyncSportsDbPlayers");
      return;
    }

    Logger.info(`Syncing squad rosters for ${clubsSnap.size} clubs...`, "SyncSportsDbPlayers");

    for (const clubDoc of clubsSnap.docs) {
      const teamId = clubDoc.id;
      const teamName = clubDoc.data().name;

      Logger.info(`Fetching roster from SportsDB for club: ${teamName}...`, "SyncSportsDbPlayers");

      try {
        const response = await SportsDbClient.get(`/searchplayers.php?t=${encodeURIComponent(teamName)}`);
        
        if (!response || !Array.isArray(response.player)) {
          Logger.warn(`No player squad roster returned for club: ${teamName}`, "SyncSportsDbPlayers");
          skipped++;
          continue;
        }

        Logger.info(`Found ${response.player.length} players for ${teamName}. Standardizing...`, "SyncSportsDbPlayers");

        for (const rawPlayer of response.player) {
          try {
            const playerDoc = PlayerNormalizer.normalizeSportsDb(rawPlayer, teamId);
            const result = await PlayerService.upsertPlayer(playerDoc);
            if (result === 'created' || result === 'merged') {
              updated++;
            } else {
              skipped++;
            }
          } catch (pErr) {
            Logger.error(`Failed to map player doc: ${rawPlayer.strPlayer}`, pErr, "SyncSportsDbPlayers");
            failed++;
          }
        }
      } catch (clubErr) {
        Logger.error(`Failed to sync player rosters for club ${teamName}`, clubErr, "SyncSportsDbPlayers");
        failed++;
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("SportsDB squad players synchronization complete.", "SyncSportsDbPlayers");
    Logger.summary("SportsDB Players", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to complete SportsDB squad players synchronization run.", error, "SyncSportsDbPlayers");
    throw error;
  }
}
