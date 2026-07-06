/**
 * useFavorites.ts
 * Centralized hook for managing a user's favorite players.
 * Uses Firestore onSnapshot for real-time cross-screen sync.
 * Firestore path: users/{uid}.favoritePlayers  (string[])
 */
import { useCallback, useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid);

    // onSnapshot — fires immediately with current data AND on every future change.
    // This means: toggle on Players screen → Profile screen updates automatically.
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setFavorites(snap.exists() ? (snap.data()?.favoritePlayers as string[]) ?? [] : []);
        setLoading(false);
      },
      (_err) => {
        setLoading(false);
      },
    );

    return () => unsubscribe();   // cleanup when component unmounts
  }, []);

  const isFavorite = useCallback(
    (playerId: string) => favorites.includes(playerId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (playerId: string) => {
      const user = auth.currentUser;
      if (!user) return;

      const ref        = doc(db, 'users', user.uid);
      const alreadyFav = favorites.includes(playerId);

      // Optimistic local update (UI feels instant)
      setFavorites((prev) =>
        alreadyFav ? prev.filter((id) => id !== playerId) : [...prev, playerId],
      );

      try {
        // Ensure the document exists before calling updateDoc
        await setDoc(ref, {}, { merge: true });
        if (alreadyFav) {
          await updateDoc(ref, { favoritePlayers: arrayRemove(playerId) });
        } else {
          await updateDoc(ref, { favoritePlayers: arrayUnion(playerId) });
        }
        // No need to setFavorites after success — onSnapshot will push the
        // canonical value from Firestore automatically.
      } catch (e) {
        // Roll back the optimistic update on error
        setFavorites((prev) =>
          alreadyFav ? [...prev, playerId] : prev.filter((id) => id !== playerId),
        );
        console.error('toggleFavorite error:', e);
      }
    },
    [favorites],
  );

  return { favorites, loading, isFavorite, toggleFavorite };
}
