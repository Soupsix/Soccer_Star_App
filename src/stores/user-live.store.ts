import { create } from 'zustand';

export type UserLiveSnapshot = {
  coins: number;
  favorites: string[];
  lastCheckIn: string | null;
  vipExpiresAt: string | null;
};

type UserLiveState = UserLiveSnapshot & {
  uid: string | null;
  loading: boolean;
  beginSync: (uid: string) => void;
  replaceSnapshot: (uid: string, snapshot: UserLiveSnapshot) => void;
  patchSnapshot: (uid: string, patch: Partial<UserLiveSnapshot>) => void;
  markReady: (uid: string) => void;
  reset: () => void;
};

const EMPTY_SNAPSHOT: UserLiveSnapshot = {
  coins: 0,
  favorites: [],
  lastCheckIn: null,
  vipExpiresAt: null,
};

export const useUserLiveStore = create<UserLiveState>((set) => ({
  ...EMPTY_SNAPSHOT,
  uid: null,
  loading: true,
  beginSync: (uid) => {
    set((state) => (
      state.uid === uid
        ? state
        : { ...state, ...EMPTY_SNAPSHOT, uid, loading: true }
    ));
  },
  replaceSnapshot: (uid, snapshot) => {
    set({ ...snapshot, uid, loading: false });
  },
  patchSnapshot: (uid, patch) => {
    set((state) => {
      if (state.uid !== null && state.uid !== uid) return state;
      return { ...state, ...patch, uid, loading: false };
    });
  },
  markReady: (uid) => {
    set((state) => (state.uid === uid ? { loading: false } : state));
  },
  reset: () => {
    set({ ...EMPTY_SNAPSHOT, uid: null, loading: false });
  },
}));

export function patchUserLiveState(uid: string, patch: Partial<UserLiveSnapshot>) {
  useUserLiveStore.getState().patchSnapshot(uid, patch);
}
