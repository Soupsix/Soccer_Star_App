Available match endpoints
Method	Endpoint	Description
GET	/matches	Search and filter matches.
GET	/matches/{match_id}	Get full match details.
GET	/matches/date/{date}	List matches by exact date. Date format: YYYY-MM-DD.
GET	/matches/{match_id}/events	Get match events.
GET	/matches/{match_id}/stats	Get match statistics.
GET	/matches/{match_id}/odds	Get match odds.
GET	/matches/{match_id}/probabilities	Get match probabilities.
GET	/matches/{match_id}/predictions	Get full match predictions. Pro
GET	/matches/{match_id}/btts	Get BTTS data and odds. Pro
GET	/matches/{match_id}/corners	Get corner statistics and odds. Pro
GET /matches
Returns a paginated list of matches. Use filters to narrow results by date, league, season, team, or status.

Example request
curl "https://footballdata.io/api/v1/matches?league_id=10&limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
date	date	Filter by exact date using YYYY-MM-DD.
from	date	Start date using YYYY-MM-DD.
to	date	End date using YYYY-MM-DD.
league_id	integer	Filter by public league ID.
season_id	integer	Filter by public season ID.
team_id	integer	Filter matches where the team is either home or away.
status	string	Filter by match status.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /matches/{match_id}
Returns full match details using the public match_id.

Example request
curl "https://footballdata.io/api/v1/matches/12345" \
  -H "Authorization: Bearer YOUR_API_KEY"
Response includes
Match date, Unix timestamp, status, round, and game week.
League and season information.
Home and away team information.
Scores, halftime scores, and second-half scores where available.
Match statistics such as cards, corners, shots, fouls, possession, and attacks.
Odds, probabilities, xG, venue, lineups, bench, and head-to-head data where available.
GET /matches/date/{date}
Returns matches for a specific date.

Example request
curl "https://footballdata.io/api/v1/matches/date/2026-05-03" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
league_id	integer	Filter by league.
season_id	integer	Filter by season.
status	string	Filter by match status.
sort	string	Use asc or desc. Default is usually asc.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /matches/{match_id}/events
Returns normalized events for a match. Events may include goals, assists, lineups, substitutes, and bench data when available.

Example request
curl "https://footballdata.io/api/v1/matches/12345/events" \
  -H "Authorization: Bearer YOUR_API_KEY"
Event coverage varies by match, league, and season.

GET /matches/{match_id}/stats
Returns match statistics only. Use this endpoint when you do not need the full match detail response.

Example request
curl "https://footballdata.io/api/v1/matches/12345/stats" \
  -H "Authorization: Bearer YOUR_API_KEY"
Common stats
Goals
Corners
Yellow and red cards
Shots, shots on target, and shots off target
Fouls
Possession
Attacks and dangerous attacks
xG (actual) where available
Half-time goals (home, away, total)
Second-half goals (home, away, total)
Pre-match xG (home, away, total)
Venue data
Stadium name
Attendance
Referee ID
Example response
{
  "success": true,
  "data": {
    "match": { ... },
    "stats": {
      "xg": { "home": 2.14, "away": 0.89, "total": 3.03 },
      "shots": { "home": 18, "away": 9, "total": 27 },
      "corners": { "home": 7, "away": 4, "total": 11 },
      "possession": { "home": 62.4, "away": 37.6 },
      "half_time_goals": { "home": 1, "away": 0, "total": 1 },
      "second_half_goals": { "home": 1, "away": 1, "total": 2 },
      "xg_prematch": { "home": 1.85, "away": 1.22, "total": 3.07 }
    },
    "venue": {
      "stadium": "Emirates Stadium",
      "attendance": 60214,
      "referee_id": 4812
    }
  }
}
GET /matches/{match_id}/odds
Returns available odds for a match across 60+ markets.

Example request
curl "https://footballdata.io/api/v1/matches/12345/odds" \
  -H "Authorization: Bearer YOUR_API_KEY"
Available markets
Market	Fields
match_winner	home, draw, away
total_goals	over/under 0.5 to 4.5
both_teams_to_score	yes, no
double_chance	home_or_draw, home_or_away, draw_or_away
draw_no_bet	home, away
corners	over/under 7.5 to 11.5, match_winner (1X2)
btts_first_half	yes, no
btts_second_half	yes, no
clean_sheet	home_yes, home_no, away_yes, away_no
first_half_result	home, draw, away
first_half_goals	over/under 0.5, 1.5, 2.5
second_half_result	home, draw, away
second_half_goals	over/under 0.5, 1.5, 2.5
team_to_score_first	home, no_goal, away
win_to_nil	home, away
All odds are decimal format. Fields return null when unavailable.

GET /matches/{match_id}/probabilities
Returns match probabilities such as home win, draw, away win, goal lines, BTTS, and corners where available.

Example request
curl "https://footballdata.io/api/v1/matches/12345/probabilities" \
  -H "Authorization: Bearer YOUR_API_KEY"
GET /matches/{match_id}/predictions
Pro plan required

Returns comprehensive pre-match predictions including match winner probabilities, BTTS potential, over/under goal probabilities, corner potential, pre-match xG, and PPG data.

Example request
curl "https://footballdata.io/api/v1/matches/12345/predictions" \
  -H "Authorization: Bearer YOUR_API_KEY"
Response includes
match_winner — home, draw, away win probabilities.
btts — BTTS potential (full match, first half, second half).
goals — over 0.5 to 4.5 goal probabilities.
first_half_goals / second_half_goals — per-half over 0.5 to 2.5.
corners — corner potential, over 8.5/9.5/10.5 potential.
xg_prematch — expected goals (home, away, total).
ppg — points per game (home, away, overall for each team).
average_potential — combined prediction confidence score.
Example response
{
  "success": true,
  "data": {
    "match": { ... },
    "predictions": {
      "match_winner": { "home": 52.3, "draw": 24.1, "away": 23.6 },
      "btts": { "potential": 68.5, "first_half": 42.1, "second_half": 55.8 },
      "goals": {
        "over_0_5": 92.4, "over_1_5": 78.6, "over_2_5": 58.3,
        "over_3_5": 35.2, "over_4_5": 18.1
      },
      "corners": { "potential": 72.1, "over_8_5": 65.4, "over_9_5": 52.8, "over_10_5": 38.2 },
      "xg_prematch": { "home": 1.85, "away": 1.22, "total": 3.07 },
      "ppg": { "home": 2.14, "away": 1.67, "home_overall": 2.05, "away_overall": 1.82 },
      "average_potential": 64.7
    }
  }
}
GET /matches/{match_id}/btts
Pro plan required

Returns Both Teams To Score potential with first/second half breakdown and BTTS odds.

Example request
curl "https://footballdata.io/api/v1/matches/12345/btts" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example response
{
  "success": true,
  "data": {
    "match": { ... },
    "btts": {
      "potential": 68.5,
      "first_half_potential": 42.1,
      "second_half_potential": 55.8,
      "odds": { "yes": 1.72, "no": 2.05 }
    }
  }
}
GET /matches/{match_id}/corners
Pro plan required

Returns corner statistics split by half, corner potential scores, and corner over/under odds.

Example request
curl "https://footballdata.io/api/v1/matches/12345/corners" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example response
{
  "success": true,
  "data": {
    "match": { ... },
    "corners": {
      "total": { "home": 7, "away": 4, "total": 11 },
      "first_half": { "home": 4, "away": 2, "total": 6 },
      "second_half": { "home": 3, "away": 2, "total": 5 },
      "potential": 72.1,
      "over_8_5_potential": 65.4,
      "over_9_5_potential": 52.8,
      "over_10_5_potential": 38.2
    },
    "odds": {
      "over_7_5": 1.45, "over_8_5": 1.72, "over_9_5": 2.10,
      "over_10_5": 2.65, "over_11_5": 3.40,
      "under_7_5": 2.55, "under_8_5": 2.05, "under_9_5": 1.68,
      "under_10_5": 1.42, "under_11_5": 1.28
    }
  }
}
Example match response
{
  "success": true,
  "data": {
    "match_id": 12345,
    "match_date": "2026-05-03",
    "date_unix": 1777795200,
    "status": "complete",
    "league": {
      "league_id": 10,
      "name": "England Premier League",
      "country": "England",
      "competition_name": "Premier League"
    },
    "season": {
      "season_id": 100,
      "year": 2026
    },
    "home_team": {
      "team_id": 1119,
      "team_name": "Arsenal",
      "team_logo": "https://example.com/arsenal.png"
    },
    "away_team": {
      "team_id": 1121,
      "team_name": "Chelsea",
      "team_logo": "https://example.com/chelsea.png"
    },
    "score": {
      "home": 2,
      "away": 1,
      "total": 3
    },
    "stats": {
      "corners": {
        "home": 6,
        "away": 4,
        "total": 10
      },
      "cards": {
        "home_total": 2,
        "away_total": 3
      },
      "shots": {
        "home_total": 14,
        "away_total": 9
      }
    },
    "probabilities": {
      "home_win": 45.2,
      "draw": 27.9,
      "away_win": 26.9
    }
  },
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season."
  }
}
Localization (multilingual responses)
Add ?lang= to any fixtures or match endpoint to receive localized, human-readable fields alongside the raw ones. Supported languages: en, es, fr, pt, de, it, nl, tr, ar, id, ru.

Paid plans only — free-plan keys always receive English (en).

Added fields
These are added next to the existing values — the raw status is never changed, so existing integrations keep working.

Field	Description
status_localized	The match status translated into the requested language (e.g. complete → Terminé).
winner_text	A localized result sentence for finished matches (e.g. Arsenal a gagné le match). Omitted when a match has no final result.
meta.language	The language the response was localized to (the effective language after plan gating).
Example request
curl "https://footballdata.io/api/v1/fixtures/results?lang=fr" \
  -H "Authorization: Bearer YOUR_API_KEY"
Localized response (excerpt)
{
  "data": {
    "matches": [
      {
        "match_id": 12345,
        "status": "complete",
        "status_localized": "Terminé",
        "home_team": { "team_name": "Arsenal" },
        "away_team": { "team_name": "Chelsea" },
        "score": { "home": 2, "away": 1 },
        "winner_text": "Arsenal a gagné le match"
      }
    ]
  },
  "meta": { "language": "fr" }
}
An omitted or unsupported ?lang=, or any request on a free-plan key, returns English.