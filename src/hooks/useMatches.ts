import { useState, useEffect, useCallback } from 'react';
import { FootballDataService } from '@/services/footballData.service';
import { ClientMatch } from '@/types/match.types';

export interface GroupedTournamentMatches {
  tournamentId: string;
  tournamentName: string;
  matches: ClientMatch[];
}

export function useMatches(selectedLeagueId: string | number, statusFilter: 'all' | 'Upcoming' | 'Live' | 'Finished') {
  const [allMatches, setAllMatches] = useState<ClientMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let rawMatches: any[] = [];
      if (selectedLeagueId && selectedLeagueId !== 'all') {
        rawMatches = await FootballDataService.getMatchesForLeague(selectedLeagueId);
      } else {
        // Fetch general upcoming/results + always include World Cup explicitly
        const [upcomingData, resultsData, wcData] = await Promise.all([
          FootballDataService.getUpcomingMatches(),
          FootballDataService.getResults(),
          FootballDataService.getMatchesForLeague(50) // Always include World Cup 2026 matches
        ]);
        const combined = [
          ...(upcomingData.matches || []),
          ...(resultsData.matches || []),
          ...(wcData || []),
        ];
        // Deduplicate by match_id
        const seen = new Set<string>();
        rawMatches = combined.filter(m => {
          const key = String(m.match_id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      let mapped = rawMatches.map(m => FootballDataService.mapRestMatchToClientMatch(m));

      // Only show matches from 2026 onwards — filter out stale data from old seasons (e.g. WC 2022)
      const currentYear = new Date().getFullYear();
      mapped = mapped.filter(m => {
        if (!m.date) return true; // keep if date unknown
        const matchYear = parseInt(m.date.split('-')[0], 10);
        return matchYear >= currentYear;
      });

      // Filter by status if specified
      if (statusFilter !== 'all') {
        mapped = mapped.filter(m => {
          if (statusFilter === 'Upcoming') {
            return m.status === 'Scheduled' || m.status === 'Postponed';
          } else if (statusFilter === 'Live') {
            return m.status === 'Live' || m.status === 'HT';
          } else if (statusFilter === 'Finished') {
            return m.status === 'FT';
          }
          return true;
        });
      }

      // Sort matches chronologically
      mapped.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.kickoff}`).getTime();
        const timeB = new Date(`${b.date}T${b.kickoff}`).getTime();
        return timeA - timeB;
      });

      setAllMatches(mapped);
    } catch (err: any) {
      console.error("Error in useMatches hook:", err);
      setError(err?.message || "Failed to load matches.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLeagueId, statusFilter]);

  // Group displayed matches dynamically by tournament
  const groupedMatches = (() => {
    const groups: Record<string, { tournamentName: string; matches: ClientMatch[] }> = {};
    allMatches.forEach(match => {
      const tourneyId = match.tournamentId || 'unknown_tourney';
      if (!groups[tourneyId]) {
        groups[tourneyId] = {
          tournamentName: match.tournamentName,
          matches: []
        };
      }
      groups[tourneyId].matches.push(match);
    });

    return Object.entries(groups).map(([id, group]) => ({
      tournamentId: id,
      tournamentName: group.tournamentName,
      matches: group.matches
    }));
  })();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    groupedMatches,
    allMatches,
    loading,
    refreshing,
    error,
    refresh: () => fetchMatches(true)
  };
}
