import { WorldCupApiClient } from '../clients/worldcup.client';
import { GroupNormalizer } from '../normalizers/group.normalizer';
import { TeamService } from '../services/team.service';
import { db } from '../core/firebaseAdmin';
import { Logger } from '../core/logger';

export async function syncGroups(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Fetching group standings from World Cup API...", "SyncGroups");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const rawResponse = await WorldCupApiClient.request('/get/groups');
    
    let list = rawResponse;
    if (rawResponse && !Array.isArray(rawResponse)) {
      if (Array.isArray((rawResponse as any).groups)) {
        list = (rawResponse as any).groups;
      } else if (Array.isArray((rawResponse as any).data)) {
        list = (rawResponse as any).data;
      } else if (Array.isArray((rawResponse as any).standings)) {
        list = (rawResponse as any).standings;
      }
    }

    if (!Array.isArray(list)) {
      Logger.warn(`Raw response keys: ${JSON.stringify(Object.keys(rawResponse || {}))}`, "SyncGroups");
      console.log("Raw Response Dump:", JSON.stringify(rawResponse));
      throw new Error("Invalid API response format for groups standings (expected array)");
    }

    Logger.info(`Found ${list.length} groups in feed. Processing standings...`, "SyncGroups");

    const tournamentId = 't_wc_2026';
    const batch = db.batch();

    if (list.length > 0) {
      Logger.info(`First raw group keys: ${JSON.stringify(Object.keys(list[0]))}`, "SyncGroups");
      console.log("Raw Group Sample:", JSON.stringify(list[0]));
    }

    for (const raw of list) {
      try {
        const groupDoc = GroupNormalizer.normalizeWorldCup(raw, tournamentId, (name: string) => {
          const cleanName = (name || '').trim();
          if (!cleanName) return 'unknown_team';
          return `team_wc_${cleanName.toLowerCase().replace(/[\s-]+/g, '_')}`;
        });

        const docRef = db.collection('groups').doc(groupDoc.id);
        batch.set(docRef, groupDoc, { merge: true });
        updated++;
      } catch (err) {
        Logger.error(`Failed to map group standings doc`, err, "SyncGroups");
        failed++;
      }
    }

    if (updated > 0) {
      await batch.commit();
    }

    const durationMs = Date.now() - startTime;
    Logger.success("Group standings synchronization complete.", "SyncGroups");
    Logger.summary("Groups", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to complete group standings synchronization run.", error, "SyncGroups");
    throw error;
  }
}
