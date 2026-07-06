import React from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HomePlayer } from '../types/home.types';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Props {
  players: HomePlayer[];
}

export default function FavoritePlayersSection({ players }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Siêu Sao Yêu Thích ⭐</ThemedText>
        <TouchableOpacity onPress={() => router.push('/(tabs)/players')}>
          <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Tìm thêm</ThemedText>
        </TouchableOpacity>
      </View>

      {players.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={32} color="#A0AEC0" />
          <ThemedText style={styles.emptyText}>No favorite players yet</ThemedText>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              activeOpacity={0.85}
              style={[
                styles.playerCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => {
                let detailId = '34145395'; // Messi default fallback
                if (player.name.toLowerCase().includes('messi')) detailId = '34145395';
                else if (player.name.toLowerCase().includes('ronaldo')) detailId = '34147589';
                else if (player.name.toLowerCase().includes('haaland')) detailId = '34161324';

                router.push(`/player/playerDetail?id=${detailId}` as any);
              }}
            >
              {/* Avatar Frame */}
              <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
                {player.avatar ? (
                  <Image source={{ uri: player.avatar }} style={styles.avatarImage} resizeMode="contain" />
                ) : (
                  <Ionicons name="person" size={24} color="#A0AEC0" />
                )}
              </View>

              {/* Player Info */}
              <View style={styles.playerInfo}>
                <ThemedText style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </ThemedText>
                <ThemedText style={styles.playerPosition}>
                  {player.position}
                </ThemedText>
              </View>

              {/* Next Match Info */}
              <View style={[styles.nextMatchContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="calendar-outline" size={10} color={colors.primary} />
                <ThemedText style={styles.nextMatchText} numberOfLines={2}>
                  {player.nextMatch}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  playerCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerPosition: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 2,
  },
  nextMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    width: '100%',
    gap: 4,
  },
  nextMatchText: {
    fontSize: 8,
    fontWeight: '500',
    color: '#718096',
    flex: 1,
    lineHeight: 10,
  },
  emptyContainer: {
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '500',
  },
});
