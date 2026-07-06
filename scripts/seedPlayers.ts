import { db } from './core/firebaseAdmin';

async function main() {
  console.log("Seeding players with real team and match references into Firestore...");

  // 1. Seed Tournaments if not already present
  const tournaments = [
    { id: 't_wc_2026', name: 'FIFA World Cup 2026', shortName: 'World Cup', logo: 'https://r2.thesportsdb.com/images/media/league/badge/fifa_world_cup.png' },
    { id: 't_ucl', name: 'UEFA Champions League', shortName: 'UCL', logo: 'https://r2.thesportsdb.com/images/media/league/badge/ucl.png' },
    { id: 't_epl', name: 'English Premier League', shortName: 'EPL', logo: 'https://r2.thesportsdb.com/images/media/league/badge/epl.png' },
    { id: 't_laliga', name: 'Spanish La Liga', shortName: 'La Liga', logo: 'https://r2.thesportsdb.com/images/media/league/badge/laliga.png' }
  ];

  for (const t of tournaments) {
    await db.collection('tournaments').doc(t.id).set(t, { merge: true });
  }
  console.log("Tournaments verified/seeded.");

  // 2. Seed Players pointing to authentic synced teams and matches
  const players = [
    {
      id: 'player_sdb_lionel_messi',
      name: 'Lionel Messi',
      image: 'https://r2.thesportsdb.com/images/media/player/cutout/51spu61702565860.png',
      teamId: 'teamwcargentina', // Synced team ID for Argentina
      nextMatchId: 'matchwc95', // Real match: Argentina vs Egypt on 2026-07-07
      position: 'Forward',
      nationality: 'Argentina',
      source: 'sportsdb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'player_sdb_cristiano_ronaldo',
      name: 'Cristiano Ronaldo',
      image: 'https://r2.thesportsdb.com/images/media/player/cutout/2x328y1700821617.png',
      teamId: 'teamwcportugal', // Synced team ID for Portugal
      nextMatchId: 'matchwc95', // Real match
      position: 'Forward',
      nationality: 'Portugal',
      source: 'sportsdb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'player_sdb_erling_haaland',
      name: 'Erling Haaland',
      image: 'https://r2.thesportsdb.com/images/media/player/cutout/9x5rrd1700822185.png',
      teamId: 'teamwcnorway', // Synced team ID for Norway
      nextMatchId: 'matchwc62', // Real match: Norway vs France on 2026-06-26
      position: 'Forward',
      nationality: 'Norway',
      source: 'sportsdb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const player of players) {
    await db.collection('players').doc(player.id).set(player, { merge: true });
  }
  console.log("Players seeded.");

  console.log("Seeding complete successfully.");
}

main().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
