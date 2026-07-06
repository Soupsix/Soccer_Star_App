/**
 * useAuthUser.ts
 * Reactive hook for Firebase Auth current user.
 *
 * Problem: auth.currentUser is a mutable singleton — after updateProfile()
 * its properties update but React won't re-render because the reference is
 * the same.
 *
 * Solution: keep a "tick" counter in state. Incrementing it forces React to
 * re-render and read the freshest auth.currentUser values.
 *
 * Usage:
 *   const { user, refreshUser } = useAuthUser();
 *   // After updateProfile():
 *   await refreshUser();   // re-renders all consumers
 */
import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';

export function useAuthUser() {
  // tick is only used to trigger re-renders; actual data comes from auth.currentUser
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // onAuthStateChanged fires on sign-in / sign-out
    const unsubscribe = onAuthStateChanged(auth, () => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Call after updateProfile / updatePassword to force all useAuthUser
   * consumers to re-render with the latest user data.
   */
  const refreshUser = useCallback(async () => {
    try {
      await auth.currentUser?.reload();
    } catch {
      // ignore network errors during reload
    }
    setTick((t) => t + 1);
  }, []);

  // auth.currentUser is always up-to-date after reload(); tick just re-reads it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const user = auth.currentUser;

  return { user, refreshUser, tick };
}
