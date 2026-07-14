import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  limit,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import playersData from '../assets/data/players.json';

export interface Friend {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromEmail: string;
  toUid: string;
  toName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface LocketPost {
  id: string;
  playerId: string;
  playerName: string;
  playerImage: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  note: string;
  timestamp: string;
  reactions: Record<string, string>; // Maps uid to emoji (e.g. '❤️')
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  timestamp: string;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: 'heart' | 'fire' | 'trophy' | 'applause';
  timestamp: string;
}



export const CommunityService = {
  // --- USER SEARCH ---
  async searchUserByEmail(email: string): Promise<Friend | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()), limit(1));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      const docData = querySnap.docs[0].data();
      return {
        uid: docData.uid || querySnap.docs[0].id,
        name: docData.name || docData.displayName || 'Người dùng',
        email: docData.email,
        photoURL: docData.photoURL || docData.avatarUrl || null,
      };
    } catch (err) {
      console.error('Error searching user:', err);
      return null;
    }
  },

  // --- FRIEND REQUESTS ---
  async sendFriendRequest(fromUid: string, toUid: string): Promise<void> {
    const fromDocSnap = await getDoc(doc(db, 'users', fromUid));
    const toDocSnap = await getDoc(doc(db, 'users', toUid));

    if (!fromDocSnap.exists() || !toDocSnap.exists()) {
      throw new Error('Người dùng không tồn tại.');
    }

    const fromData = fromDocSnap.data();
    const toData = toDocSnap.data();

    // Check if request already exists
    const q1 = query(
      collection(db, 'friend_requests'),
      where('fromUid', '==', fromUid),
      where('toUid', '==', toUid),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q1);
    if (!snap.empty) throw new Error('Yêu cầu kết bạn đã được gửi trước đó.');

    // Add friend request
    await addDoc(collection(db, 'friend_requests'), {
      fromUid,
      fromName: fromData.name || fromData.displayName || 'Thành viên',
      fromEmail: fromData.email,
      toUid,
      toName: toData.name || toData.displayName || 'Thành viên',
      toEmail: toData.email,
      status: 'pending',
      timestamp: new Date().toISOString(),
    });

    // Write a notification to "toUid"
    await addDoc(collection(db, 'notifications'), {
      userId: toUid,
      title: 'Yêu cầu kết bạn mới 👥',
      message: `${fromData.name || fromData.displayName || 'Một thành viên'} đã gửi cho bạn lời mời kết bạn.`,
      isRead: false,
      timestamp: new Date().toISOString(),
    });
  },

  async getPendingRequests(uid: string): Promise<FriendRequest[]> {
    try {
      const q = query(
        collection(db, 'friend_requests'),
        where('toUid', '==', uid),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FriendRequest[];
    } catch (err) {
      console.error('Error getting pending requests:', err);
      return [];
    }
  },

  async acceptFriendRequest(request: FriendRequest): Promise<void> {
    // 1. Update friend request status to accepted
    await updateDoc(doc(db, 'friend_requests', request.id), {
      status: 'accepted',
    });

    // 2. Add to friends collection
    await addDoc(collection(db, 'friends'), {
      userIds: [request.fromUid, request.toUid],
      timestamp: new Date().toISOString(),
    });

    // 3. Write notifications to both
    await addDoc(collection(db, 'notifications'), {
      userId: request.fromUid,
      title: 'Đã chấp nhận kết bạn 🎉',
      message: `${request.toName} đã chấp nhận lời mời kết bạn của bạn.`,
      isRead: false,
      timestamp: new Date().toISOString(),
    });
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'declined',
    });
  },

  // --- FRIENDS LIST ---
  async getFriends(uid: string): Promise<Friend[]> {
    try {
      const q = query(collection(db, 'friends'), where('userIds', 'array-contains', uid));
      const snap = await getDocs(q);
      const friendIds = snap.docs.map((d) => {
        const ids = d.data().userIds as string[];
        return ids.find((id) => id !== uid);
      }).filter(Boolean) as string[];

      if (friendIds.length === 0) return [];

      // Batch load user profiles
      const friends: Friend[] = [];
      for (const fId of friendIds) {
        const userSnap = await getDoc(doc(db, 'users', fId));
        if (userSnap.exists()) {
          const udata = userSnap.data();
          friends.push({
            uid: fId,
            name: udata.name || udata.displayName || 'Bạn bè',
            email: udata.email || '',
            photoURL: udata.photoURL || udata.avatarUrl || null,
          });
        }
      }
      return friends;
    } catch (err) {
      console.error('Error fetching friends:', err);
      return [];
    }
  },

  async getFriendCount(uid: string): Promise<number> {
    try {
      const q = query(collection(db, 'friends'), where('userIds', 'array-contains', uid));
      const snap = await getDocs(q);
      return snap.size;
    } catch (err) {
      console.error('Error getting friend count:', err);
      return 0;
    }
  },

  async removeFriend(uid: string, friendUid: string): Promise<void> {
    try {
      const q = query(collection(db, 'friends'), where('userIds', 'array-contains', uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const ids = d.data().userIds as string[];
        if (ids.includes(friendUid)) {
          await deleteDoc(doc(db, 'friends', d.id));
        }
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      throw err;
    }
  },

  // --- SOCIAL LOCKET POSTS ---
  async createLocketPost(playerId: string, note: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập.');

    // Look up player details in local JSON database
    const localPlayer = (playersData as any[]).find((p) => p.idPlayer === playerId);
    const playerName = localPlayer ? localPlayer.name || localPlayer.strPlayer : 'Cầu thủ';
    const playerImage = localPlayer ? localPlayer.cutout || localPlayer.thumb || localPlayer.strCutout || localPlayer.strThumb : '';

    // Add post to player_posts
    await addDoc(collection(db, 'player_posts'), {
      playerId,
      playerName,
      playerImage,
      userId: user.uid,
      userName: user.displayName || 'Thành viên',
      userPhoto: user.photoURL || null,
      note: note.trim(),
      timestamp: new Date().toISOString(),
      reactions: {},
    });
  },

  async getFeedPosts(uid: string): Promise<LocketPost[]> {
    try {
      // 1. Get friends uids
      const friends = await this.getFriends(uid);
      const uids = [uid, ...friends.map((f) => f.uid)];

      // 2. Fetch posts
      const q = query(
        collection(db, 'player_posts'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      let posts = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as LocketPost[];

      // Filter feed posts to contain only friends + self, if friends exist
      // If we don't have friends yet, show all posts to make the app feed look alive.
      if (friends.length > 0) {
        posts = posts.filter((p) => uids.includes(p.userId));
      }

      return posts;
    } catch (err) {
      console.warn('Error fetching feed:', err);
      return [];
    }
  },

  async getPlayerTimeline(playerId: string): Promise<LocketPost[]> {
    try {
      const q = query(
        collection(db, 'player_posts'),
        where('playerId', '==', playerId)
      );
      const snap = await getDocs(q);
      let posts = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as LocketPost[];

      // Client-side sort to bypass Firebase composite index requirement
      posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return posts;
    } catch (err) {
      console.warn('Error fetching player timeline:', err);
      return [];
    }
  },

  async reactToPost(postId: string, uid: string, emoji: string): Promise<void> {
    // 1. Get post
    const postRef = doc(db, 'player_posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return;
    const postData = postSnap.data() as LocketPost;
    const reactions = postData.reactions || {};

    const newReactions = { ...reactions };
    let isNewReaction = true;

    if (newReactions[uid] === emoji) {
      // Toggle off if same emoji
      delete newReactions[uid];
      isNewReaction = false;
    } else {
      newReactions[uid] = emoji;
    }

    await updateDoc(postRef, {
      reactions: newReactions,
    });

    if (isNewReaction && postData.userId !== uid) {
      // Write a notification to post owner
      await addDoc(collection(db, 'notifications'), {
        userId: postData.userId,
        title: `Cảm xúc mới ${emoji}`,
        message: `${auth.currentUser?.displayName || 'Ai đó'} đã thả cảm xúc bài viết Locket của bạn về ${postData.playerName}.`,
        isRead: false,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // --- COMMENTS ---
  async addComment(postId: string, text: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập.');



    await addDoc(collection(db, 'comments'), {
      postId,
      userId: user.uid,
      userName: user.displayName || 'Thành viên',
      userPhoto: user.photoURL || null,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    });

    // Notify post owner
    const postSnap = await getDoc(doc(db, 'player_posts', postId));
    if (postSnap.exists()) {
      const postData = postSnap.data();
      if (postData.userId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: postData.userId,
          title: 'Bình luận mới 💬',
          message: `${user.displayName} đã bình luận về bài viết Locket của bạn về ${postData.playerName}.`,
          isRead: false,
          timestamp: new Date().toISOString(),
        });
      }
    }
  },

  async getComments(postId: string): Promise<Comment[]> {
    try {


      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId)
      );
      const snap = await getDocs(q);
      const comments = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Comment[];
      
      // Sort client-side to avoid needing a composite index
      return comments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (err) {
      console.error('Error fetching comments:', err);
      return [];
    }
  },

  // --- PLAYER SUBSCRIPTIONS ---
  async subscribeToPlayer(playerId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập.');

    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid),
      where('playerId', '==', playerId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return; // Already subscribed

    await addDoc(collection(db, 'subscriptions'), {
      userId: user.uid,
      playerId,
      timestamp: new Date().toISOString(),
    });
  },

  async unsubscribeFromPlayer(playerId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập.');

    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid),
      where('playerId', '==', playerId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'subscriptions', d.id));
    }
  },

  async isSubscribed(playerId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid),
      where('playerId', '==', playerId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }
};
