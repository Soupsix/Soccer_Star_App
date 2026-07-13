import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MatchService } from '@/services/match.service';
import { ClientMatch } from '@/types/match.types';

// ── Types ────────────────────────────────────────────────────────────────────
interface FakeEvent {
  minute: number;
  type: 'Goal' | 'Yellow Card' | 'Red Card' | 'Substitution' | 'Penalty';
  team: 'home' | 'away';
  playerName: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateFakeEvents(match: ClientMatch): FakeEvent[] {
  if (match.status === 'Scheduled') return [];
  const homeGoals = match.homeScore ?? 0;
  const awayGoals = match.awayScore ?? 0;
  const seed = parseInt(match.id.replace(/\D/g, '').slice(0, 8) || '12345678', 10);

  const homeNames = ['Silva', 'Müller', 'Kane', 'Salah', 'Mbappe', 'Haaland', 'Vinicius', 'Messi', 'Ronaldo', 'Benzema'];
  const awayNames = ['De Bruyne', 'Modric', 'Bellingham', 'Saka', 'Rodri', 'Odegaard', 'Griezmann', 'Neymar', 'Lewandowski', 'Morata'];

  const events: FakeEvent[] = [];
  let minute = 5;
  const pr = (n: number, offset: number) => ((seed + offset * 31) % n);

  for (let i = 0; i < homeGoals; i++) {
    minute = Math.min(90, minute + 8 + pr(18, i * 7));
    events.push({ minute, type: 'Goal', team: 'home', playerName: homeNames[pr(homeNames.length, i * 3)] });
  }
  for (let i = 0; i < awayGoals; i++) {
    minute = Math.min(90, minute + 7 + pr(15, i * 11));
    events.push({ minute, type: 'Goal', team: 'away', playerName: awayNames[pr(awayNames.length, i * 5)] });
  }
  const yCards = pr(3, 99);
  for (let i = 0; i < yCards; i++) {
    minute = Math.min(88, minute + 5 + pr(20, i * 13));
    const team = pr(2, i * 17) === 0 ? 'home' : ('away' as 'home' | 'away');
    const names = team === 'home' ? homeNames : awayNames;
    events.push({ minute, type: 'Yellow Card', team, playerName: names[pr(names.length, i * 19)] });
  }
  const subs = 2 + pr(2, 55);
  for (let i = 0; i < subs; i++) {
    minute = 55 + pr(30, i * 23);
    const team = pr(2, i * 29) === 0 ? 'home' : ('away' as 'home' | 'away');
    const names = team === 'home' ? homeNames : awayNames;
    events.push({ minute, type: 'Substitution', team, playerName: names[pr(names.length, i * 37)] });
  }
  return events.sort((a, b) => a.minute - b.minute);
}

const eventEmoji = (type: FakeEvent['type']) => {
  switch (type) {
    case 'Goal': return '⚽';
    case 'Yellow Card': return '🟨';
    case 'Red Card': return '🟥';
    case 'Substitution': return '🔁';
    case 'Penalty': return '🎯';
    default: return '•';
  }
};

// ── StatBar sub-component ────────────────────────────────────────────────────
function StatBar({ label, homeVal, awayVal, homeColor, awayColor }: {
  label: string; homeVal: number; awayVal: number; homeColor: string; awayColor: string;
}) {
  const total = homeVal + awayVal || 1;
  const homePct = homeVal / total;
  return (
    <View style={sb.row}>
      <ThemedText style={sb.val}>{homeVal}</ThemedText>
      <View style={sb.wrap}>
        <ThemedText style={sb.label}>{label}</ThemedText>
        <View style={sb.track}>
          <View style={[sb.bar, { flex: homePct, backgroundColor: homeColor }]} />
          <View style={[sb.bar, { flex: 1 - homePct, backgroundColor: awayColor }]} />
        </View>
      </View>
      <ThemedText style={sb.val}>{awayVal}</ThemedText>
    </View>
  );
}
const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  val: { width: 34, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  wrap: { flex: 1, paddingHorizontal: 8 },
  label: { fontSize: 11, textAlign: 'center', marginBottom: 4, fontWeight: '600', color: '#718096' },
  track: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: {},
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MatchDetailScreen() {
  const { id, leagueId } = useLocalSearchParams<{ id: string; leagueId?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [match, setMatch] = useState<ClientMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    MatchService.getMatchById(id, leagueId)
      .then(m => { setMatch(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, leagueId]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemedView style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────
  if (!match) {
    return (
      <ThemedView style={[s.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF4D4F" />
        <ThemedText style={{ marginTop: 12, fontWeight: '600' }}>Không tìm thấy trận đấu</ThemedText>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Quay lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const isScheduled = match.status === 'Scheduled' || match.status === 'Postponed';
  const isLive = match.status === 'Live' || match.status === 'HT';
  const isFT = match.status === 'FT';
  const events = generateFakeEvents(match);

  // Deterministic fake stats
  const seed = parseInt(match.id.replace(/\D/g, '').slice(0, 6) || '123456', 10);
  const homePoss = 40 + (seed % 20);
  const awayPoss = 100 - homePoss;
  const homeShots = 8 + (seed % 10);
  const awayShots = 6 + ((seed + 3) % 10);
  const homeSOT = Math.max(1, Math.floor(homeShots * 0.5));
  const awaySOT = Math.max(1, Math.floor(awayShots * 0.5));
  const homeCorners = 3 + (seed % 6);
  const awayCorners = 2 + ((seed + 2) % 6);
  const homeYellow = events.filter(e => e.type === 'Yellow Card' && e.team === 'home').length;
  const awayYellow = events.filter(e => e.type === 'Yellow Card' && e.team === 'away').length;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={[s.header, { borderBottomColor: colors.border + '40' }]}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText style={[s.leagueLabel, { color: colors.primary }]}>
              {match.tournamentName.toUpperCase()}
            </ThemedText>
            <ThemedText style={s.stageLabel}>
              {match.stage}{match.group ? ` · Bảng ${match.group}` : ''}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.push({
              pathname: '/tournament/[id]' as any,
              params: { id: match.tournamentId, name: match.tournamentName }
            })}
          >
            <Ionicons name="trophy-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero Card ──────────────────────────────────────────── */}
          <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.teamsRow}>

              {/* Home team */}
              <TouchableOpacity
                style={s.team}
                onPress={() => match.homeTeamId && router.push({
                  pathname: '/team/[id]' as any,
                  params: { id: match.homeTeamId, name: match.homeTeamName }
                })}
              >
                {match.homeTeamLogo ? (
                  <Image source={{ uri: match.homeTeamLogo }} style={s.logo} />
                ) : (
                  <View style={[s.initBg, { backgroundColor: colors.background }]}>
                    <ThemedText style={s.initTxt}>{match.homeTeamName.charAt(0)}</ThemedText>
                  </View>
                )}
                <ThemedText style={s.teamName} numberOfLines={2}>{match.homeTeamName}</ThemedText>
              </TouchableOpacity>

              {/* Score / Time */}
              <View style={s.scoreCol}>
                {isScheduled ? (
                  <>
                    <ThemedText style={[s.scoreTxt, { color: colors.text }]}>{match.kickoff}</ThemedText>
                    <ThemedText style={[s.sub, { color: colors.icon }]}>{match.date}</ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText style={[s.scoreTxt, { color: colors.text }]}>
                      {match.homeScore ?? 0} – {match.awayScore ?? 0}
                    </ThemedText>
                    {match.penalty && (
                      <ThemedText style={[s.sub, { color: colors.icon }]}>
                        Pen {match.penalty.home}–{match.penalty.away}
                      </ThemedText>
                    )}
                  </>
                )}
                <View style={[
                  s.statusPill,
                  isLive
                    ? { backgroundColor: '#10B98125', borderColor: '#10B981' }
                    : { backgroundColor: colors.background, borderColor: colors.border }
                ]}>
                  {isLive && <View style={[s.liveDot, { backgroundColor: '#10B981' }]} />}
                  <ThemedText style={[s.statusTxt, isLive && { color: '#10B981' }]}>
                    {isLive ? `LIVE${match.minute ? ` ${match.minute}'` : ''}` : isFT ? 'FT' : match.status}
                  </ThemedText>
                </View>
              </View>

              {/* Away team */}
              <TouchableOpacity
                style={s.team}
                onPress={() => match.awayTeamId && router.push({
                  pathname: '/team/[id]' as any,
                  params: { id: match.awayTeamId, name: match.awayTeamName }
                })}
              >
                {match.awayTeamLogo ? (
                  <Image source={{ uri: match.awayTeamLogo }} style={s.logo} />
                ) : (
                  <View style={[s.initBg, { backgroundColor: colors.background }]}>
                    <ThemedText style={s.initTxt}>{match.awayTeamName.charAt(0)}</ThemedText>
                  </View>
                )}
                <ThemedText style={s.teamName} numberOfLines={2}>{match.awayTeamName}</ThemedText>
              </TouchableOpacity>
            </View>

            {match.stadiumName ? (
              <View style={[s.stadiumRow, { borderTopColor: colors.border + '40' }]}>
                <Ionicons name="location-outline" size={13} color={colors.icon} />
                <ThemedText style={[s.stadiumTxt, { color: colors.icon }]}>{match.stadiumName}</ThemedText>
              </View>
            ) : null}
          </View>

          {/* ── Tabs (finished / live only) ────────────────────────── */}
          {!isScheduled && (
            <>
              <View style={[s.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(['timeline', 'stats'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[s.tabBtn, activeTab === tab && { backgroundColor: colors.primary }]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <ThemedText style={[s.tabTxt, activeTab === tab && { color: '#fff', fontWeight: 'bold' }]}>
                      {tab === 'timeline' ? '⏱ Diễn biến' : '📊 Thống kê'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Timeline */}
              {activeTab === 'timeline' && (
                <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                    <ThemedText style={[s.teamHdr, { color: colors.primary }]} numberOfLines={1}>
                      {match.homeTeamName}
                    </ThemedText>
                    <ThemedText style={[s.teamHdr, { color: '#F59E0B', textAlign: 'right' }]} numberOfLines={1}>
                      {match.awayTeamName}
                    </ThemedText>
                  </View>
                  {events.length === 0 ? (
                    <View style={s.empty}>
                      <Ionicons name="football-outline" size={32} color={colors.icon} />
                      <ThemedText style={{ color: colors.icon, marginTop: 8, fontSize: 13 }}>Chưa có diễn biến</ThemedText>
                    </View>
                  ) : (
                    events.map((ev, i) => {
                      const isHome = ev.team === 'home';
                      return (
                        <View key={i} style={s.evRow}>
                          <View style={s.evSide}>
                            {isHome && <ThemedText style={[s.evName, { color: colors.text }]}>{ev.playerName}</ThemedText>}
                          </View>
                          <View style={s.evCenter}>
                            <ThemedText style={s.evEmoji}>{eventEmoji(ev.type)}</ThemedText>
                            <ThemedText style={[s.evMin, { color: colors.icon }]}>{ev.minute}'</ThemedText>
                          </View>
                          <View style={[s.evSide, { alignItems: 'flex-start' }]}>
                            {!isHome && <ThemedText style={[s.evName, { color: colors.text }]}>{ev.playerName}</ThemedText>}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* Stats */}
              {activeTab === 'stats' && (
                <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <StatBar label="Kiểm soát bóng (%)" homeVal={homePoss} awayVal={awayPoss} homeColor={colors.primary} awayColor="#F59E0B" />
                  <StatBar label="Cú sút" homeVal={homeShots} awayVal={awayShots} homeColor={colors.primary} awayColor="#F59E0B" />
                  <StatBar label="Sút trúng đích" homeVal={homeSOT} awayVal={awaySOT} homeColor={colors.primary} awayColor="#F59E0B" />
                  <StatBar label="Phạt góc" homeVal={homeCorners} awayVal={awayCorners} homeColor={colors.primary} awayColor="#F59E0B" />
                  <StatBar label="Thẻ vàng" homeVal={homeYellow} awayVal={awayYellow} homeColor="#F59E0B" awayColor="#F59E0B" />
                </View>
              )}
            </>
          )}

          {/* ── Upcoming info ───────────────────────────────────────── */}
          {isScheduled && (
            <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[s.sectionTitle, { color: colors.text }]}>Thông tin trận đấu</ThemedText>
              <View style={s.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.icon} />
                <ThemedText style={[s.infoTxt, { color: colors.text }]}>{match.date} · {match.kickoff}</ThemedText>
              </View>
              <View style={s.infoRow}>
                <Ionicons name="trophy-outline" size={16} color={colors.icon} />
                <ThemedText style={[s.infoTxt, { color: colors.text }]}>{match.tournamentName} · {match.stage}</ThemedText>
              </View>
              {match.stadiumName ? (
                <View style={s.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.icon} />
                  <ThemedText style={[s.infoTxt, { color: colors.text }]}>{match.stadiumName}</ThemedText>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  leagueLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  stageLabel: { fontSize: 11, color: '#718096', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 48 },
  heroCard: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16, elevation: 4 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  team: { width: '33%', alignItems: 'center' },
  logo: { width: 64, height: 64, borderRadius: 32, resizeMode: 'contain', marginBottom: 10 },
  initBg: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  initTxt: { fontSize: 26, fontWeight: '800' },
  teamName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  scoreCol: { width: '34%', alignItems: 'center' },
  scoreTxt: { fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  sub: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  stadiumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, paddingTop: 14, marginTop: 14 },
  stadiumTxt: { fontSize: 12, marginLeft: 5, fontWeight: '500' },
  tabBar: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  section: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  teamHdr: { flex: 1, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 20 },
  evRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  evSide: { flex: 1, alignItems: 'flex-end' },
  evCenter: { width: 56, alignItems: 'center' },
  evEmoji: { fontSize: 18 },
  evMin: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  evName: { fontSize: 13, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoTxt: { marginLeft: 10, fontSize: 14 },
});
