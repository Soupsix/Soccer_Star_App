import { WorldCupApiClient } from '../clients/worldcup.client';
import { StadiumNormalizer } from '../normalizers/stadium.normalizer';
import { StadiumService } from '../services/stadium.service';
import { Logger } from '../core/logger';

export async function syncStadiums(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Fetching stadiums from World Cup API...", "SyncStadiums");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const rawResponse = await WorldCupApiClient.request('/get/stadiums');
    
    let list = rawResponse;
    if (rawResponse && !Array.isArray(rawResponse)) {
      if (Array.isArray((rawResponse as any).stadiums)) {
        list = (rawResponse as any).stadiums;
      } else if (Array.isArray((rawResponse as any).data)) {
        list = (rawResponse as any).data;
      } else if (Array.isArray((rawResponse as any).stadium)) {
        list = (rawResponse as any).stadium;
      }
    }

    if (!Array.isArray(list)) {
      Logger.warn(`Raw response keys: ${JSON.stringify(Object.keys(rawResponse || {}))}`, "SyncStadiums");
      console.log("Raw Response Dump:", JSON.stringify(rawResponse));
      throw new Error("Invalid API response format for stadiums list (expected array)");
    }

    Logger.info(`Found ${list.length} stadiums in feed. Standardizing data...`, "SyncStadiums");

    for (const raw of list) {
      try {
        const stadiumDoc = StadiumNormalizer.normalizeWorldCup(raw);
        const result = await StadiumService.upsertStadium(stadiumDoc);
        if (result === 'created' || result === 'merged') {
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        Logger.error(`Failed to normalize or upsert stadium doc`, err, "SyncStadiums");
        failed++;
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("Stadiums synchronization complete.", "SyncStadiums");
    Logger.summary("Stadiums", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to complete stadiums synchronization run.", error, "SyncStadiums");
    throw error;
  }
}
