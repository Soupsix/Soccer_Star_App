/**
 * useFavorites.ts
 * Centralized hook for managing a user's favorite players.
 * Uses the root Firestore listener and shared store for cross-screen sync.
 * Firestore path: users/{uid}.favoritePlayers  (string[])
 */
import { useCallback } from 'react';
import {
  doc,
  runTransaction,
} from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { patchUserLiveState, useUserLiveStore } from '@/stores/user-live.store';

export const FREE_FAVORITES_LIMIT = 3;

export type FavoriteToggleResult =
  | 'added'
  | 'removed'
  | 'limit-reached'
  | 'not-authenticated'
  | 'error';

function normalizeFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')));
}

function getExpirationTime(value: unknown): number {
  if (typeof value === 'string') {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  return 0;
}

export function useFavorites() {
  const favorites = useUserLiveStore((state) => state.favorites);
  const loading = useUserLiveStore((state) => state.loading);

  const isFavorite = useCallback(
    (playerId: string) => favorites.includes(playerId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (playerId: string): Promise<FavoriteToggleResult> => {
      const user = auth.currentUser;
      if (!user) return 'not-authenticated';

      const ref = doc(db, 'users', user.uid);
      const liveState = useUserLiveStore.getState();
      const localFavorites = normalizeFavorites(liveState.favorites);
      const isRemoving = localFavorites.includes(playerId);
      const hasActiveVip = getExpirationTime(liveState.vipExpiresAt) > Date.now();

      if (
        !liveState.loading
        && !isRemoving
        && !hasActiveVip
        && localFavorites.length >= FREE_FAVORITES_LIMIT
      ) {
        return 'limit-reached';
      }

      try {
        const result = await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(ref);
          const data = snap.exists() ? snap.data() : {};
          const currentFavorites = normalizeFavorites(data.favoritePlayers);
          const alreadyFavorite = currentFavorites.includes(playerId);

          if (alreadyFavorite) {
            const nextFavorites = currentFavorites.filter((id) => id !== playerId);
            transaction.set(ref, { favoritePlayers: nextFavorites }, { merge: true });
            return { status: 'removed' as const, favorites: nextFavorites };
          }

          const hasActiveVip = getExpirationTime(data.vipExpiresAt) > Date.now();
          if (!hasActiveVip && currentFavorites.length >= FREE_FAVORITES_LIMIT) {
            return { status: 'limit-reached' as const, favorites: currentFavorites };
          }

          const nextFavorites = [...currentFavorites, playerId];
          transaction.set(ref, { favoritePlayers: nextFavorites }, { merge: true });
          return { status: 'added' as const, favorites: nextFavorites };
        });

        patchUserLiveState(user.uid, { favorites: result.favorites });
        return result.status;
      } catch (e) {
        console.error('toggleFavorite error:', e);
        return 'error';
      }
    },
    [],
  );

  return { favorites, loading, isFavorite, toggleFavorite };
}
