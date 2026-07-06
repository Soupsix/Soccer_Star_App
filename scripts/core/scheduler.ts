import { db } from './firebaseAdmin';
import { Logger } from './logger';

// Sync scripts imports
import { syncTournament as syncWcTournament } from '../worldcup/syncTournament';
import { syncStadiums as syncWcStadiums } from '../worldcup/syncStadiums';
import { syncTeams as syncWcTeams } from '../worldcup/syncTeams';
import { syncPlayers as syncWcPlayers } from '../worldcup/syncPlayers';
import { syncMatches as syncWcMatches } from '../worldcup/syncMatches';
import { syncGroups as syncWcGroups } from '../worldcup/syncGroups';

import { syncTeams as syncSdbTeams } from '../sportsdb/syncTeams';
import { syncPlayers as syncSdbPlayers } from '../sportsdb/syncPlayers';
import { syncMatches as syncSdbMatches } from '../sportsdb/syncMatches';

export interface SyncLogDoc {
  provider: 'worldcup' | 'sportsdb' | 'system';
  task: string;
  startedAt: string;
  endedAt: string;
  status: 'SUCCESS' | 'FAILED';
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  error: string | null;
}

/**
 * Log the sync execution details to Firestore sync_logs collection.
 */
async function writeSyncLog(log: SyncLogDoc): Promise<void> {
  try {
    const docRef = db.collection('sync_logs').doc();
    await docRef.set({
      id: docRef.id,
      ...log,
      createdAt: new Date().toISOString(),
    });
    Logger.success(`Saved execution sync receipt to Firestore sync_logs.`, "Scheduler");
  } catch (error) {
    Logger.error("Failed to write to sync_logs collection.", error, "Scheduler");
  }
}

/**
 * Wraps task execution with runtime calculations and Firestore logging.
 */
async function runTask(
  name: string,
  provider: 'worldcup' | 'sportsdb' | 'system',
  taskFn: () => Promise<void>
): Promise<boolean> {
  const startedAt = new Date().toISOString();
  Logger.info(`Starting synchronization task: [${name}]`, "Scheduler");
  
  try {
    await taskFn();
    const endedAt = new Date().toISOString();
    
    await writeSyncLog({
      provider,
      task: name,
      startedAt,
      endedAt,
      status: 'SUCCESS',
      updatedCount: 0, // In production, we'd pipe exact counts from the modules
      skippedCount: 0,
      failedCount: 0,
      error: null,
    });
    
    Logger.success(`Task [${name}] completed successfully.`, "Scheduler");
    return true;
  } catch (error: any) {
    const endedAt = new Date().toISOString();
    
    await writeSyncLog({
      provider,
      task: name,
      startedAt,
      endedAt,
      status: 'FAILED',
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      error: error.message || String(error),
    });

    Logger.error(`Task [${name}] failed. Exiting gracefully.`, error, "Scheduler");
    return false;
  }
}

/**
 * Main execution routing based on command line arguments.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--all';

  Logger.info(`Orchestrator started with command flag: ${command}`, "Scheduler");

  let success = true;

  switch (command) {
    case '--worldcup':
      Logger.info("Executing World Cup 2026 Ingestion Pipeline...", "Scheduler");
      // Dependency order: Tournaments -> Stadiums -> Teams -> Players -> Matches -> Groups
      success = await runTask('WorldCup:Tournament', 'worldcup', syncWcTournament);
      if (success) success = await runTask('WorldCup:Stadiums', 'worldcup', syncWcStadiums);
      if (success) success = await runTask('WorldCup:Teams', 'worldcup', syncWcTeams);
      if (success) success = await runTask('WorldCup:Players', 'worldcup', syncWcPlayers);
      if (success) success = await runTask('WorldCup:Matches', 'worldcup', syncWcMatches);
      if (success) success = await runTask('WorldCup:Groups', 'worldcup', syncWcGroups);
      break;

    case '--sportsdb':
      Logger.info("Executing SportsDB Ingestion Pipeline...", "Scheduler");
      // Dependency order: Teams -> Players -> Matches
      success = await runTask('SportsDB:Teams', 'sportsdb', syncSdbTeams);
      if (success) success = await runTask('SportsDB:Players', 'sportsdb', syncSdbPlayers);
      if (success) success = await runTask('SportsDB:Matches', 'sportsdb', syncSdbMatches);
      break;

    case '--teams':
      Logger.info("Executing Teams-only Sync...", "Scheduler");
      success = await runTask('WorldCup:Teams', 'worldcup', syncWcTeams);
      if (success) success = await runTask('SportsDB:Teams', 'sportsdb', syncSdbTeams);
      break;

    case '--players':
      Logger.info("Executing Players-only Sync...", "Scheduler");
      success = await runTask('WorldCup:Players', 'worldcup', syncWcPlayers);
      if (success) success = await runTask('SportsDB:Players', 'sportsdb', syncSdbPlayers);
      break;

    case '--matches':
      Logger.info("Executing Matches-only Sync...", "Scheduler");
      success = await runTask('WorldCup:Matches', 'worldcup', syncWcMatches);
      if (success) success = await runTask('SportsDB:Matches', 'sportsdb', syncSdbMatches);
      break;

    case '--groups':
      Logger.info("Executing Groups-only Sync...", "Scheduler");
      success = await runTask('WorldCup:Groups', 'worldcup', syncWcGroups);
      break;

    case '--all':
    default:
      Logger.info("Executing All Sync Pipelines in dependency order...", "Scheduler");
      // 1. World Cup Pipeline
      success = await runTask('WorldCup:Tournament', 'worldcup', syncWcTournament);
      if (success) success = await runTask('WorldCup:Stadiums', 'worldcup', syncWcStadiums);
      if (success) success = await runTask('WorldCup:Teams', 'worldcup', syncWcTeams);
      if (success) success = await runTask('WorldCup:Players', 'worldcup', syncWcPlayers);
      if (success) success = await runTask('WorldCup:Matches', 'worldcup', syncWcMatches);
      if (success) success = await runTask('WorldCup:Groups', 'worldcup', syncWcGroups);

      // 2. SportsDB Pipeline
      if (success) success = await runTask('SportsDB:Teams', 'sportsdb', syncSdbTeams);
      if (success) success = await runTask('SportsDB:Players', 'sportsdb', syncSdbPlayers);
      if (success) success = await runTask('SportsDB:Matches', 'sportsdb', syncSdbMatches);
      break;
  }

  if (success) {
    Logger.success("Synchronization session completed successfully.", "Scheduler");
    process.exit(0);
  } else {
    Logger.error("Synchronization session failed during execution pipeline.", null, "Scheduler");
    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  Logger.error("Uncaught exception in orchestrator thread.", err, "Scheduler");
  process.exit(1);
});
