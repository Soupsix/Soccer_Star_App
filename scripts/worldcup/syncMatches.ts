import { WorldCupApiClient } from '../clients/worldcup.client';
import { MatchNormalizer } from '../normalizers/match.normalizer';
import { MatchService } from '../services/match.service';
import { TeamService } from '../services/team.service';
import { StadiumService } from '../services/stadium.service';
import { Logger } from '../core/logger';

export async function syncMatches(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Fetching matches from World Cup API...", "SyncMatches");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const rawResponse = await WorldCupApiClient.request('/get/games');
    
    let list = rawResponse;
    if (rawResponse && !Array.isArray(rawResponse)) {
      if (Array.isArray((rawResponse as any).games)) {
        list = (rawResponse as any).games;
      } else if (Array.isArray((rawResponse as any).data)) {
        list = (rawResponse as any).data;
      } else if (Array.isArray((rawResponse as any).matches)) {
        list = (rawResponse as any).matches;
      }
    }

    if (!Array.isArray(list)) {
      Logger.warn(`Raw response keys: ${JSON.stringify(Object.keys(rawResponse || {}))}`, "SyncMatches");
      console.log("Raw Response Dump:", JSON.stringify(rawResponse));
      throw new Error("Invalid API response format for games list (expected array)");
    }

    Logger.info(`Found ${list.length} matches in feed. Processing relationships...`, "SyncMatches");

    const tourneyId = 't_wc_2026';

    if (list.length > 0) {
      Logger.info(`First raw match keys: ${JSON.stringify(Object.keys(list[0]))}`, "SyncMatches");
      console.log("Raw Match Sample:", JSON.stringify(list[0]));
    }

    for (const raw of list) {
      try {
        const homeName = raw.home_team_name_en || raw.home_team_name || raw.homeTeam;
        const awayName = raw.away_team_name_en || raw.away_team_name || raw.awayTeam;
        
        const homeId = await TeamService.resolveTeamIdByName(homeName);
        const awayId = await TeamService.resolveTeamIdByName(awayName);

        if (!homeId || !awayId) {
          Logger.warn(`Skipping match: Unable to resolve team IDs for ${homeName} or ${awayName}`, "SyncMatches");
          skipped++;
          continue;
        }

        // Resolve stadium ID
        let stadiumId = 'stadium_wc_unknown';
        if (raw.stadium_name) {
          const resolvedStadium = await StadiumService.resolveStadiumIdByName(raw.stadium_name);
          if (resolvedStadium) {
            stadiumId = resolvedStadium;
          }
        }

        // Normalize
        const { match, events } = MatchNormalizer.normalizeWorldCup(raw, {
          homeId,
          awayId,
          stadiumId,
          tourneyId,
        });

        // Write Match doc
        const matchResult = await MatchService.upsertMatch(match);
        
        // Write MatchEvents docs
        if (events.length > 0) {
          await MatchService.upsertMatchEvents(events);
        }

        if (matchResult === 'created' || matchResult === 'merged') {
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        Logger.error(`Failed to sync match record: ${raw.game_id || raw.id}`, err, "SyncMatches");
        failed++;
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("Matches synchronization complete.", "SyncMatches");
    Logger.summary("Matches", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to complete matches synchronization run.", error, "SyncMatches");
    throw error;
  }
}
