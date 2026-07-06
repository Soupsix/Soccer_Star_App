import { SportsDbClient } from '../clients/sportsdb.client';
import { MatchNormalizer } from '../normalizers/match.normalizer';
import { MatchService } from '../services/match.service';
import { TeamService } from '../services/team.service';
import { StadiumService } from '../services/stadium.service';
import { TournamentService, TournamentDoc } from '../services/tournament.service';
import { Logger } from '../core/logger';

const TRACKED_LEAGUES = [
  { id: '4328', tourneyId: 't_epl', name: 'Premier League', shortName: 'EPL', continent: 'Europe' },
  { id: '4335', tourneyId: 't_laliga', name: 'La Liga', shortName: 'La Liga', continent: 'Europe' },
  { id: '4331', tourneyId: 't_bundesliga', name: 'German Bundesliga', shortName: 'Bundesliga', continent: 'Europe' },
];

export async function syncMatches(): Promise<void> {
  const startTime = Date.now();
  Logger.info("Starting SportsDB matches synchronization...", "SyncSportsDbMatches");

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const league of TRACKED_LEAGUES) {
      Logger.info(`Synchronizing tournament details for: ${league.name}...`, "SyncSportsDbMatches");
      
      // Ensure the tournament entity exists
      const tourney: TournamentDoc = {
        id: league.tourneyId,
        name: league.name,
        shortName: league.shortName,
        logo: null,
        continent: league.continent,
        isActive: true,
      };
      await TournamentService.upsertTournament(tourney);

      // Fetch matches: both past (scores) and upcoming (schedules)
      const endpoints = [
        `/eventspastleague.php?id=${league.id}`,
        `/eventsnextleague.php?id=${league.id}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await SportsDbClient.get(endpoint);
          if (!response || !Array.isArray(response.events)) {
            continue;
          }

          Logger.info(`Found ${response.events.length} match events on ${endpoint}. Processing...`, "SyncSportsDbMatches");

          for (const rawEvent of response.events) {
            try {
              // Resolve home/away team documents
              const homeName = rawEvent.strHomeTeam;
              const awayName = rawEvent.strAwayTeam;

              const homeId = await TeamService.resolveTeamIdByName(homeName);
              const awayId = await TeamService.resolveTeamIdByName(awayName);

              if (!homeId || !awayId) {
                Logger.warn(`Skipping match: Unable to resolve team IDs for ${homeName} or ${awayName}`, "SyncSportsDbMatches");
                skipped++;
                continue;
              }

              // Resolve venue/stadium ID reference
              let stadiumId = 'stadium_sdb_unknown';
              if (rawEvent.strVenue) {
                const resolvedStadium = await StadiumService.resolveStadiumIdByName(rawEvent.strVenue);
                if (resolvedStadium) {
                  stadiumId = resolvedStadium;
                }
              }

              // Normalize
              const { match, events } = MatchNormalizer.normalizeSportsDb(rawEvent, {
                homeId,
                awayId,
                stadiumId,
                tourneyId: league.tourneyId,
              });

              // Write MatchDoc
              const result = await MatchService.upsertMatch(match);
              
              // Write MatchEventDocs
              if (events.length > 0) {
                await MatchService.upsertMatchEvents(events);
              }

              if (result === 'created' || result === 'merged') {
                updated++;
              } else {
                skipped++;
              }
            } catch (err) {
              Logger.error(`Failed to process SportsDB event: ${rawEvent.idEvent}`, err, "SyncSportsDbMatches");
              failed++;
            }
          }
        } catch (apiErr) {
          Logger.error(`Failed to fetch SportsDB events from endpoint ${endpoint}`, apiErr, "SyncSportsDbMatches");
          failed++;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    Logger.success("SportsDB matches synchronization complete.", "SyncSportsDbMatches");
    Logger.summary("SportsDB Matches", { updated, skipped, failed, durationMs });
  } catch (error) {
    Logger.error("Failed to complete SportsDB matches synchronization run.", error, "SyncSportsDbMatches");
    throw error;
  }
}
