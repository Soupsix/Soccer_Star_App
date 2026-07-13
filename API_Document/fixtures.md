Base URL
https://footballdata.io/api/v1
All fixture endpoints require authentication using your API key.

Authorization: Bearer YOUR_API_KEY
Available fixture endpoints
Method	Endpoint	Description
GET	/fixtures/today	Returns fixtures scheduled for today.
GET	/fixtures/upcoming	Returns upcoming scheduled fixtures.
GET	/fixtures/live	Returns live or in-progress fixtures.
GET	/fixtures/results	Returns recent completed results.
GET	/fixtures/today/predictions	Today's fixtures with full predictions. Pro
GET /fixtures/today
Returns matches scheduled for today. This endpoint is useful for dashboards, scoreboards, prediction pages, and daily fixture lists.

Example request
curl "https://footballdata.io/api/v1/fixtures/today" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
league_id	integer	Filter today’s fixtures by league.
season_id	integer	Filter today’s fixtures by season.
status	string	Filter by match status.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /fixtures/upcoming
Returns upcoming fixtures. By default, this starts from today and returns scheduled matches.

Example request
curl "https://footballdata.io/api/v1/fixtures/upcoming?limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
from	date	Start date in YYYY-MM-DD format.
to	date	End date in YYYY-MM-DD format.
league_id	integer	Filter by league.
season_id	integer	Filter by season.
team_id	integer	Filter by team.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /fixtures/live
Returns fixtures currently marked as live or in-progress.

Example request
curl "https://footballdata.io/api/v1/fixtures/live" \
  -H "Authorization: Bearer YOUR_API_KEY"
If there are no live matches at the time of request, the endpoint returns an empty data list with a successful response.

GET /fixtures/results
Returns recently completed matches. This endpoint is useful for result pages, post-match summaries, and historical fixture feeds.

Example request
curl "https://footballdata.io/api/v1/fixtures/results?limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
date	date	Filter results by exact date using YYYY-MM-DD.
from	date	Start date in YYYY-MM-DD format.
to	date	End date in YYYY-MM-DD format.
league_id	integer	Filter by league.
season_id	integer	Filter by season.
team_id	integer	Filter by team.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
Example response
{
  "success": true,
  "data": [
    {
      "match_id": 12345,
      "match_date": "2026-05-03",
      "date_unix": 1777795200,
      "status": "scheduled",
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
        "home": null,
        "away": null,
        "total": null
      },
      "odds": {
        "home_win": 2.10,
        "draw": 3.40,
        "away_win": 3.20
      },
      "probabilities": {
        "home_win": 45.2,
        "draw": 27.9,
        "away_win": 26.9
      }
    }
  ],
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season.",
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "total_pages": 1
    }
  }
}
GET /fixtures/today/predictions
Pro plan required

Returns today's fixtures enriched with full prediction data. Same pagination and filtering as /fixtures/today, with an added predictions block per match.

Example request
curl "https://footballdata.io/api/v1/fixtures/today/predictions?league_id=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Same as /fixtures/today: league_id, season_id, status, page, limit.

Predictions block per match
"predictions": {
  "match_winner": { "home": 52.3, "draw": 24.1, "away": 23.6 },
  "btts": { "potential": 68.5, "first_half": 42.1, "second_half": 55.8 },
  "goals": {
    "over_0_5": 92.4, "over_1_5": 78.6, "over_2_5": 58.3,
    "over_3_5": 35.2, "over_4_5": 18.1
  },
  "corners_potential": 72.1,
  "xg_prematch": { "home": 1.85, "away": 1.22, "total": 3.07 },
  "average_potential": 64.7
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

Recommended usage
Use /fixtures/today for daily match pages.
Use /fixtures/upcoming for schedule pages and pre-match apps.
Use /fixtures/live for live scoreboards.
Use /fixtures/results for recent completed matches.
Use /fixtures/today/predictions for prediction-focused dashboards.
Cache upcoming fixtures for 15–60 minutes.
Cache live fixtures for a much shorter period, such as 30–120 seconds.