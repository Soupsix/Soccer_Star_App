import { SportsDbClient } from '../clients/sportsdb.client';
import { TeamNormalizer } from '../normalizers/team.normalizer';
import { TeamService } from '../services/team.service';
import { Logger } from '../core/logger';

const TRACKED_LEAGUES = [
  { id: '4328', name: 'English Premier League' },
  { id: '4335', name: 'Spanish La Liga' },
  { id: '4331', name: 'German Bundesliga' },
  { id: '4332', name: 'Italian Serie A' },
];

export async function syncTeams(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Starting SportsDB club teams synchronization...", "SyncSportsDbTeams");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const league of TRACKED_LEAGUES) {
      Logger.info(`Fetching teams for league: ${league.name} (${league.id})...`, "SyncSportsDbTeams");

      try {
        const response = await SportsDbClient.get(`/lookup_all_teams.php?id=${league.id}`);
        if (!response || !Array.isArray(response.teams)) {
          Logger.warn(`No teams returned for league: ${league.name}`, "SyncSportsDbTeams");
          skipped++;
          continue;
        }

        Logger.info(`Found ${response.teams.length} teams in league: ${league.name}. Standardizing...`, "SyncSportsDbTeams");

        for (const raw of response.teams) {
          try {
            const teamDoc = TeamNormalizer.normalizeSportsDb(raw, league.name);
            const result = await TeamService.upsertTeam(teamDoc);
            if (result === 'created' || result === 'merged') {
              updated++;
            } else {
              skipped++;
            }
          } catch (err) {
            Logger.error(`Failed to map team doc: ${raw.strTeam}`, err, "SyncSportsDbTeams");
            failed++;
          }
        }
      } catch (leagueErr) {
        Logger.error(`Failed to sync teams for league ${league.name}`, leagueErr, "SyncSportsDbTeams");
        failed++;
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("SportsDB club teams synchronization complete.", "SyncSportsDbTeams");
    Logger.summary("SportsDB Teams", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to execute SportsDB club teams synchronization run.", error, "SyncSportsDbTeams");
    throw error;
  }
}
