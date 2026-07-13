Base URL
https://footballdata.io/api/v1
All country endpoints require authentication.

Authorization: Bearer YOUR_API_KEY
Available country endpoints
Method	Endpoint	Description
GET	/countries	List countries available in API coverage.
GET	/countries/{country}/leagues	List leagues available for a specific country.
GET /countries
Returns countries available in the API. Use this endpoint to build country filters, coverage pages, or country-based league directories.

Example request
curl "https://footballdata.io/api/v1/countries" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
q	string	Search by country name.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /countries/{country}/leagues
Returns leagues for a country. The {country} value should match the country name returned by /countries.

Example request
curl "https://footballdata.io/api/v1/countries/England/leagues" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
Example countries response
{
  "success": true,
  "data": [
    {
      "country": "England",
      "league_count": 12,
      "team_count": 240,
      "match_count": 12500
    },
    {
      "country": "Spain",
      "league_count": 8,
      "team_count": 180,
      "match_count": 9400
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
      "total": 2,
      "total_pages": 1
    }
  }
}
Example country leagues response
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
    "requests_used": 26,
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
Use /countries to build coverage or country filter pages.
Use /countries/{country}/leagues to build league directories by country.
Use country names exactly as returned by the API.
Cache country data because it changes less often than match data.
Remember that coverage varies by league and season.