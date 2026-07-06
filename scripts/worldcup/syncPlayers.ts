import { db } from '../core/firebaseAdmin';
import { SportsDbClient } from '../clients/sportsdb.client';
import { PlayerNormalizer } from '../normalizers/player.normalizer';
import { PlayerService } from '../services/player.service';
import { Logger } from '../core/logger';

export async function syncPlayers(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Starting World Cup squad players synchronization...", "SyncWorldCupPlayers");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // 1. Retrieve all national teams currently stored in Firestore
    const teamsSnap = await db.collection('teams')
      .where('type', '==', 'national')
      .get();

    if (teamsSnap.empty) {
      Logger.warn("No national teams found in database. Skipping squad players sync.", "SyncWorldCupPlayers");
      return;
    }

    Logger.info(`Found ${teamsSnap.size} national teams. Querying rosters from SportsDB...`, "SyncWorldCupPlayers");

    // 2. Fetch rosters from SportsDB for each team
    for (const teamDoc of teamsSnap.docs) {
      const teamId = teamDoc.id;
      const teamName = teamDoc.data().name;

      Logger.info(`Fetching roster for national team: ${teamName}...`, "SyncWorldCupPlayers");

      try {
        const response = await SportsDbClient.get(`/searchplayers.php?t=${encodeURIComponent(teamName)}`);
        
        if (!response || !Array.isArray(response.player)) {
          Logger.warn(`No player roster found on SportsDB for team: ${teamName}`, "SyncWorldCupPlayers");
          skipped++;
          continue;
        }

        Logger.info(`Found ${response.player.length} players for ${teamName}. Upserting...`, "SyncWorldCupPlayers");

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
            Logger.error(`Failed to normalize or write player doc: ${rawPlayer.strPlayer}`, pErr, "SyncWorldCupPlayers");
            failed++;
          }
        }
      } catch (teamErr) {
        Logger.error(`Failed to sync player rosters for team ${teamName}`, teamErr, "SyncWorldCupPlayers");
        failed++;
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("World Cup squad players synchronization complete.", "SyncWorldCupPlayers");
    Logger.summary("World Cup Players", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to execute World Cup squad players sync run.", error, "SyncWorldCupPlayers");
    throw error;
  }
}
