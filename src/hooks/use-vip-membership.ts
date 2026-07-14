import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  addDoc,
  collection,
  doc,
  runTransaction,
} from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { patchUserLiveState, useUserLiveStore } from '@/stores/user-live.store';

export const VIP_PRICE = 50000;
export const VIP_DURATION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

type PurchaseResult = {
  expiresAt: string;
  newTotal: number;
};

function getTime(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'string') {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  return 0;
}

export function formatVipDate(value: string | null): string {
  const time = getTime(value);
  if (!time) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(time));
}

export function useVipMembership() {
  const vipExpiresAt = useUserLiveStore((state) => state.vipExpiresAt);
  const loading = useUserLiveStore((state) => state.loading);
  const [purchasing, setPurchasing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const expiresAt = getTime(vipExpiresAt);
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return;

    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(remaining + 100, DAY_MS),
    );
    return () => clearTimeout(timer);
  }, [now, vipExpiresAt]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => subscription.remove();
  }, []);

  const expiresMs = getTime(vipExpiresAt);
  const isVip = expiresMs > now;
  const daysLeft = isVip ? Math.max(1, Math.ceil((expiresMs - now) / DAY_MS)) : 0;

  const purchaseVip = useCallback(async (): Promise<PurchaseResult> => {
    const user = auth.currentUser;
    if (!user) {
      throw Object.assign(new Error('Bạn chưa đăng nhập.'), {
        code: 'not-authenticated',
      });
    }

    setPurchasing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const result = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        const data = snap.exists() ? snap.data() : {};
        const currentCoins = typeof data.coins === 'number' ? data.coins : 0;

        if (currentCoins < VIP_PRICE) {
          throw Object.assign(new Error('Không đủ coin để mua gói VIP.'), {
            code: 'not-enough-coins',
            shortfall: VIP_PRICE - currentCoins,
          });
        }

        const now = Date.now();
        const currentExpiryMs = getTime(data.vipExpiresAt);
        const baseMs = currentExpiryMs > now ? currentExpiryMs : now;
        const expiresAt = new Date(baseMs + VIP_DURATION_DAYS * DAY_MS).toISOString();
        const newTotal = currentCoins - VIP_PRICE;

        transaction.set(
          userRef,
          {
            coins: newTotal,
            isVip: true,
            vipPlan: 'monthly',
            vipStartedAt: new Date(now).toISOString(),
            vipExpiresAt: expiresAt,
            vipLastPurchaseAt: new Date(now).toISOString(),
          },
          { merge: true },
        );

        return { expiresAt, newTotal };
      });

      patchUserLiveState(user.uid, {
        coins: result.newTotal,
        vipExpiresAt: result.expiresAt,
      });

      void addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: 'Nâng cấp VIP thành công',
          message: `Bạn đã mua gói VIP Football Star 1 tháng với giá ${VIP_PRICE.toLocaleString('vi-VN')} coin. Gói có hiệu lực đến ${formatVipDate(result.expiresAt)}.`,
          isRead: false,
          timestamp: new Date().toISOString(),
          type: 'spend',
          amount: VIP_PRICE,
        }).catch(() => {
          // Notification failure should not roll back a successful VIP purchase.
        });

      return result;
    } finally {
      setPurchasing(false);
    }
  }, []);

  return {
    isVip,
    vipExpiresAt,
    daysLeft,
    loading,
    purchasing,
    purchaseVip,
  };
}
