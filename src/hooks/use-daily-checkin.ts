/**
 * use-daily-checkin.ts
 *
 * Hook quản lý tính năng điểm danh hàng ngày nhận coin.
 *
 * Firestore schema (users/{uid}):
 *   coins        : number  – tổng số coin hiện có
 *   lastCheckIn  : string  – ISO date string "YYYY-MM-DD" của lần điểm danh cuối
 *
 * Logic:
 *  - So sánh lastCheckIn với ngày hôm nay (theo múi giờ local).
 *  - Nếu khác ngày → cho phép điểm danh.
 *  - Khi điểm danh: +DAILY_REWARD coin, ghi lại lastCheckIn = today.
 */

import { useCallback, useState } from 'react';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { patchUserLiveState, useUserLiveStore } from '@/stores/user-live.store';

// Số coin thưởng mỗi ngày
const DAILY_REWARD = 3000;


/** Trả về chuỗi "YYYY-MM-DD" theo giờ địa phương */
function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DailyCheckinState {
  coins: number;
  lastCheckIn: string | null;
  hasCheckedInToday: boolean;
  loading: boolean;
  checkingIn: boolean;
  performCheckIn: () => Promise<{ success: boolean; earned: number; newTotal: number; message: string }>;

  dailyReward: number;
}

export function useDailyCheckin(): DailyCheckinState {
  const coins = useUserLiveStore((state) => state.coins);
  const lastCheckIn = useUserLiveStore((state) => state.lastCheckIn);
  const loading = useUserLiveStore((state) => state.loading);
  const [checkingIn, setCheckingIn] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hasCheckedInToday = lastCheckIn === getTodayString();

  // ── Action ──────────────────────────────────────────────────────────────────
  const performCheckIn = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, earned: 0, newTotal: 0, message: 'Bạn chưa đăng nhập.' };
    }

    const today = getTodayString();

    // Double-check với Firestore để tránh race condition
    const ref = doc(db, 'users', user.uid);
    let serverLastCheckIn: string | null = null;
    let serverCoins = 0;

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        serverLastCheckIn = data.lastCheckIn ?? null;
        serverCoins = typeof data.coins === 'number' ? data.coins : 0;
      }
    } catch {
      return { success: false, earned: 0, newTotal: 0, message: 'Không thể kết nối máy chủ.' };
    }

    if (serverLastCheckIn === today) {
      patchUserLiveState(user.uid, { coins: serverCoins, lastCheckIn: serverLastCheckIn });
      return {
        success: false,
        earned: 0,
        newTotal: serverCoins,
        message: 'Bạn đã điểm danh hôm nay rồi!\nQuay lại vào ngày mai nhé 😊',
      };
    }

    setCheckingIn(true);
    try {
      const newCoins = serverCoins + DAILY_REWARD;

      // Ghi cập nhật coin + lastCheckIn vào Firestore
      await setDoc(ref, { coins: newCoins, lastCheckIn: today }, { merge: true });
      patchUserLiveState(user.uid, { coins: newCoins, lastCheckIn: today });

      // Tạo thông báo điểm danh thành công
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: '🎉 Điểm danh thành công!',
          message: `Bạn đã nhận được ${DAILY_REWARD.toLocaleString()} coin hôm nay. Số dư hiện tại: ${newCoins.toLocaleString()} coin. Nhớ quay lại điểm danh ngày mai nhé!`,
          isRead: false,
          timestamp: new Date().toISOString(),
          type: 'checkin',
          amount: DAILY_REWARD,
        });
      } catch {
        // Không fail cả flow nếu chỉ notification lỗi
      }

      return {
        success: true,
        earned: DAILY_REWARD,
        newTotal: newCoins,
        message: `Bạn nhận được ${DAILY_REWARD.toLocaleString()} coin!\nSố dư: ${newCoins.toLocaleString()} coin`,
      };
    } catch {
      return { success: false, earned: 0, newTotal: serverCoins, message: 'Điểm danh thất bại. Vui lòng thử lại.' };
    } finally {
      setCheckingIn(false);
    }
  }, []);

  return {
    coins,
    lastCheckIn,
    hasCheckedInToday,
    loading,
    checkingIn,
    performCheckIn,
    dailyReward: DAILY_REWARD,
  };
}
