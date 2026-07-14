import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFavorites } from "@/hooks/use-favorites";
import { showFavoriteLimitPrompt } from "@/utils/favorite-limit";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

// Import local players data
import playersData from "@/assets/data/players.json";

// ─── Country mapping ──────────────────────────────────────────────────────────
const COUNTRY_MAP: Record<string, { code: string; flag: string }> = {
  Argentina:    { code: "ARG", flag: "🇦🇷" },
  Portugal:     { code: "POR", flag: "🇵🇹" },
  Norway:       { code: "NOR", flag: "🇳🇴" },
  France:       { code: "FRA", flag: "🇫🇷" },
  Spain:        { code: "ESP", flag: "🇪🇸" },
  England:      { code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  Brazil:       { code: "BRA", flag: "🇧🇷" },
  Egypt:        { code: "EGY", flag: "🇪🇬" },
  Belgium:      { code: "BEL", flag: "🇧🇪" },
  Croatia:      { code: "CRO", flag: "🇭🇷" },
  Poland:       { code: "POL", flag: "🇵🇱" },
  "South Korea":{ code: "KOR", flag: "🇰🇷" },
  Germany:      { code: "GER", flag: "🇩🇪" },
  Uruguay:      { code: "URU", flag: "🇺🇾" },
  Senegal:      { code: "SEN", flag: "🇸🇳" },
  Nigeria:      { code: "NGA", flag: "🇳🇬" },
  Morocco:      { code: "MAR", flag: "🇲🇦" },
  Colombia:     { code: "COL", flag: "🇨🇴" },
  Netherlands:  { code: "NED", flag: "🇳🇱" },
  Ukraine:      { code: "UKR", flag: "🇺🇦" },
  Georgia:      { code: "GEO", flag: "🇬🇪" },
  Italy:        { code: "ITA", flag: "🇮🇹" },
  Austria:      { code: "AUT", flag: "🇦🇹" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

function getBirthYear(dateStr: string): string {
  if (!dateStr) return "2005";
  const parts = dateStr.split("-");
  return parts.length > 0 ? parts[0] : "2005";
}

function getPlayerStats(name: string, id: string) {
  const n = name.toLowerCase();
  if (n.includes("messi"))     return { height: "1,70", weight: "72" };
  if (n.includes("ronaldo"))   return { height: "1,87", weight: "83" };
  if (n.includes("haaland"))   return { height: "1,94", weight: "88" };
  if (n.includes("mbappe"))    return { height: "1,78", weight: "73" };
  if (n.includes("yamal"))     return { height: "1,80", weight: "72" };
  if (n.includes("bellingham"))return { height: "1,86", weight: "75" };
  if (n.includes("vinicius") || n.includes("vinícius"))
    return { height: "1,76", weight: "74" };
  if (n.includes("salah"))     return { height: "1,75", weight: "71" };
  if (n.includes("kane"))      return { height: "1,88", weight: "86" };
  if (n.includes("de bruyne")) return { height: "1,81", weight: "76" };
  const hash = (name + id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return {
    height: (1.7 + (hash % 25) / 100).toFixed(2).replace(".", ","),
    weight: `${65 + (hash % 25)}`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Player {
  idPlayer: string;
  idTeam: string;
  name: string;
  team: string;
  sport: string;
  thumb: string;
  cutout: string;
  nationality: string;
  dateBorn: string;
  status: string;
  gender: string;
  position: string;
}

// ─── Responsive helpers ───────────────────────────────────────────────────────
/** Returns the number of grid columns based on current screen width */
function getNumColumns(width: number): number {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

/** Card width given total screen width and number of columns */
function getCardWidth(screenWidth: number, cols: number): number {
  const hPad = 16 * 2;        // listContent paddingHorizontal
  const gap   = 12 * (cols - 1); // gaps between cards
  return (screenWidth - hPad - gap) / cols;
}

// ─── PlayerCard ───────────────────────────────────────────────────────────────
interface PlayerCardProps {
  player: Player;
  cardWidth: number;
  isFav: boolean;
  onToggleFav: (id: string) => Promise<void>;
}

const PlayerCard = ({ player, cardWidth, isFav, onToggleFav }: PlayerCardProps) => {
  const router      = useRouter();
  const colorScheme = useColorScheme() ?? "dark";

  const cardHeight = cardWidth * 1.45;

  const { code, flag } = useMemo(() => {
    return COUNTRY_MAP[player.nationality] ?? {
      code: player.nationality.slice(0, 3).toUpperCase(),
      flag: "⚽",
    };
  }, [player.nationality]);

  const stats     = useMemo(() => getPlayerStats(player.name, player.idPlayer), [player.name, player.idPlayer]);
  const birthYear = useMemo(() => getBirthYear(player.dateBorn), [player.dateBorn]);
  const dobStr    = useMemo(() => formatDate(player.dateBorn), [player.dateBorn]);
  const imageUrl  = player.cutout || player.thumb;

  return (
    <View
      style={[
        styles.cardOuter,
        {
          width: cardWidth,
          borderColor: colorScheme === "dark" ? "#30363D" : "#CFD8DC",
        },
      ]}
    >
      {/* Tappable area: image + top badges */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/player/playerDetail?id=${player.idPlayer}` as any)}
        style={styles.cardImageArea}
      >
        <ImageBackground
          source={{ uri: player.thumb || player.cutout }}
          style={styles.cardBg}
          blurRadius={5}
          imageStyle={{ opacity: 0.18 }}
        >
          {/* Header: flag + country code */}
          <View style={styles.cardHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>🏆</Text>
            </View>
            <View style={styles.countryInfo}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{code}</Text>
              </View>
              <Text style={styles.flagEmoji}>{flag}</Text>
            </View>
          </View>

          {/* Birth year chip */}
          <View style={styles.yearChipWrap}>
            <View style={styles.yearChip}>
              <Text style={styles.yearText}>📅 {birthYear}</Text>
            </View>
          </View>

          {/* Player image */}
          <View style={styles.playerImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.playerImage} resizeMode="contain" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol size={48} name="person.fill" color="#A0AEC0" />
              </View>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* ── Footer: info + heart ── */}
      <View style={styles.cardFooter}>
        {/* DOB pill overlapping top edge */}
        <View style={styles.dobWrapper}>
          <View style={styles.dobBox}>
            <Text style={styles.dobText}>{dobStr}</Text>
          </View>
        </View>

        {/* Player name */}
        <Text numberOfLines={1} style={styles.playerName}>
          {player.name.toUpperCase()}
        </Text>

        {/* Team + position row */}
        <View style={styles.infoRow}>
          <Text numberOfLines={1} style={styles.teamText}>⚽ {player.team}</Text>
          {player.position ? (
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{player.position}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats row: height + weight */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Cao</Text>
            <Text style={styles.statPillValue}>{stats.height}m</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Nặng</Text>
            <Text style={styles.statPillValue}>{stats.weight}kg</Text>
          </View>
        </View>

        {/* ❤️ Heart button — large + prominent */}
        <TouchableOpacity
          style={[
            styles.heartButton,
            isFav
              ? styles.heartButtonActive
              : styles.heartButtonInactive,
          ]}
          onPress={() => void onToggleFav(player.idPlayer)}
          activeOpacity={0.75}
        >
          <Text style={styles.heartButtonIcon}>{isFav ? "❤️" : "🤍"}</Text>
          <Text style={[styles.heartButtonLabel, { color: isFav ? "#E53E3E" : "#718096" }]}>
            {isFav ? "Đã yêu thích" : "Yêu thích"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── PlayersScreen ────────────────────────────────────────────────────────────
export default function PlayersScreen() {
  const router      = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const colors      = Colors[colorScheme];
  const { width }   = useWindowDimensions();

  // Responsive grid
  const numCols  = getNumColumns(width);
  const cardWidth = getCardWidth(width, numCols);

  const [searchText,   setSearchText]   = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = numCols * 3; // 3 rows per page

  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggleFavorite = useCallback(async (playerId: string) => {
    const result = await toggleFavorite(playerId);
    if (result === "limit-reached") {
      showFavoriteLimitPrompt(() => router.push("/profile/vip" as any));
    }
  }, [router, toggleFavorite]);

  const searchNormalize = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredPlayers = useMemo(() => {
    const term = searchNormalize(searchText);
    if (!term) return playersData as Player[];
    return (playersData as Player[]).filter((p) => {
      return (
        searchNormalize(p.name).includes(term)      ||
        searchNormalize(p.team).includes(term)      ||
        searchNormalize(p.position).includes(term)  ||
        searchNormalize(p.nationality).includes(term)
      );
    });
  }, [searchText]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage) || 1;

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlayers.slice(start, start + itemsPerPage);
  }, [filteredPlayers, currentPage, itemsPerPage]);

  // Compute content max-width for wide screens
  const isWide    = width >= 600;
  const hPad      = isWide ? 32 : 20;
  const maxWidth  = 1200;

  return (
    <ThemedView style={styles.container}>
      {/* Centred content wrapper for wide screens */}
      <View style={[styles.contentWrapper, { maxWidth, alignSelf: "center", width: "100%" }]}>

        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: hPad }]}>
          <ThemedText type="title" style={[styles.titleText, { fontSize: isWide ? 30 : 26 }]}>
            Siêu Sao Bóng Đá
          </ThemedText>
          <ThemedText style={{ color: "#A0AEC0", marginTop: 4 }}>
            Danh sách cầu thủ
          </ThemedText>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchSection,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginHorizontal: hPad,
              height: isWide ? 52 : 48,
            },
          ]}
        >
          <IconSymbol size={20} name="paperplane.fill" color="#A0AEC0" style={{ transform: [{ rotate: "45deg" }] }} />
          <TextInput
            placeholder="Tìm kiếm cầu thủ, CLB, vị trí, quốc gia..."
            placeholderTextColor="#718096"
            value={searchText}
            onChangeText={handleSearchChange}
            style={[styles.searchInput, { color: colors.text, fontSize: isWide ? 15 : 14 }]}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")}>
              <IconSymbol size={18} name="chevron.right" color="#A0AEC0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Result count */}
        <View style={[styles.resultSummary, { paddingHorizontal: hPad }]}>
          <ThemedText style={styles.resultText}>
            Tìm thấy{" "}
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              {filteredPlayers.length}
            </Text>{" "}
            siêu sao
          </ThemedText>
        </View>

        {/* Player grid */}
        <FlatList
          key={`grid-${numCols}`}            // force re-render when columns change
          data={paginatedPlayers}
          keyExtractor={(item) => item.idPlayer}
          numColumns={numCols}
          columnWrapperStyle={numCols > 1 ? { gap: 12, marginBottom: 12 } : undefined}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: hPad }]}
          renderItem={({ item }) => (
            <PlayerCard
              player={item}
              cardWidth={cardWidth}
              isFav={isFavorite(item.idPlayer)}
              onToggleFav={handleToggleFavorite}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol size={48} name="person.fill" color="#A0AEC0" />
              <ThemedText style={styles.emptyText}>Không tìm thấy cầu thủ nào phù hợp!</ThemedText>
            </View>
          }
        />

        {/* Pagination */}
        {filteredPlayers.length > 0 && (
          <View style={[styles.paginationContainer, { backgroundColor: colors.background, paddingHorizontal: hPad }]}>
            <TouchableOpacity
              onPress={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              style={[styles.pageButton, { backgroundColor: colors.card, borderColor: colors.border }, currentPage === 1 && { opacity: 0.4 }]}
            >
              <IconSymbol size={16} name="chevron.left" color={colors.text} />
              <Text style={[styles.pageButtonText, { color: colors.text, marginLeft: 4 }]}>Trước</Text>
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <ThemedText style={styles.pageText}>
                Trang{" "}
                <Text style={{ fontWeight: "bold", color: colors.primary }}>{currentPage}</Text>
                {" "}/ {totalPages}
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              style={[styles.pageButton, { backgroundColor: colors.card, borderColor: colors.border }, currentPage === totalPages && { opacity: 0.4 }]}
            >
              <Text style={[styles.pageButtonText, { color: colors.text, marginRight: 4 }]}>Sau</Text>
              <IconSymbol size={16} name="chevron.right" color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, paddingTop: 60 },
  contentWrapper: { flex: 1 },

  header:         { marginBottom: 16 },
  titleText:      { fontWeight: "bold" },

  searchSection:  {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10,
  },
  searchInput:    { flex: 1, height: "100%", marginLeft: 10 },

  resultSummary:  { marginBottom: 10 },
  resultText:     { fontSize: 14, color: "#A0AEC0" },

  listContent:    { paddingBottom: 80 },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText:      { marginTop: 10, color: "#A0AEC0", fontSize: 15 },

  // ── Card outer (column layout: image on top, footer below) ──────────────────
  cardOuter: {
    borderRadius: 14, borderWidth: 1.5, overflow: "hidden",
    backgroundColor: "#FFFFFF", elevation: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  cardImageArea: {
    height: 160,        // fixed image zone height
  },
  cardBg:         { flex: 1, padding: 6, justifyContent: "space-between" },
  cardHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  logoBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center",
    justifyContent: "center", borderWidth: 1, borderColor: "#ECEFF1",
  },
  logoText:   { fontSize: 13 },
  countryInfo:{ flexDirection: "row", alignItems: "center" },
  codeBadge: {
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#B0BEC5",
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginRight: 4,
  },
  codeText:   { fontSize: 9, fontWeight: "bold", color: "#37474F" },
  flagEmoji:  { fontSize: 18 },

  yearChipWrap:{ alignItems: "flex-start", marginTop: 2 },
  yearChip: {
    backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: "#B0BEC5",
  },
  yearText:   { fontSize: 9, fontWeight: "bold", color: "#37474F" },

  // Player image
  playerImageContainer: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
  playerImage:  { width: "85%", height: "100%" },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },

  // ── Footer (info + heart) ─────────────────────────────────────────────────
  cardFooter: {
    backgroundColor: "#ECEFF1",
    borderTopWidth: 1, borderTopColor: "#CFD8DC",
    paddingHorizontal: 10, paddingTop: 14, paddingBottom: 10,
    alignItems: "center",
    position: "relative",
  },

  // DOB pill sits over the top border
  dobWrapper:   { position: "absolute", top: -10, alignSelf: "center", zIndex: 3 },
  dobBox: {
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#B0BEC5",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  dobText: { fontSize: 9, fontWeight: "bold", color: "#37474F" },

  // Name
  playerName: {
    fontSize: 12, fontWeight: "800", color: "#1A202C",
    textAlign: "center", marginBottom: 4, letterSpacing: 0.3,
  },

  // Team + position
  infoRow:      { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 4, marginBottom: 6 },
  teamText:     { fontSize: 10, color: "#4A5568", fontWeight: "600" },
  positionBadge:{ backgroundColor: "#2F80ED20", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  positionText: { fontSize: 9, color: "#2F80ED", fontWeight: "700" },

  // Stats row
  statsRow:     { flexDirection: "row", gap: 8, marginBottom: 10 },
  statPill: {
    flexDirection: "row", alignItems: "baseline", gap: 2,
    backgroundColor: "#FFFFFF", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: "#CFD8DC",
  },
  statPillLabel:{ fontSize: 9, color: "#718096" },
  statPillValue:{ fontSize: 10, fontWeight: "800", color: "#2D3748" },

  // ❤️ Heart button — full-width pill
  heartButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    width: "100%", height: 34, borderRadius: 17,
    borderWidth: 1.5, gap: 6,
  },
  heartButtonActive: {
    backgroundColor: "#FFF5F5", borderColor: "#FC8181",
  },
  heartButtonInactive: {
    backgroundColor: "#FFFFFF", borderColor: "#CBD5E0",
  },
  heartButtonIcon:  { fontSize: 18 },
  heartButtonLabel: { fontSize: 12, fontWeight: "700" },

  // Pagination
  paginationContainer: {
    height: 60, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)",
  },
  pageButton: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },
  pageButtonText: { fontSize: 12, fontWeight: "600" },
  pageIndicator:  { alignItems: "center" },
  pageText:       { fontSize: 13 },
});
