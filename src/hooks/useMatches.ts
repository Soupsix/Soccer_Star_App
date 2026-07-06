import { useState, useEffect, useCallback } from 'react';
import { MatchRepository } from '@/repositories/match.repository';
import { ClientMatch } from '@/types/match.types';

export interface GroupedTournamentMatches {
  tournamentId: string;
  tournamentName: string;
  matches: ClientMatch[];
}

export function useMatches() {
  const [allMatches, setAllMatches] = useState<ClientMatch[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(15);
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
      const flat = await MatchRepository.getAllMatches();
      
      // Sort matches chronologically
      flat.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.kickoff}`).getTime();
        const timeB = new Date(`${b.date}T${b.kickoff}`).getTime();
        return timeA - timeB;
      });

      setAllMatches(flat);
      setDisplayedCount(15); // Reset displayed count on new load
    } catch (err: any) {
      console.error("Error in useMatches hook:", err);
      setError(err?.message || "Failed to load matches.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (displayedCount < allMatches.length) {
      setDisplayedCount(prev => prev + 15);
    }
  }, [displayedCount, allMatches.length]);

  // Only take the chunk of matches currently loaded for display
  const displayedMatches = allMatches.slice(0, displayedCount);

  // Group displayed matches dynamically by tournament
  const groupedMatches = (() => {
    const groups: Record<string, { tournamentName: string; matches: ClientMatch[] }> = {};
    displayedMatches.forEach(match => {
      // Filter out completed matches (status FT) from fixtures tab
      if (match.status === 'FT') return;

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
    hasMore: displayedCount < allMatches.length,
    loadMore,
    refresh: () => fetchMatches(true)
  };
}
