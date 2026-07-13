import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ReactionPicker, REACTIONS } from '@/components/ReactionPicker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import { auth } from '@/services/firebase';
import { CommunityService, LocketPost, Friend, FriendRequest, Comment } from '@/services/community.service';
import playersData from '@/assets/data/players.json';

const { width } = Dimensions.get('window');
const isCompact = width < 640;

export default function CommunityScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const user = auth.currentUser;
  const { favorites } = useFavorites();

  // Tabs: 'feed' | 'friends'
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [posts, setPosts] = useState<LocketPost[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);

  // Search user
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [searching, setSearching] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Modals
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<LocketPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Reaction Picker state
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [reactionPostId, setReactionPostId] = useState<string | null>(null);

  // New post state
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
  const [noteText, setNoteText] = useState('');
  const [posting, setPosting] = useState(false);

  // Load data initially
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (activeTab === 'feed') {
        const feedPosts = await CommunityService.getFeedPosts(user.uid);
        setPosts(feedPosts);

        // Update Android Home Widget data
        if (feedPosts.length > 0 && Platform.OS === 'android') {
          try {
            const top = feedPosts[0];
            const widgetData = {
              type: 'locket',
              title: `⚽ ${top.playerName}`,
              subtitle: top.userName,
              content: top.note,
              imageUrl: top.playerImage,
            };
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('LATEST_WIDGET_DATA', JSON.stringify(widgetData));
            
            // Instantly update widget
            const { requestWidgetUpdate } = require('react-native-android-widget');
            const { SoccerWidget } = require('@/widgets/SoccerWidget');
            const { widgetTaskHandler } = require('@/widgets/widget-task-handler');
            requestWidgetUpdate({
              widgetName: 'SoccerWidget',
              renderWidget: () => <SoccerWidget {...widgetData} />,
              widgetTaskHandler,
            });
          } catch (e) {
            console.error('Widget update error:', e);
          }
        }
      } else {
        const friendsList = await CommunityService.getFriends(user.uid);
        const reqList = await CommunityService.getPendingRequests(user.uid);
        setFriends(friendsList);
        setPendingRequests(reqList);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Search User to add
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setRequestSent(false);
    try {
      const foundUser = await CommunityService.searchUserByEmail(searchEmail);
      if (foundUser) {
        if (foundUser.uid === user?.uid) {
          Alert.alert('Lỗi', 'Bạn không thể kết bạn với chính mình.');
        } else {
          setSearchResult(foundUser);
        }
      } else {
        Alert.alert('Không tìm thấy', 'Không tìm thấy người dùng nào với email này.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!user || !searchResult) return;
    try {
      await CommunityService.sendFriendRequest(user.uid, searchResult.uid);
      setRequestSent(true);
      Alert.alert('Thành công', `Đã gửi lời mời kết bạn đến ${searchResult.name}!`);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lời mời kết bạn.');
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      await CommunityService.acceptFriendRequest(request);
      Alert.alert('Đã kết bạn', `Bạn và ${request.fromName} đã trở thành bạn bè!`);
      loadData();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn.');
    }
  };

  // Decline Friend Request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      await CommunityService.declineFriendRequest(requestId);
      loadData();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn.');
    }
  };

  // Remove Friend
  const handleRemoveFriend = async (friendUid: string, friendName: string) => {
    if (!user) return;
    Alert.alert(
      'Xóa bạn bè',
      `Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await CommunityService.removeFriend(user.uid, friendUid);
              loadData();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bạn bè.');
            }
          },
        },
      ]
    );
  };

  // Create Post
  const handleCreatePost = async () => {
    if (!selectedPlayerId) {
      Alert.alert('Lỗi', 'Vui lòng chọn một cầu thủ.');
      return;
    }
    if (!noteText.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung locket.');
      return;
    }
    setPosting(true);
    try {
      await CommunityService.createLocketPost(selectedPlayerId, noteText);
      const handleOpenPostModal = () => {
        setSelectedPlayerId('');
        setSelectedPlayerName('');
        setSearchPlayerQuery('');
        setNoteText('');
        setPostModalVisible(true);
      };
      Alert.alert('Thành công', 'Locket của bạn đã được đăng lên feed!');
      loadData();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo locket lúc này.');
    } finally {
      setPosting(false);
    }
  };

  // Open Comments Modal
  const handleOpenComments = async (post: LocketPost) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
    try {
      const postComments = await CommunityService.getComments(post.id);
      setComments(postComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Post Comment
  const handlePostComment = async () => {
    if (!selectedPost || !newComment.trim()) return;
    setCommenting(true);
    try {
      await CommunityService.addComment(selectedPost.id, newComment);
      setNewComment('');
      // Reload comments
      const postComments = await CommunityService.getComments(selectedPost.id);
      setComments(postComments);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể bình luận.');
    } finally {
      setCommenting(false);
    }
  };

  // Reaction Handling
  const handleReactionSelect = async (emoji: string) => {
    if (!user || !reactionPostId) return;

    setReactionPickerVisible(false);

    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === reactionPostId) {
          const newReactions = { ...(p.reactions || {}) };
          if (newReactions[user.uid] === emoji) {
            delete newReactions[user.uid];
          } else {
            newReactions[user.uid] = emoji;
          }
          return { ...p, reactions: newReactions };
        }
        return p;
      })
    );

    try {
      await CommunityService.reactToPost(reactionPostId, user.uid, emoji);
    } catch (error) {
      console.error('Error sending reaction:', error);
      loadData(); // revert
    }
  };

  const openReactionPicker = (postId: string) => {
    setReactionPostId(postId);
    setReactionPickerVisible(true);
  };

  // Filter players list for picker
  const filteredPlayers = (playersData as any[]).filter((p) => {
    const name = p.name || p.strPlayer || '';
    return name.toLowerCase().includes(searchPlayerQuery.toLowerCase());
  }).slice(0, 5);

  const combinedFavoriteIds = Array.from(new Set([...favorites]));
  const favoritePlayersObjects = combinedFavoriteIds.map(fId => 
    (playersData as any[]).find(p => p.idPlayer === fId)
  ).filter(Boolean);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Title */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Soccer Locket ⚽</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Chia sẻ khoảnh khắc, cảm xúc và Timeline cầu thủ cùng bạn bè
          </ThemedText>
        </View>

        {/* Tab Controls */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'feed' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('feed')}
          >
            <Ionicons name="images-outline" size={18} color={activeTab === 'feed' ? colors.primary : colors.icon} />
            <ThemedText style={[styles.tabText, activeTab === 'feed' && { color: colors.primary, fontWeight: '700' }]}>
              Locket Feed
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'friends' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons name="people-outline" size={18} color={activeTab === 'friends' ? colors.primary : colors.icon} />
            <ThemedText style={[styles.tabText, activeTab === 'friends' && { color: colors.primary, fontWeight: '700' }]}>
              Bạn bè ({friends.length})
            </ThemedText>
            {pendingRequests.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: 10, color: colors.icon }}>Đang tải dữ liệu...</ThemedText>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {activeTab === 'feed' ? (
              // LOCKET FEED TAB
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.feedContent}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                renderItem={({ item }) => {
                  const reactions = item.reactions || {};
                  const reactionCounts: Record<string, number> = {};
                  Object.values(reactions).forEach((emoji) => {
                    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
                  });
                  const myReaction = user ? reactions[user.uid] : null;

                  return (
                    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {/* Post Header: User info */}
                      <View style={styles.postUserRow}>
                        {item.userPhoto ? (
                          <Image source={{ uri: item.userPhoto }} style={styles.userAvatar} />
                        ) : (
                          <View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="person" size={16} color={colors.primary} />
                          </View>
                        )}
                        <View>
                          <ThemedText style={styles.userNameText}>{item.userName}</ThemedText>
                          <ThemedText style={styles.timeText}>
                            {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Locket Frame Container */}
                      <View style={[styles.locketFrame, { backgroundColor: '#0B1523' }]}>
                        {item.playerImage ? (
                          <Image source={{ uri: item.playerImage }} style={styles.playerImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.playerFallbackImage}>
                            <Ionicons name="football" size={48} color={colors.primary + '30'} />
                          </View>
                        )}
                        {/* Player name badge */}
                        <View style={styles.playerNameBadge}>
                          <ThemedText style={styles.playerNameText}>⚽ {item.playerName}</ThemedText>
                        </View>
                      </View>

                      {/* Post Content Note */}
                      <View style={styles.noteContainer}>
                        <ThemedText style={styles.noteText}>"{item.note}"</ThemedText>
                      </View>

                      {/* Display Reaction Counts */}
                      {Object.keys(reactionCounts).length > 0 && (
                        <View style={styles.reactionCountsRow}>
                          {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <View key={emoji} style={styles.reactionCountBadge}>
                              <ThemedText style={styles.reactionCountEmoji}>{emoji}</ThemedText>
                              <ThemedText style={styles.reactionCountText}>{count}</ThemedText>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Social Actions */}
                      <View style={[styles.actionsFooter, { borderTopColor: colors.border }]}>
                        <TouchableOpacity style={styles.actionItem} onPress={() => openReactionPicker(item.id)}>
                          {myReaction ? (
                            <>
                              <ThemedText style={{ fontSize: 20, marginRight: 6 }}>{myReaction}</ThemedText>
                              <ThemedText style={[styles.actionLabel, { color: colors.primary }]}>Đã bày tỏ</ThemedText>
                            </>
                          ) : (
                            <>
                              <Ionicons name="heart-outline" size={20} color={colors.text} />
                              <ThemedText style={styles.actionLabel}>Cảm xúc</ThemedText>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem} onPress={() => handleOpenComments(item)}>
                          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                          <ThemedText style={styles.actionLabel}>Bình luận</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={48} color={colors.icon} />
                    <ThemedText style={styles.emptyTextTitle}>Bảng tin Locket trống</ThemedText>
                    <ThemedText style={styles.emptyTextDesc}>
                      Kết bạn và chia sẻ cảm nghĩ về các ngôi sao bóng đá để bảng tin thêm sôi động.
                    </ThemedText>
                  </View>
                }
              />
            ) : (
              // FRIENDS & REQUESTS TAB
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.friendsContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                  />
                }
              >
                {/* Search / Add Friend Section */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>Tìm kiếm & Thêm bạn bè</ThemedText>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="Nhập email người dùng..."
                      placeholderTextColor="#A0AEC0"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={searchEmail}
                      onChangeText={setSearchEmail}
                    />
                    <TouchableOpacity
                      style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSearchUser}
                      disabled={searching}
                    >
                      {searching ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Ionicons name="search" size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Search Result */}
                  {searchResult && (
                    <View style={[styles.searchResultCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      {searchResult.photoURL ? (
                        <Image source={{ uri: searchResult.photoURL }} style={styles.resultAvatar} />
                      ) : (
                        <View style={[styles.resultAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="person" size={24} color={colors.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={styles.resultName}>{searchResult.name}</ThemedText>
                        <ThemedText style={styles.resultEmail}>{searchResult.email}</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={[styles.addFriendBtn, { backgroundColor: requestSent ? colors.icon : colors.primary }]}
                        onPress={handleSendFriendRequest}
                        disabled={requestSent}
                      >
                        <Ionicons name={requestSent ? 'checkmark' : 'person-add'} size={16} color="#FFF" />
                        <Text style={styles.addFriendBtnText}>
                          {requestSent ? 'Đã gửi' : 'Kết bạn'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Friend Requests Section */}
                {pendingRequests.length > 0 && (
                  <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.primary }]}>
                      Lời mời kết bạn chờ duyệt ({pendingRequests.length})
                    </ThemedText>
                    {pendingRequests.map((req) => (
                      <View key={req.id} style={[styles.requestRow, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.requestName}>{req.fromName}</ThemedText>
                          <ThemedText style={styles.requestEmail}>{req.fromEmail}</ThemedText>
                        </View>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[styles.reqActionBtn, { backgroundColor: colors.success }]}
                            onPress={() => handleAcceptRequest(req)}
                          >
                            <Ionicons name="checkmark" size={16} color="#FFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.reqActionBtn, { backgroundColor: '#FF4D4F' }]}
                            onPress={() => handleDeclineRequest(req.id)}
                          >
                            <Ionicons name="close" size={16} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Friends List Section */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>Danh sách Bạn bè ({friends.length})</ThemedText>
                  {friends.length === 0 ? (
                    <View style={styles.emptyCardContent}>
                      <Ionicons name="people-outline" size={32} color={colors.icon} />
                      <ThemedText style={styles.emptyCardText}>Chưa có bạn bè nào.</ThemedText>
                    </View>
                  ) : (
                    friends.map((friend) => (
                      <View key={friend.uid} style={[styles.friendRow, { borderBottomColor: colors.border }]}>
                        {friend.photoURL ? (
                          <Image source={{ uri: friend.photoURL }} style={styles.friendAvatar} />
                        ) : (
                          <View style={[styles.friendAvatarPlaceholder, { backgroundColor: colors.primary + '18' }]}>
                            <Ionicons name="person" size={16} color={colors.primary} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.friendName}>{friend.name}</ThemedText>
                          <ThemedText style={styles.friendEmail}>{friend.email}</ThemedText>
                        </View>
                        <TouchableOpacity
                          style={styles.removeFriendBtn}
                          onPress={() => handleRemoveFriend(friend.uid, friend.name)}
                        >
                          <Ionicons name="person-remove-outline" size={20} color="#FF4D4F" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* Floating Action Button (New Post) */}
        {activeTab === 'feed' && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setPostModalVisible(true)}
          >
            <Ionicons name="add" size={28} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* --- MODAL: CREATE POST --- */}
        <Modal visible={postModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.modalCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Tạo Locket Mới 📸</ThemedText>
                <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="always">
                {/* Chosen Player Display */}
                {selectedPlayerId ? (
                  <View style={[styles.chosenPlayerCard, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 12 }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <ThemedText style={{ marginLeft: 8, fontWeight: '700', flex: 1 }}>
                      Đã đính kèm: {selectedPlayerName}
                    </ThemedText>
                    <TouchableOpacity onPress={() => { setSelectedPlayerId(''); setSelectedPlayerName(''); setSearchPlayerQuery(''); }}>
                      <Ionicons name="close-circle" size={24} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* Search Player Input */}
                    <ThemedText style={styles.inputLabel}>1. Chọn Cầu thủ đính kèm:</ThemedText>
                    <TextInput
                      style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                      placeholder="Gõ tên cầu thủ để tìm..."
                      placeholderTextColor="#A0AEC0"
                      value={searchPlayerQuery}
                      onChangeText={(text) => {
                        setSearchPlayerQuery(text);
                        setSelectedPlayerId('');
                      }}
                    />

                    {/* Player list suggestions */}
                    {searchPlayerQuery.trim().length > 0 && (
                      <View style={[styles.playerSuggestions, { borderColor: colors.border }]}>
                        {filteredPlayers.map((player) => (
                          <TouchableOpacity
                            key={player.idPlayer}
                            style={[styles.playerSuggestItem, { borderBottomColor: colors.border }]}
                            onPress={() => {
                              setSelectedPlayerId(player.idPlayer);
                              setSelectedPlayerName(player.name || player.strPlayer);
                              setSearchPlayerQuery('');
                            }}
                          >
                            <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Image source={{ uri: player.cutout || player.thumb }} style={styles.suggestAvatar} />
                              <ThemedText style={styles.suggestName}>{player.name || player.strPlayer}</ThemedText>
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredPlayers.length === 0 && (
                          <View style={{ padding: 12 }}>
                            <ThemedText style={{ color: colors.icon, fontSize: 13 }}>Không tìm thấy cầu thủ này</ThemedText>
                          </View>
                        )}
                      </View>
                    )}
                    {/* Favorite players quick-select */}
                    {searchPlayerQuery.trim().length === 0 && (
                      <View style={{ marginTop: 12 }}>
                        <ThemedText style={{ color: '#A0AEC0', fontSize: 12, marginBottom: 8, paddingHorizontal: 4 }}>
                          Cầu thủ yêu thích của bạn:
                        </ThemedText>
                        {favoritePlayersObjects.length > 0 ? (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}>
                            {favoritePlayersObjects.map((player) => (
                              <TouchableOpacity
                                key={`fav-${player.idPlayer}`}
                                style={{ alignItems: 'center', width: 64 }}
                                onPress={() => {
                                  setSelectedPlayerId(player.idPlayer);
                                  setSelectedPlayerName(player.name || player.strPlayer);
                                  setSearchPlayerQuery('');
                                }}
                              >
                                <View pointerEvents="none" style={{ alignItems: 'center' }}>
                                  <Image 
                                    source={{ uri: player.cutout || player.thumb }} 
                                    style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary + '20', marginBottom: 6 }} 
                                  />
                                  <ThemedText style={{ fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
                                    {player.name || player.strPlayer}
                                  </ThemedText>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        ) : (
                          <ThemedText style={{ paddingHorizontal: 4, color: colors.icon }}>Chưa có cầu thủ nào.</ThemedText>
                        )}
                      </View>
                    )}
                  </>
                )}

                {/* Note text input */}
                <ThemedText style={[styles.inputLabel, { marginTop: 16 }]}>2. Viết ghi chú ngắn (tối đa 140 ký tự):</ThemedText>
                <TextInput
                  style={[styles.modalTextArea, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Hôm nay cầu thủ của bạn thế nào? Chia sẻ cảm xúc tại đây..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  maxLength={140}
                  numberOfLines={4}
                  value={noteText}
                  onChangeText={setNoteText}
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitPostBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreatePost}
                disabled={posting}
              >
                {posting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitPostBtnText}>Đăng Locket</Text>
                  </>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* --- MODAL: COMMENTS & REACTIONS --- */}
        <Modal visible={commentsModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.modalCard, { backgroundColor: colors.card, height: '70%' }]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Bình luận 💬</ThemedText>
                <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Comments list */}
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item }) => (
                  <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
                    {item.userPhoto ? (
                      <Image source={{ uri: item.userPhoto }} style={styles.commentAvatar} />
                    ) : (
                      <View style={[styles.commentAvatarPlaceholder, { backgroundColor: colors.primary + '18' }]}>
                        <Ionicons name="person" size={14} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentHeaderRow}>
                        <ThemedText style={styles.commentUserName}>{item.userName}</ThemedText>
                        <ThemedText style={styles.commentTime}>
                          {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.commentText}>{item.text}</ThemedText>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={[styles.emptyCardContent, { marginTop: 30 }]}>
                    <Ionicons name="chatbox-ellipses-outline" size={32} color={colors.icon} />
                    <ThemedText style={styles.emptyCardText}>Chưa có bình luận nào. Hãy bắt đầu!</ThemedText>
                  </View>
                }
              />

              {/* Comment Input */}
              <View style={[styles.commentInputRow, { borderTopColor: colors.border }]}>
                <TextInput
                  style={[styles.commentInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Viết câu trả lời..."
                  placeholderTextColor="#A0AEC0"
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <TouchableOpacity
                  style={[styles.commentSendBtn, { backgroundColor: colors.primary }]}
                  onPress={handlePostComment}
                  disabled={commenting || !newComment.trim()}
                >
                  {commenting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Reaction Picker Component */}
        <ReactionPicker
          visible={reactionPickerVisible}
          onClose={() => setReactionPickerVisible(false)}
          onSelect={handleReactionSelect}
          selectedEmoji={
            user && reactionPostId
              ? posts.find((p) => p.id === reactionPostId)?.reactions?.[user.uid]
              : undefined
          }
        />

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  badgeCount: {
    backgroundColor: '#FF4D4F',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 4,
  },
  badgeCountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  postUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeText: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
  },
  locketFrame: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerImage: {
    width: '80%',
    height: '80%',
  },
  playerFallbackImage: {
    opacity: 0.5,
  },
  playerNameBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  playerNameText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noteContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  reactionCountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reactionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reactionCountEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsFooter: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyTextDesc: {
    color: '#A0AEC0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  friendsContent: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultEmail: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addFriendBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#A0AEC0',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  requestName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestEmail: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reqActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  friendAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  friendEmail: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  removeFriendBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0AEC0',
    marginBottom: 8,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  playerSuggestions: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  playerSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
  },
  suggestAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  suggestName: {
    fontSize: 13,
    fontWeight: '600',
  },
  chosenPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitPostBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitPostBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginTop: 2,
  },
  commentAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUserName: {
    fontWeight: '700',
    fontSize: 12,
  },
  commentTime: {
    fontSize: 10,
    color: '#A0AEC0',
  },
  commentText: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 0.5,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
