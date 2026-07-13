import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

export interface UserSubscription {
  userId: string;
  isPremium: boolean;
  followedPlayers: string[]; // List of player IDs
}

export const SubscriptionService = {
  /**
   * Lấy thông tin đăng ký của người dùng
   */
  async getUserSubscription(uid: string): Promise<UserSubscription> {
    const docRef = doc(db, 'subscriptions', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserSubscription;
    }
    // Default subscription if not exists
    const defaultSub: UserSubscription = {
      userId: uid, // Changed from uid to userId to pass Firebase rules
      isPremium: false,
      followedPlayers: [],
    };
    await setDoc(docRef, defaultSub);
    return defaultSub;
  },

  /**
   * Theo dõi một cầu thủ
   */
  async followPlayer(uid: string, playerId: string): Promise<void> {
    const sub = await this.getUserSubscription(uid);
    
    // Nếu chưa Premium và đã theo dõi >= 3 cầu thủ thì không cho phép
    if (!sub.isPremium && sub.followedPlayers.length >= 3) {
      throw new Error('Bạn chỉ được theo dõi tối đa 3 cầu thủ với tài khoản Miễn phí. Hãy nâng cấp Premium để theo dõi không giới hạn!');
    }

    const docRef = doc(db, 'subscriptions', uid);
    await updateDoc(docRef, {
      followedPlayers: arrayUnion(playerId)
    });
  },

  /**
   * Bỏ theo dõi một cầu thủ
   */
  async unfollowPlayer(uid: string, playerId: string): Promise<void> {
    const docRef = doc(db, 'subscriptions', uid);
    await updateDoc(docRef, {
      followedPlayers: arrayRemove(playerId)
    });
  },

  /**
   * Nâng cấp lên Premium (Demo)
   */
  async upgradeToPremium(uid: string): Promise<void> {
    const docRef = doc(db, 'subscriptions', uid);
    await updateDoc(docRef, {
      isPremium: true
    });
  },

  /**
   * Hủy Premium (Demo)
   */
  async cancelPremium(uid: string): Promise<void> {
    const docRef = doc(db, 'subscriptions', uid);
    await updateDoc(docRef, {
      isPremium: false
    });
  }
};
