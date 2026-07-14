import { useCallback, useState } from 'react';
import { addDoc, collection, doc, runTransaction } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { patchUserLiveState } from '@/stores/user-live.store';

export const MIN_TOP_UP_COINS = 5000;

type TopUpResult = {
  amount: number;
  newTotal: number;
};

export function useCoinTopUp() {
  const [submitting, setSubmitting] = useState(false);

  const topUpCoins = useCallback(async (amount: number): Promise<TopUpResult> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Bạn chưa đăng nhập.');
    }
    if (!Number.isSafeInteger(amount) || amount < MIN_TOP_UP_COINS) {
      throw new Error(`Số coin nạp tối thiểu là ${MIN_TOP_UP_COINS.toLocaleString('vi-VN')}.`);
    }

    setSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const result = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(userRef);
        const data = snapshot.exists() ? snapshot.data() : {};
        const currentCoins = typeof data.coins === 'number' ? data.coins : 0;
        const newTotal = currentCoins + amount;

        transaction.set(userRef, { coins: newTotal }, { merge: true });
        return { amount, newTotal };
      });

      patchUserLiveState(user.uid, { coins: result.newTotal });

      try {
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: 'Nạp coin thành công',
          message: `Bạn đã nạp ${amount.toLocaleString('vi-VN')} coin. Số dư hiện tại: ${result.newTotal.toLocaleString('vi-VN')} coin.`,
          isRead: false,
          timestamp: new Date().toISOString(),
          type: 'purchase',
          amount,
        });
      } catch {
        // The balance transaction remains valid if writing its notification fails.
      }

      return result;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, topUpCoins };
}
