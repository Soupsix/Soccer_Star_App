import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FootballDataService } from '@/services/footballData.service';

type Tab = 'matches' | 'standings';

export default function TournamentDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('matches');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      FootballDataService.getMatchesForLeague(id).catch(() => []),
      FootballDataService.getLeagueStandings(id).catch(() => null),
    ]).then(([m, s]) => {
      // Sort matches: upcoming first, then by date
      const sorted = [...m].sort((a, b) => {
        const da = new Date(a.match_date || '').getTime();
        const db = new Date(b.match_date || '').getTime();
        return da - db;
      });
      setMatches(sorted);

      // Standings data can be nested differently
      const rows: any[] = s?.standings || s?.data?.standings || s?.data || [];
      setStandings(Array.isArray(rows) ? rows : []);
      setLoading(false);
    });
  }, [id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'matches', label: '📅 Lịch đấu' },
    { key: 'standings', label: '🏅 Bảng xếp hạng' },
  ];

  const renderMatchItem = (m: any) => {
    const mapped = FootballDataService.mapRestMatchToClientMatch(m);
    const isFT = mapped.status === 'FT';
    const isLive = mapped.status === 'Live' || mapped.status === 'HT';
    return (
      <TouchableOpacity
        key={mapped.id}
        style={[s.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: '/match/[id]' as any, params: { id: mapped.id, leagueId: id } })}
      >
        <View style={s.matchRow}>
          <View style={s.matchTeam}>
            {mapped.homeTeamLogo ? (
              <Image source={{ uri: mapped.homeTeamLogo }} style={s.matchLogo} />
            ) : (
              <View style={[s.matchInitBg, { backgroundColor: colors.background }]}>
                <ThemedText style={s.matchInit}>{mapped.homeTeamName.charAt(0)}</ThemedText>
              </View>
            )}
            <ThemedText style={[s.matchTeamName, { color: colors.text }]} numberOfLines={1}>
              {mapped.homeTeamName}
            </ThemedText>
          </View>

          <View style={s.matchCenter}>
            {mapped.status === 'Scheduled' ? (
              <>
                <ThemedText style={[s.matchScore, { color: colors.text }]}>{mapped.kickoff}</ThemedText>
                <ThemedText style={[s.matchDate, { color: colors.icon }]}>{mapped.date}</ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={[s.matchScore, { color: colors.text }]}>
                  {mapped.homeScore ?? 0} – {mapped.awayScore ?? 0}
                </ThemedText>
                <View style={[
                  s.statusPill,
                  isLive ? { backgroundColor: '#10B98120', borderColor: '#10B981' } : { backgroundColor: colors.background, borderColor: colors.border }
                ]}>
                  <ThemedText style={[s.statusTxt, isLive && { color: '#10B981' }]}>
                    {isLive ? 'LIVE' : 'FT'}
                  </ThemedText>
                </View>
              </>
            )}
          </View>

          <View style={[s.matchTeam, { alignItems: 'flex-end' }]}>
            {mapped.awayTeamLogo ? (
              <Image source={{ uri: mapped.awayTeamLogo }} style={s.matchLogo} />
            ) : (
              <View style={[s.matchInitBg, { backgroundColor: colors.background }]}>
                <ThemedText style={s.matchInit}>{mapped.awayTeamName.charAt(0)}</ThemedText>
              </View>
            )}
            <ThemedText style={[s.matchTeamName, { color: colors.text }]} numberOfLines={1}>
              {mapped.awayTeamName}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStandingRow = (row: any, idx: number) => {
    const pos = row.position || row.rank || idx + 1;
    const teamName = row.team?.name || row.team_name || row.name || '—';
    const teamLogo = row.team?.logo || row.team_logo || '';
    const played = row.played || row.matches_played || 0;
    const won = row.won || row.wins || 0;
    const drawn = row.drawn || row.draws || 0;
    const lost = row.lost || row.losses || 0;
    const pts = row.points || 0;
    return (
      <View key={idx} style={[s.standRow, { borderBottomColor: colors.border + '30' }]}>
        <ThemedText style={[s.standPos, { color: pos <= 3 ? colors.primary : colors.icon }]}>{pos}</ThemedText>
        {teamLogo ? (
          <Image source={{ uri: teamLogo }} style={s.standLogo} />
        ) : (
          <View style={[s.standInitBg, { backgroundColor: colors.background }]}>
            <ThemedText style={{ fontSize: 10, fontWeight: '700' }}>{(teamName || '?').charAt(0)}</ThemedText>
          </View>
        )}
        <ThemedText style={[s.standName, { color: colors.text }]} numberOfLines={1}>{teamName}</ThemedText>
        <ThemedText style={[s.standStat, { color: colors.icon }]}>{played}</ThemedText>
        <ThemedText style={[s.standStat, { color: colors.icon }]}>{won}</ThemedText>
        <ThemedText style={[s.standStat, { color: colors.icon }]}>{drawn}</ThemedText>
        <ThemedText style={[s.standStat, { color: colors.icon }]}>{lost}</ThemedText>
        <ThemedText style={[s.standPts, { color: colors.text }]}>{pts}</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border + '40' }]}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {name || 'Giải đấu'}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab bar */}
        <View style={[s.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, activeTab === t.key && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab(t.key)}
            >
              <ThemedText style={[s.tabTxt, activeTab === t.key && { color: '#fff', fontWeight: 'bold' }]}>
                {t.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* Matches tab */}
            {activeTab === 'matches' && (
              matches.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="football-outline" size={40} color={colors.icon} />
                  <ThemedText style={{ color: colors.icon, marginTop: 10 }}>Không có trận đấu</ThemedText>
                </View>
              ) : (
                matches.map(m => renderMatchItem(m))
              )
            )}

            {/* Standings tab */}
            {activeTab === 'standings' && (
              standings.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="bar-chart-outline" size={40} color={colors.icon} />
                  <ThemedText style={{ color: colors.icon, marginTop: 10 }}>Không có bảng xếp hạng</ThemedText>
                </View>
              ) : (
                <View style={[s.standTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Table header */}
                  <View style={[s.standRow, { borderBottomColor: colors.border }]}>
                    <ThemedText style={[s.standPos, { color: colors.icon }]}>#</ThemedText>
                    <View style={s.standLogo} />
                    <ThemedText style={[s.standName, { color: colors.icon, fontSize: 11 }]}>Đội</ThemedText>
                    <ThemedText style={[s.standStat, { color: colors.icon, fontSize: 11 }]}>Tr</ThemedText>
                    <ThemedText style={[s.standStat, { color: colors.icon, fontSize: 11 }]}>T</ThemedText>
                    <ThemedText style={[s.standStat, { color: colors.icon, fontSize: 11 }]}>H</ThemedText>
                    <ThemedText style={[s.standStat, { color: colors.icon, fontSize: 11 }]}>B</ThemedText>
                    <ThemedText style={[s.standPts, { color: colors.icon, fontSize: 11 }]}>Đ</ThemedText>
                  </View>
                  {standings.map((row, idx) => renderStandingRow(row, idx))}
                </View>
              )
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 8, marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 48 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  matchCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { flex: 1, alignItems: 'flex-start' },
  matchLogo: { width: 36, height: 36, borderRadius: 18, resizeMode: 'contain', marginBottom: 4 },
  matchInitBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  matchInit: { fontSize: 14, fontWeight: '700' },
  matchTeamName: { fontSize: 12, fontWeight: '600', maxWidth: 90 },
  matchCenter: { width: 80, alignItems: 'center' },
  matchScore: { fontSize: 18, fontWeight: '900' },
  matchDate: { fontSize: 10, marginTop: 2 },
  statusPill: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusTxt: { fontSize: 9, fontWeight: '800' },
  standTable: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  standRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  standPos: { width: 22, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  standLogo: { width: 26, height: 26, borderRadius: 13, resizeMode: 'contain', marginHorizontal: 6 },
  standInitBg: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
  standName: { flex: 1, fontSize: 13, fontWeight: '600' },
  standStat: { width: 24, textAlign: 'center', fontSize: 12 },
  standPts: { width: 28, textAlign: 'center', fontSize: 13, fontWeight: '800' },
});
