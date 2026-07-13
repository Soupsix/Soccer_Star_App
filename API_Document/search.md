Base URL
https://footballdata.io/api/v1
The search endpoint requires authentication.

Authorization: Bearer YOUR_API_KEY
Endpoint
Method	Endpoint	Description
GET	/search	Search leagues, teams, players, and matches.
GET /search
Returns matching football entities from multiple data types. Use this endpoint when you want one search box that can find teams, players, leagues, or matches.

Example request
curl "https://footballdata.io/api/v1/search?q=arsenal" \
  -H "Authorization: Bearer YOUR_API_KEY"
Query parameters
Parameter	Type	Required	Description
q	string	Yes	Search keyword. Example: arsenal, salah, or premier league.
type	string	No	Limit results to one type. Supported values: leagues, teams, players, matches.
limit	integer	No	Number of results per type. Maximum is usually 25 for search.
Search teams only
curl "https://footballdata.io/api/v1/search?q=arsenal&type=teams" \
  -H "Authorization: Bearer YOUR_API_KEY"
Search players only
curl "https://footballdata.io/api/v1/search?q=salah&type=players" \
  -H "Authorization: Bearer YOUR_API_KEY"
Search leagues only
curl "https://footballdata.io/api/v1/search?q=premier&type=leagues" \
  -H "Authorization: Bearer YOUR_API_KEY"
Example response
{
  "success": true,
  "data": {
    "query": "arsenal",
    "results": {
      "teams": [
        {
          "team_id": 1119,
          "team_name": "Arsenal",
          "country": "England",
          "team_logo": "https://example.com/arsenal.png"
        }
      ],
      "players": [],
      "leagues": [],
      "matches": [
        {
          "match_id": 12345,
          "match_date": "2026-05-03",
          "status": "scheduled",
          "home_team": {
            "team_id": 1119,
            "team_name": "Arsenal"
          },
          "away_team": {
            "team_id": 1121,
            "team_name": "Chelsea"
          },
          "league": {
            "league_id": 10,
            "name": "England Premier League"
          }
        }
      ]
    }
  },
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season."
  }
}
No results response
{
  "success": true,
  "data": {
    "query": "unknown search",
    "results": {
      "teams": [],
      "players": [],
      "leagues": [],
      "matches": []
    }
  },
  "meta": {
    "plan": "free",
    "requests_used": 26,
    "requests_limit": 1000,
    "coverage_note": "Coverage varies by league and season."
  }
}
Recommended usage
Use /search for global search bars.
Use type=teams when building a team lookup field.
Use type=players when building a player lookup field.
Use type=leagues when building coverage or league selector pages.
Use direct endpoints after search returns a public ID.