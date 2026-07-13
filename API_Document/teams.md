Base URL
https://footballdata.io/api/v1
All team endpoints require authentication.

Authorization: Bearer YOUR_API_KEY
Available team endpoints
Method	Endpoint	Description
GET	/teams	Search and list teams.
GET	/teams/{team_id}	Get team details.
GET	/teams/{team_id}/players	List players for a team.
GET	/teams/{team_id}/matches	List matches for a team.
GET	/teams/{team_id}/h2h/{opponent_id}	Get head-to-head matches between two teams.
GET	/teams/{team_id}/stats	Get mapped team statistics.
GET /teams
Returns a paginated list of teams. Use the search query to find a team by name, country, or related team metadata.

Example request
curl "https://footballdata.io/api/v1/teams?q=arsenal&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
q	string	Search by team name, clean name, English name, or short name.
country	string	Filter teams by country.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /teams/{team_id}
Returns a single team profile using the public team_id.

Example request
curl "https://footballdata.io/api/v1/teams/1119" \
  -H "Authorization: Bearer YOUR_API_KEY"
Response includes
Public team_id.
Team name, clean name, English name, short name, and full name where available.
Country and continent.
Team logo and flag where available.
Stadium name, stadium address, and founded year where available.
form — points per game (home, away, overall) from latest match data.
League seasons with standings.
Recent matches (last 10) and upcoming matches (next 10).
Form data
"form": {
  "ppg_home": 2.47,
  "ppg_away": 1.83,
  "ppg_overall": 2.14
}
Returns null if no PPG data is available for the team.

GET /teams/{team_id}/players
Returns players connected to a team. You can filter by season when needed.

Example request
curl "https://footballdata.io/api/v1/teams/1119/players?season_id=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter roster by public season ID.
league_id	integer	Filter roster by public league ID.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /teams/{team_id}/matches
Returns matches where the selected team appears as either home or away team.

Example request
curl "https://footballdata.io/api/v1/teams/1119/matches?limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter matches by season.
league_id	integer	Filter matches by league.
status	string	Filter by match status.
from	date	Start date in YYYY-MM-DD format.
to	date	End date in YYYY-MM-DD format.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /teams/{team_id}/h2h/{opponent_id}
Returns head-to-head matches between two public team IDs.

Example request
curl "https://footballdata.io/api/v1/teams/1119/h2h/1121" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /teams/{team_id}/stats
Returns mapped team statistics from the team statistics feed. The endpoint uses public field names instead of source database field names.

Example request
curl "https://footballdata.io/api/v1/teams/1119/stats?season_id=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter team stats by public season ID.
league_id	integer	Filter team stats by public league ID.
Stats may include
Overall, home, and away records.
Goals for, goals against, and goal difference.
Points per game and win/draw/loss percentages.
Clean sheets and failed-to-score metrics.
Both teams to score metrics.
Goal line, corners, cards, shots, possession, fouls, and xG where available.
Example team response
{
  "success": true,
  "data": {
    "team_id": 1119,
    "team_name": "Arsenal",
    "team_name_clean": "Arsenal",
    "team_name_english": "Arsenal",
    "short_name": "ARS",
    "country": "England",
    "continent": "Europe",
    "team_logo": "https://example.com/arsenal.png",
    "stadium_name": "Emirates Stadium",
    "founded": "1886"
  },
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season."
  }
}
Recommended usage
Use /teams to find the public team_id.
Use /teams/{team_id} for team profile pages.
Use /teams/{team_id}/players for roster pages.
Use /teams/{team_id}/matches for team fixture and result pages.
Use /teams/{team_id}/stats for team analytics pages.
Cache team profile data because it changes less often than live or match data.