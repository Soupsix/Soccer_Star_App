Base URL
https://footballdata.io/api/v1
All player endpoints require authentication.

Authorization: Bearer YOUR_API_KEY
Available player endpoints
Method	Endpoint	Description
GET	/players	Search and list players.
GET	/players/{player_id}	Get player details.
GET	/players/{player_id}/stats	Get player season statistics.
GET /players
Returns a paginated list of players. Use q to search by player name.

Example request
curl "https://footballdata.io/api/v1/players?q=salah&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
q	string	Search by player name.
team_id	integer	Filter players by public team ID where available.
league_id	integer	Filter players by public league ID where available.
season_id	integer	Filter players by public season ID where available.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /players/{player_id}
Returns a single player profile using the public player_id.

Example request
curl "https://footballdata.io/api/v1/players/5001" \
  -H "Authorization: Bearer YOUR_API_KEY"
Response may include
Public player_id.
Player name and known display fields.
Nationality, age, position, height, weight, and preferred foot where available.
Current or related team data where available.
Profile image and profile URL where available.
GET /players/{player_id}/stats
Returns season-level statistics for a player. Use optional filters when you only need one league or season.

Example request
curl "https://footballdata.io/api/v1/players/5001/stats?season_id=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
season_id	integer	Filter stats by public season ID.
league_id	integer	Filter stats by public league ID.
team_id	integer	Filter stats by public team ID where available.
Stats may include
Appearances, starts, and minutes played.
Goals, assists, penalties scored, and penalties missed.
Cards, clean sheets, goals conceded, and position-specific metrics.
Per-90 metrics such as goals per 90, assists per 90, and cards per 90.
Season, league, and team context where available.
Example player response
{
  "success": true,
  "data": {
    "player_id": 5001,
    "player_name": "Mohamed Salah",
    "nationality": "Egypt",
    "position": "Forward",
    "age": 33,
    "team": {
      "team_id": 1119,
      "team_name": "Liverpool"
    }
  },
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season."
  }
}
Example player stats response
{
  "success": true,
  "data": {
    "player_id": 5001,
    "player_name": "Mohamed Salah",
    "stats": [
      {
        "season": {
          "season_id": 100,
          "year": 2026
        },
        "league": {
          "league_id": 10,
          "name": "England Premier League",
          "country": "England"
        },
        "team": {
          "team_id": 1119,
          "team_name": "Liverpool"
        },
        "appearances": {
          "total": 30,
          "home": 15,
          "away": 15
        },
        "minutes_played": {
          "total": 2500,
          "home": 1250,
          "away": 1250
        },
        "goals": {
          "total": 20,
          "home": 11,
          "away": 9
        },
        "assists": {
          "total": 8,
          "home": 5,
          "away": 3
        }
      }
    ]
  },
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season."
  }
}
Recommended usage
Use /players to find the public player_id.
Use /players/{player_id} for player profile pages.
Use /players/{player_id}/stats for player analytics pages.
Use season_id, league_id, or team_id filters to reduce response size.
Cache player profile data longer than live or fixture data.