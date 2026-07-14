import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { useUserLiveStore, type UserLiveSnapshot } from '@/stores/user-live.store';

function normalizeFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')));
}

function normalizeVipExpiresAt(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return null;
}

export function useUserLiveSync() {
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      const store = useUserLiveStore.getState();
      if (!user) {
        store.reset();
        return;
      }

      store.beginSync(user.uid);
      unsubscribeSnapshot = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : {};
          const snapshot: UserLiveSnapshot = {
            coins: typeof data.coins === 'number' ? data.coins : 0,
            favorites: normalizeFavorites(data.favoritePlayers),
            lastCheckIn: typeof data.lastCheckIn === 'string' ? data.lastCheckIn : null,
            vipExpiresAt: normalizeVipExpiresAt(data.vipExpiresAt),
          };
          useUserLiveStore.getState().replaceSnapshot(user.uid, snapshot);
        },
        () => useUserLiveStore.getState().markReady(user.uid),
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);
}
