import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FootballDataService } from '@/services/footballData.service';

type Tab = 'players' | 'matches' | 'stats';

export default function TeamDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('players');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      FootballDataService.getTeamDetail(id).catch(() => null),
      FootballDataService.getTeamPlayers(id).catch(() => null),
      FootballDataService.getTeamMatches(id).catch(() => null),
      FootballDataService.getTeamStats(id).catch(() => null),
    ]).then(([t, p, m, st]) => {
      setTeam(t);
      const playerList: any[] = p?.players || p?.data?.players || p?.data || [];
      setPlayers(Array.isArray(playerList) ? playerList : []);
      const matchList: any[] = m?.matches || m?.data?.matches || m?.data || [];
      setMatches(Array.isArray(matchList) ? matchList : []);
      setStats(st?.data || st);
      setLoading(false);
    });
  }, [id]);

  const teamInfo = team?.data || team;
  const displayName = teamInfo?.team_name || teamInfo?.name || name || 'Đội bóng';
  const logo = teamInfo?.team_logo || teamInfo?.logo || '';
  const country = teamInfo?.country || '';
  const founded = teamInfo?.founded || '';
  const stadium = teamInfo?.stadium_name || teamInfo?.ground || '';
  const form = teamInfo?.form;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'players', label: '👤 Cầu thủ' },
    { key: 'matches', label: '📅 Trận đấu' },
    { key: 'stats', label: '📊 Thống kê' },
  ];

  const positionColor = (pos: string) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('forward') || p.includes('fw') || p.includes('striker')) return '#EF4444';
    if (p.includes('mid') || p.includes('mf')) return '#3B82F6';
    if (p.includes('def') || p.includes('df') || p.includes('back')) return '#10B981';
    if (p.includes('goal') || p.includes('gk')) return '#F59E0B';
    return colors.icon;
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
            {displayName}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* Team Profile Card */}
            <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {logo ? (
                <Image source={{ uri: logo }} style={s.teamLogo} />
              ) : (
                <View style={[s.teamInitBg, { backgroundColor: colors.background }]}>
                  <ThemedText style={s.teamInit}>{displayName.charAt(0)}</ThemedText>
                </View>
              )}
              <ThemedText style={[s.teamDisplayName, { color: colors.text }]}>{displayName}</ThemedText>
              <View style={s.metaRow}>
                {country ? (
                  <View style={s.metaBadge}>
                    <Ionicons name="flag-outline" size={13} color={colors.icon} />
                    <ThemedText style={[s.metaTxt, { color: colors.icon }]}>{country}</ThemedText>
                  </View>
                ) : null}
                {founded ? (
                  <View style={s.metaBadge}>
                    <Ionicons name="calendar-outline" size={13} color={colors.icon} />
                    <ThemedText style={[s.metaTxt, { color: colors.icon }]}>Thành lập {founded}</ThemedText>
                  </View>
                ) : null}
              </View>
              {stadium ? (
                <View style={s.metaBadge}>
                  <Ionicons name="home-outline" size={13} color={colors.icon} />
                  <ThemedText style={[s.metaTxt, { color: colors.icon }]}>{stadium}</ThemedText>
                </View>
              ) : null}
              {form && (
                <View style={s.formRow}>
                  <ThemedText style={[s.formLabel, { color: colors.icon }]}>PPG: </ThemedText>
                  <ThemedText style={[s.formVal, { color: colors.primary }]}>
                    {form.ppg_overall?.toFixed(2) ?? '—'}
                  </ThemedText>
                  <ThemedText style={[s.formLabel, { color: colors.icon }]}>  Sân nhà: </ThemedText>
                  <ThemedText style={[s.formVal, { color: colors.primary }]}>
                    {form.ppg_home?.toFixed(2) ?? '—'}
                  </ThemedText>
                  <ThemedText style={[s.formLabel, { color: colors.icon }]}>  Sân khách: </ThemedText>
                  <ThemedText style={[s.formVal, { color: '#F59E0B' }]}>
                    {form.ppg_away?.toFixed(2) ?? '—'}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Tabs */}
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

            {/* Players */}
            {activeTab === 'players' && (
              players.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="people-outline" size={40} color={colors.icon} />
                  <ThemedText style={{ color: colors.icon, marginTop: 10 }}>Không có dữ liệu cầu thủ</ThemedText>
                </View>
              ) : (
                <View style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {players.map((p: any, i: number) => {
                    const pname = p.player_name || p.name || '—';
                    const pos = p.position || p.pos || '';
                    const plogo = p.player_image || p.image || '';
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[s.playerRow, i < players.length - 1 && { borderBottomColor: colors.border + '40', borderBottomWidth: 1 }]}
                        onPress={() => p.player_id && router.push({ pathname: '/player/[id]' as any, params: { id: p.player_id } })}
                      >
                        {plogo ? (
                          <Image source={{ uri: plogo }} style={s.playerAvatar} />
                        ) : (
                          <View style={[s.playerInitBg, { backgroundColor: colors.background }]}>
                            <ThemedText style={s.playerInit}>{pname.charAt(0)}</ThemedText>
                          </View>
                        )}
                        <View style={s.playerInfo}>
                          <ThemedText style={[s.playerName, { color: colors.text }]}>{pname}</ThemedText>
                          {pos ? <ThemedText style={[s.playerPos, { color: positionColor(pos) }]}>{pos}</ThemedText> : null}
                        </View>
                        {p.jersey_number ? (
                          <ThemedText style={[s.jersey, { color: colors.primary }]}>#{p.jersey_number}</ThemedText>
                        ) : null}
                        <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}

            {/* Matches */}
            {activeTab === 'matches' && (
              matches.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="football-outline" size={40} color={colors.icon} />
                  <ThemedText style={{ color: colors.icon, marginTop: 10 }}>Không có trận đấu</ThemedText>
                </View>
              ) : (
                matches.map((m: any, i: number) => {
                  const mapped = FootballDataService.mapRestMatchToClientMatch(m);
                  const isFT = mapped.status === 'FT';
                  const isLive = mapped.status === 'Live';
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push({ pathname: '/match/[id]' as any, params: { id: mapped.id, leagueId: mapped.tournamentId } })}
                    >
                      <ThemedText style={[s.matchLeague, { color: colors.icon }]}>{mapped.tournamentName} · {mapped.stage}</ThemedText>
                      <View style={s.matchRow}>
                        <ThemedText style={[s.matchTeamTxt, { color: colors.text }]} numberOfLines={1}>{mapped.homeTeamName}</ThemedText>
                        <View style={s.matchScoreBox}>
                          {mapped.status === 'Scheduled' ? (
                            <ThemedText style={[s.matchScoreTxt, { color: colors.text }]}>{mapped.kickoff}</ThemedText>
                          ) : (
                            <ThemedText style={[s.matchScoreTxt, { color: colors.text }]}>
                              {mapped.homeScore ?? 0} – {mapped.awayScore ?? 0}
                            </ThemedText>
                          )}
                          <ThemedText style={[s.matchStatusTxt, { color: isLive ? '#10B981' : colors.icon }]}>
                            {isLive ? '● LIVE' : isFT ? 'FT' : mapped.date}
                          </ThemedText>
                        </View>
                        <ThemedText style={[s.matchTeamTxt, { color: colors.text, textAlign: 'right' }]} numberOfLines={1}>{mapped.awayTeamName}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )
            )}

            {/* Stats */}
            {activeTab === 'stats' && (
              !stats ? (
                <View style={s.empty}>
                  <Ionicons name="bar-chart-outline" size={40} color={colors.icon} />
                  <ThemedText style={{ color: colors.icon, marginTop: 10 }}>Không có thống kê</ThemedText>
                </View>
              ) : (
                <View style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {[
                    ['Trận thắng', stats.wins || stats.won || '—'],
                    ['Trận hòa', stats.draws || stats.drawn || '—'],
                    ['Trận thua', stats.losses || stats.lost || '—'],
                    ['Bàn thắng', stats.goals_for || stats.goals?.for || '—'],
                    ['Bàn thua', stats.goals_against || stats.goals?.against || '—'],
                    ['PPG', stats.points_per_game || form?.ppg_overall?.toFixed(2) || '—'],
                  ].map(([label, val], i) => (
                    <View
                      key={i}
                      style={[s.statRow, i < 5 && { borderBottomColor: colors.border + '40', borderBottomWidth: 1 }]}
                    >
                      <ThemedText style={[s.statLabel, { color: colors.icon }]}>{label}</ThemedText>
                      <ThemedText style={[s.statVal, { color: colors.text }]}>{String(val)}</ThemedText>
                    </View>
                  ))}
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
  scroll: { padding: 16, paddingBottom: 48 },
  profileCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16, alignItems: 'center', elevation: 4 },
  teamLogo: { width: 80, height: 80, borderRadius: 40, resizeMode: 'contain', marginBottom: 12 },
  teamInitBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  teamInit: { fontSize: 32, fontWeight: '800' },
  teamDisplayName: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaTxt: { fontSize: 13, marginLeft: 5, fontWeight: '500' },
  formRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  formLabel: { fontSize: 12 },
  formVal: { fontSize: 14, fontWeight: '800' },
  tabBar: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabTxt: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  listCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, resizeMode: 'cover', marginRight: 12 },
  playerInitBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  playerInit: { fontSize: 16, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600' },
  playerPos: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  jersey: { fontSize: 13, fontWeight: '700', marginRight: 8 },
  matchCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  matchLeague: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeamTxt: { flex: 1, fontSize: 13, fontWeight: '700' },
  matchScoreBox: { width: 80, alignItems: 'center' },
  matchScoreTxt: { fontSize: 16, fontWeight: '900' },
  matchStatusTxt: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  statLabel: { fontSize: 14, fontWeight: '500' },
  statVal: { fontSize: 16, fontWeight: '800' },
});
