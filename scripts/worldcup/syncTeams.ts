import { WorldCupApiClient } from '../clients/worldcup.client';
import { TeamNormalizer } from '../normalizers/team.normalizer';
import { TeamService } from '../services/team.service';
import { StadiumService } from '../services/stadium.service';
import { Logger } from '../core/logger';

export async function syncTeams(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Fetching teams from World Cup API...", "SyncTeams");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const rawResponse = await WorldCupApiClient.request('/get/teams');
    
    let list = rawResponse;
    if (rawResponse && !Array.isArray(rawResponse)) {
      if (Array.isArray((rawResponse as any).teams)) {
        list = (rawResponse as any).teams;
      } else if (Array.isArray((rawResponse as any).data)) {
        list = (rawResponse as any).data;
      } else if (Array.isArray((rawResponse as any).team)) {
        list = (rawResponse as any).team;
      }
    }

    if (!Array.isArray(list)) {
      Logger.warn(`Raw response keys: ${JSON.stringify(Object.keys(rawResponse || {}))}`, "SyncTeams");
      console.log("Raw Response Dump:", JSON.stringify(rawResponse));
      throw new Error("Invalid API response format for teams list (expected array)");
    }

    Logger.info(`Found ${list.length} teams in feed. Standardizing data...`, "SyncTeams");

    for (const raw of list) {
      try {
        const teamDoc = TeamNormalizer.normalizeWorldCup(raw);

        // Resolve stadium ID reference dynamically if present
        if (raw.stadium_name) {
          const resolvedStadiumId = await StadiumService.resolveStadiumIdByName(raw.stadium_name);
          if (resolvedStadiumId) {
            teamDoc.stadiumId = resolvedStadiumId;
          }
        }

        const result = await TeamService.upsertTeam(teamDoc);
        if (result === 'created' || result === 'merged') {
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        Logger.error(`Failed to process team record`, err, "SyncTeams");
        failed++;
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("Teams synchronization complete.", "SyncTeams");
    Logger.summary("Teams", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to complete teams synchronization run.", error, "SyncTeams");
    throw error;
  }
}
