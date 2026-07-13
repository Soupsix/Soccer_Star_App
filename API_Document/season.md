Base URL
https://footballdata.io/api/v1
All season endpoints require authentication.

Authorization: Bearer YOUR_API_KEY
Available season endpoints
Method	Endpoint	Description
GET	/seasons	List available seasons.
GET	/seasons/{season_id}/matches	List matches for a season.
GET	/seasons/{season_id}/standings	Get season standings.
GET	/seasons/{season_id}/teams	List teams in a season.
GET /seasons
Returns a paginated list of available seasons. Use this endpoint to find the public season_id for filtering league, team, match, and standings data.

Example request
curl "https://footballdata.io/api/v1/seasons?league_id=10&limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
league_id	integer	Filter seasons by public league ID.
year	integer	Filter seasons by year.
current	boolean	Use 1 to return current seasons where available.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /seasons/{season_id}/matches
Returns matches connected to a public season_id.

Example request
curl "https://footballdata.io/api/v1/seasons/100/matches?limit=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
league_id	integer	Filter matches by league.
team_id	integer	Filter matches where the team appears as home or away.
date	date	Filter by exact date using YYYY-MM-DD.
from	date	Start date using YYYY-MM-DD.
to	date	End date using YYYY-MM-DD.
status	string	Filter by match status.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /seasons/{season_id}/standings
Returns standings for a season using the public season_id.

Example request
curl "https://footballdata.io/api/v1/seasons/100/standings" \
  -H "Authorization: Bearer YOUR_API_KEY"
Standings may include
Position and team information.
Matches played, wins, draws, and losses.
Goals for, goals against, and goal difference.
Points and form where available.
GET /seasons/{season_id}/teams
Returns teams connected to a public season_id.

Example request
curl "https://footballdata.io/api/v1/seasons/100/teams?limit=50" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
league_id	integer	Filter teams by league where available.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
Example season response
{
  "success": true,
  "data": [
    {
      "season_id": 100,
      "year": 2026,
      "is_current": true,
      "league": {
        "league_id": 10,
        "name": "England Premier League",
        "country": "England",
        "competition_name": "Premier League"
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
Recommended usage
Use /seasons to find the public season_id.
Use /leagues/{league_id}/seasons when you already know the league.
Use /seasons/{season_id}/matches for season fixture and result pages.
Use /seasons/{season_id}/standings for season tables.
Use /seasons/{season_id}/teams for season team directories.
Cache season metadata because it changes less often than match data.