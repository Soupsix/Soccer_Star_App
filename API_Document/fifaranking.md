Base URL
https://footballdata.io/api/v1
All FIFA rankings endpoints require authentication.

Authorization: Bearer YOUR_API_KEY
Available FIFA rankings endpoints
Method	Endpoint	Description
GET	/fifa-rankings	List FIFA rankings by type, date, period, country, or confederation.
GET	/fifa-rankings/current	Returns the current FIFA rankings.
GET	/fifa-rankings/periods	List available FIFA ranking periods.
GET	/fifa-rankings/{country_slug}/history	Get FIFA ranking history for a country.
GET /fifa-rankings
Returns FIFA rankings for a specific ranking type, period, ranking date, country search, or confederation.

Example request
curl "https://footballdata.io/api/v1/fifa-rankings?ranking_type=men&limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
ranking_type	string	Use men or women. Default is men.
date	date	Filter by ranking date using YYYY-MM-DD.
period_id	string	Filter by ranking period ID.
confederation	string	Filter by confederation code or name, such as UEFA, CONMEBOL, or AFC.
search	string	Search by country name, slug, ISO2, or ISO3.
page	integer	Pagination page number.
limit	integer	Number of results per page. Maximum is usually 100.
GET /fifa-rankings/current
Returns the current FIFA ranking period. If no period_id or date is provided, the API uses the current ranking period automatically.

Example request
curl "https://footballdata.io/api/v1/fifa-rankings/current?ranking_type=men&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
Women’s ranking example
curl "https://footballdata.io/api/v1/fifa-rankings/current?ranking_type=women&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
GET /fifa-rankings/periods
Returns ranking periods available in the API. Use this endpoint when you want to browse historical ranking releases.

Example request
curl "https://footballdata.io/api/v1/fifa-rankings/periods?ranking_type=men" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
ranking_type	string	Use men or women. Default is men.
page	integer	Pagination page number.
limit	integer	Number of periods per page. Maximum is usually 100.
GET /fifa-rankings/{country_slug}/history
Returns ranking history for one country. The country_slug is returned by the rankings endpoint.

Example request
curl "https://footballdata.io/api/v1/fifa-rankings/france/history?ranking_type=men" \
  -H "Authorization: Bearer YOUR_API_KEY"
Optional query parameters
Parameter	Type	Description
ranking_type	string	Use men or women. Default is men.
page	integer	Pagination page number.
limit	integer	Number of ranking history rows per page. Maximum is usually 100.
Example ranking response
{
  "success": true,
  "data": [
    {
      "country": {
        "name": "Argentina",
        "slug": "argentina",
        "iso2": "AR",
        "iso3": "ARG",
        "flag_emoji": "🇦🇷"
      },
      "ranking": {
        "type": "men",
        "world_rank": 1,
        "previous_rank": 1,
        "rank_movement": 0,
        "regional_rank": 1,
        "rated_matches": 45
      },
      "points": {
        "total": 1885.36,
        "previous": 1885.36,
        "change": 0
      },
      "confederation": {
        "code": "CONMEBOL",
        "name": "CONMEBOL"
      },
      "period": {
        "period_id": "2026-04-03",
        "source_period_id": "2026-04-03",
        "ranking_date": "2026-04-03"
      },
      "last_updated": "2026-05-06 10:00:00"
    }
  ],
  "meta": {
    "plan": "free",
    "requests_used": 25,
    "requests_limit": 1000,
    "requests_remaining": 975,
    "league_limit": 5,
    "coverage_note": "Coverage varies by league and season.",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 210,
      "total_pages": 21
    },
    "filters": {
      "ranking_type": "men",
      "date": null,
      "period_id": "2026-04-03",
      "confederation": null,
      "search": null
    },
    "count": 10
  }
}
Example period response
{
  "success": true,
  "data": [
    {
      "period_id": "2026-04-03",
      "ranking_date": "2026-04-03",
      "display_name": "April 2026",
      "ranking_type": "men",
      "source": "fifa",
      "source_period_id": "2026-04-03",
      "sync_status": "current",
      "is_current": true,
      "last_updated": "2026-05-06 10:00:00"
    }
  ],
  "meta": {
    "plan": "free",
    "requests_used": 26,
    "requests_limit": 1000,
    "requests_remaining": 974,
    "league_limit": 5,
    "coverage_note": "Coverage varies by league and season."
  }
}
Example country history response
{
  "success": true,
  "data": {
    "country": {
      "name": "France",
      "slug": "france",
      "iso2": "FR",
      "iso3": "FRA",
      "flag_emoji": "🇫🇷",
      "confederation": {
        "code": "UEFA",
        "name": "UEFA"
      }
    },
    "history": [
      {
        "ranking_date": "2026-04-03",
        "period_id": "2026-04-03",
        "source_period_id": "2026-04-03",
        "world_rank": 2,
        "previous_rank": 2,
        "rank_movement": 0,
        "regional_rank": 1,
        "rated_matches": 44,
        "points": {
          "total": 1840.59,
          "previous": 1840.59,
          "change": 0
        }
      }
    ]
  },
  "meta": {
    "plan": "free",
    "requests_used": 27,
    "requests_limit": 1000,
    "requests_remaining": 973,
    "league_limit": 5,
    "coverage_note": "Coverage varies by league and season."
  }
}
Recommended usage
Use /fifa-rankings/current for current ranking tables.
Use ranking_type=women for women’s rankings.
Use /fifa-rankings/periods to build historical ranking selectors.
Use /fifa-rankings/{country_slug}/history for country ranking history pages.
Use confederation filters for regional ranking tables.
Cache FIFA rankings because rankings do not update as frequently as fixtures or live data.