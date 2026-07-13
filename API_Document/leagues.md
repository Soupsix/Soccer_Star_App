Base URL
https://footballdata.io/api/v1
All league endpoints require authentication.

Authorization: Bearer YOUR_API_KEY
Available league endpoints
Method	Endpoint	Description
GET	/leagues	List available leagues.
GET	/leagues/{league_id}/matches	List matches for a league.
GET	/leagues/{league_id}/standings	Get league standings.
GET	/leagues/{league_id}/teams	List teams in a league.
GET	/leagues/{league_id}/seasons	List seasons for a league.
GET	/leagues/{league_id}/stats	Get full season statistics. Paid
GET	/leagues/{league_id}/btts	Get season BTTS and goal percentages. Paid
GET	/leagues/{league_id}/corners	Get season corner averages. Paid
GET /leagues
Returns a paginated list of football leagues available in the API. Use this endpoint to find the public league_id.

Example request
curl "https://footballdata.io/api/v1/leagues?country=England&limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
q	string	Search by league name or competition name.
country	string	Filter leagues by country.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /leagues/{league_id}/matches
Returns matches connected to a public league_id.

Example request
curl "https://footballdata.io/api/v1/leagues/10/matches?limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter matches by public season ID.
date	date	Filter by exact date using YYYY-MM-DD.
from	date	Start date using YYYY-MM-DD.
to	date	End date using YYYY-MM-DD.
status	string	Filter by match status.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /leagues/{league_id}/standings
Returns standings for a league. Use season_id when you need standings for a specific season.

Example request
curl "https://footballdata.io/api/v1/leagues/10/standings?season_id=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter standings by public season ID.
Standings may include
Position and team information.
Matches played, wins, draws, and losses.
Goals for, goals against, and goal difference.
Points and form where available.
GET /leagues/{league_id}/teams
Returns teams connected to a league. Use season_id if you only want teams from a specific season.

Example request
curl "https://footballdata.io/api/v1/leagues/10/teams?season_id=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter league teams by public season ID.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /leagues/{league_id}/seasons
Returns seasons available for a league.

Example request
curl "https://footballdata.io/api/v1/leagues/10/seasons" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example league response
{
  "success": true,
  "data": [
    {
      "league_id": 10,
      "name": "England Premier League",
      "country": "England",
      "competition_name": "Premier League",
      "image": "https://example.com/premier-league.png"
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
GET /leagues/{league_id}/stats
Paid plan required

Returns comprehensive season statistics for a league including goals, results distribution, BTTS %, corners, cards, xG, home advantage, and attendance.

Example request
curl "https://footballdata.io/api/v1/leagues/10/stats" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example response
{
  "success": true,
  "data": {
    "league": { "league_id": 10, "name": "Premier League", "country": "England" },
    "season": { "season_id": 100, "year": 2026 },
    "stats": {
      "matches": { "total": 380, "completed": 312, "game_week": 33, "total_game_weeks": 38, "progress": 82.1 },
      "goals": { "total": 865, "average_per_match": 2.77, "home_goals": 498, "away_goals": 367 },
      "results": { "home_win_pct": 44.2, "draw_pct": 24.7, "away_win_pct": 31.1 },
      "btts_pct": 52.6,
      "clean_sheet_pct": 26.3,
      "over_2_5_pct": 57.4,
      "under_2_5_pct": 42.6,
      "averages": {
        "corners": 10.42, "cards": 3.85, "fouls": 21.6,
        "attacks": 98.3, "dangerous_attacks": 52.1, "xg": 2.64
      },
      "home_advantage": { "attack_pct": 54.8, "defence_pct": 52.3 },
      "average_attendance": 39842
    }
  }
}
GET /leagues/{league_id}/btts
Paid plan required

Returns Both Teams To Score statistics for a league season, including BTTS percentage, clean sheet %, and over/under goal line percentages.

Example request
curl "https://footballdata.io/api/v1/leagues/10/btts" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example response
{
  "success": true,
  "data": {
    "league": { "league_id": 10, "name": "Premier League", "country": "England" },
    "season": { "season_id": 100, "year": 2026 },
    "btts": {
      "btts_pct": 52.6,
      "clean_sheet_pct": 26.3,
      "total_matches": 380,
      "matches_completed": 312,
      "goals": { "total": 865, "average_per_match": 2.77 },
      "over_under": {
        "over_1_5_pct": 78.5, "over_2_5_pct": 57.4, "over_3_5_pct": 32.1,
        "under_1_5_pct": 21.5, "under_2_5_pct": 42.6, "under_3_5_pct": 67.9
      }
    }
  }
}
GET /leagues/{league_id}/corners
Paid plan required

Returns season corner averages for a league.

Example request
curl "https://footballdata.io/api/v1/leagues/10/corners" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example response
{
  "success": true,
  "data": {
    "league": { "league_id": 10, "name": "Premier League", "country": "England" },
    "season": { "season_id": 100, "year": 2026 },
    "corners": {
      "average_per_match": 10.42,
      "total_matches": 380,
      "matches_completed": 312
    }
  }
}
Recommended usage
Use /leagues to find the public league_id.
Use /leagues/{league_id}/seasons before filtering league data by season.
Use /leagues/{league_id}/standings for league table pages.
Use /leagues/{league_id}/teams for league team directories.
Use /leagues/{league_id}/matches for league fixture and result pages.
Use /leagues/{league_id}/stats for league overview dashboards.
Use /leagues/{league_id}/btts for BTTS prediction pages.
Cache league metadata because it changes less often than match data.