import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FootballDataService } from '@/services/footballData.service';

type SearchType = 'all' | 'teams' | 'players' | 'leagues';

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const typeFilters: { key: SearchType; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'teams', label: '🛡️ Đội' },
    { key: 'players', label: '👤 Cầu thủ' },
    { key: 'leagues', label: '🏆 Giải đấu' },
  ];

  const doSearch = useCallback(async (q: string, type: SearchType) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await FootballDataService.searchGlobal(q.trim(), type === 'all' ? undefined : type);
      setResults(data?.results || data?.data?.results || data?.data || data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  }, []);

  const onQueryChange = (text: string) => {
    setQuery(text);
    doSearch(text, searchType);
  };

  const onTypeChange = (type: SearchType) => {
    setSearchType(type);
    doSearch(query, type);
  };

  const teams: any[] = results?.teams || [];
  const players: any[] = results?.players || [];
  const leagues: any[] = results?.leagues || [];
  const matches: any[] = results?.matches || [];

  const hasResults = teams.length + players.length + leagues.length + matches.length > 0;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border + '40' }]}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Tìm đội, cầu thủ, giải đấu..."
              placeholderTextColor={colors.icon}
              value={query}
              onChangeText={onQueryChange}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults(null); }}>
                <Ionicons name="close-circle" size={18} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Type filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.typeFilters}
        >
          {typeFilters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.typeBtn, { borderColor: colors.border, backgroundColor: searchType === f.key ? colors.primary : colors.card }]}
              onPress={() => onTypeChange(f.key)}
            >
              <ThemedText style={[s.typeTxt, searchType === f.key && { color: '#fff', fontWeight: 'bold' }]}>
                {f.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : query.length < 2 ? (
          <View style={s.centered}>
            <Ionicons name="search-outline" size={56} color={colors.icon} />
            <ThemedText style={{ color: colors.icon, marginTop: 12, fontSize: 15 }}>Nhập ít nhất 2 ký tự</ThemedText>
          </View>
        ) : !hasResults ? (
          <View style={s.centered}>
            <Ionicons name="sad-outline" size={48} color={colors.icon} />
            <ThemedText style={{ color: colors.icon, marginTop: 12 }}>Không tìm thấy kết quả</ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* Leagues */}
            {leagues.length > 0 && (
              <View style={s.group}>
                <ThemedText style={[s.groupTitle, { color: colors.text }]}>🏆 Giải đấu</ThemedText>
                {leagues.map((l: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/tournament/[id]' as any, params: { id: l.league_id, name: l.name } })}
                  >
                    {l.image ? (
                      <Image source={{ uri: l.image }} style={s.resultLogo} />
                    ) : (
                      <View style={[s.resultInitBg, { backgroundColor: colors.background }]}>
                        <ThemedText style={s.resultInit}>🏆</ThemedText>
                      </View>
                    )}
                    <View style={s.resultInfo}>
                      <ThemedText style={[s.resultName, { color: colors.text }]}>{l.name || l.competition_name}</ThemedText>
                      <ThemedText style={[s.resultSub, { color: colors.icon }]}>{l.country}</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Teams */}
            {teams.length > 0 && (
              <View style={s.group}>
                <ThemedText style={[s.groupTitle, { color: colors.text }]}>🛡️ Đội bóng</ThemedText>
                {teams.map((t: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/team/[id]' as any, params: { id: t.team_id, name: t.team_name } })}
                  >
                    {t.team_logo ? (
                      <Image source={{ uri: t.team_logo }} style={s.resultLogo} />
                    ) : (
                      <View style={[s.resultInitBg, { backgroundColor: colors.background }]}>
                        <ThemedText style={s.resultInit}>{(t.team_name || '?').charAt(0)}</ThemedText>
                      </View>
                    )}
                    <View style={s.resultInfo}>
                      <ThemedText style={[s.resultName, { color: colors.text }]}>{t.team_name}</ThemedText>
                      <ThemedText style={[s.resultSub, { color: colors.icon }]}>{t.country}</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Players */}
            {players.length > 0 && (
              <View style={s.group}>
                <ThemedText style={[s.groupTitle, { color: colors.text }]}>👤 Cầu thủ</ThemedText>
                {players.map((p: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => p.player_id && router.push({ pathname: '/player/[id]' as any, params: { id: p.player_id } })}
                  >
                    {p.player_image ? (
                      <Image source={{ uri: p.player_image }} style={s.resultLogo} />
                    ) : (
                      <View style={[s.resultInitBg, { backgroundColor: colors.background }]}>
                        <ThemedText style={s.resultInit}>{(p.player_name || '?').charAt(0)}</ThemedText>
                      </View>
                    )}
                    <View style={s.resultInfo}>
                      <ThemedText style={[s.resultName, { color: colors.text }]}>{p.player_name}</ThemedText>
                      <ThemedText style={[s.resultSub, { color: colors.icon }]}>
                        {p.team?.team_name || p.nationality || ''}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Matches */}
            {matches.length > 0 && (
              <View style={s.group}>
                <ThemedText style={[s.groupTitle, { color: colors.text }]}>⚽ Trận đấu</ThemedText>
                {matches.map((m: any, i: number) => {
                  const mapped = FootballDataService.mapRestMatchToClientMatch(m);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push({ pathname: '/match/[id]' as any, params: { id: mapped.id, leagueId: mapped.tournamentId } })}
                    >
                      <View style={s.resultInfo}>
                        <ThemedText style={[s.resultName, { color: colors.text }]}>
                          {mapped.homeTeamName} vs {mapped.awayTeamName}
                        </ThemedText>
                        <ThemedText style={[s.resultSub, { color: colors.icon }]}>
                          {mapped.date} · {mapped.tournamentName}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  typeFilters: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  typeTxt: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 48 },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  resultLogo: { width: 40, height: 40, borderRadius: 20, resizeMode: 'contain', marginRight: 12 },
  resultInitBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resultInit: { fontSize: 16, fontWeight: '700' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '700' },
  resultSub: { fontSize: 12, marginTop: 2 },
});
