import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import local players data
import playersData from "@/assets/data/players.json";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2; // Grid 2 cột
const CARD_HEIGHT = CARD_WIDTH * 1.45; // Tỷ lệ khoảng 3:4.35

// Quốc gia viết tắt (FIFA code) và cờ quốc gia tương ứng
const COUNTRY_MAP: Record<string, { code: string; flag: string }> = {
  Argentina: { code: "ARG", flag: "🇦🇷" },
  Portugal: { code: "POR", flag: "🇵🇹" },
  Norway: { code: "NOR", flag: "🇳🇴" },
  France: { code: "FRA", flag: "🇫🇷" },
  Spain: { code: "ESP", flag: "🇪🇸" },
  England: { code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  Brazil: { code: "BRA", flag: "🇧🇷" },
  Egypt: { code: "EGY", flag: "🇪🇬" },
  Belgium: { code: "BEL", flag: "🇧🇪" },
  Croatia: { code: "CRO", flag: "🇭🇷" },
  Poland: { code: "POL", flag: "🇵🇱" },
  "South Korea": { code: "KOR", flag: "🇰🇷" },
  Germany: { code: "GER", flag: "🇩🇪" },
  Uruguay: { code: "URU", flag: "🇺🇾" },
  Senegal: { code: "SEN", flag: "🇸🇳" },
  Nigeria: { code: "NGA", flag: "🇳🇬" },
  Morocco: { code: "MAR", flag: "🇲🇦" },
  Colombia: { code: "COL", flag: "🇨🇴" },
  Netherlands: { code: "NED", flag: "🇳🇱" },
  Ukraine: { code: "UKR", flag: "🇺🇦" },
  Georgia: { code: "GEO", flag: "🇬🇪" },
  Italy: { code: "ITA", flag: "🇮🇹" },
  Austria: { code: "AUT", flag: "🇦🇹" },
};

// Định dạng ngày sinh từ YYYY-MM-DD sang DD-MM-YYYY
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Trích xuất năm sinh
function getBirthYear(dateStr: string): string {
  if (!dateStr) return "2005";
  const parts = dateStr.split("-");
  if (parts.length > 0) return parts[0];
  return "2005";
}

// Hàm lấy thông số chiều cao, cân nặng giả lập cố định giống ảnh mẫu
function getPlayerStats(name: string, id: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("messi")) {
    return { height: "1,70", weight: "72" };
  }
  if (normalized.includes("ronaldo")) {
    return { height: "1,87", weight: "83" };
  }
  if (normalized.includes("haaland")) {
    return { height: "1,94", weight: "88" };
  }
  if (normalized.includes("mbappe")) {
    return { height: "1,78", weight: "73" };
  }
  if (normalized.includes("yamal")) {
    return { height: "1,80", weight: "72" };
  }
  if (normalized.includes("bellingham")) {
    return { height: "1,86", weight: "75" };
  }
  if (normalized.includes("vinicius") || normalized.includes("vinícius")) {
    return { height: "1,76", weight: "74" };
  }
  if (normalized.includes("salah")) {
    return { height: "1,75", weight: "71" };
  }
  if (normalized.includes("kane")) {
    return { height: "1,88", weight: "86" };
  }
  if (normalized.includes("de bruyne")) {
    return { height: "1,81", weight: "76" };
  }

  // Tạo thông số ngẫu nhiên cố định (deterministic) dựa trên tên cầu thủ
  const hash = (name + id)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const heightNum = 1.7 + (hash % 25) / 100;
  const weightNum = 65 + (hash % 25);
  return {
    height: heightNum.toFixed(2).replace(".", ","),
    weight: `${weightNum}`,
  };
}

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

// Component Thẻ Cầu Thủ
const PlayerCard = ({ player }: { player: Player }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const { code, flag } = useMemo(() => {
    const nation = player.nationality;
    return (
      COUNTRY_MAP[nation] || {
        code: nation.slice(0, 3).toUpperCase(),
        flag: "⚽",
      }
    );
  }, [player.nationality]);

  const stats = useMemo(() => {
    return getPlayerStats(player.name, player.idPlayer);
  }, [player.name, player.idPlayer]);

  const birthYear = useMemo(() => {
    return getBirthYear(player.dateBorn);
  }, [player.dateBorn]);

  const dobStr = useMemo(() => {
    return formatDate(player.dateBorn);
  }, [player.dateBorn]);

  // Phân loại hình ảnh: Ưu tiên ảnh cutout (không nền), nếu không có dùng thumb
  const imageUrl = player.cutout || player.thumb;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push(`/player/playerDetail?id=${player.idPlayer}` as any)
      }
      style={[
        styles.cardContainer,
        { borderColor: isDark ? "#30363D" : "#CFD8DC" },
      ]}
    >
      {/* Background mờ của thẻ để tăng tính chiều sâu */}
      <ImageBackground
        source={{ uri: player.thumb || player.cutout }}
        style={styles.cardBg}
        blurRadius={6}
        imageStyle={{ opacity: 0.15 }}
      >
        {/* Header thẻ: Logo, Flag/Code quốc gia, năm sinh */}
        <View style={styles.cardHeader}>
          {/* Logo Soccer Star nhỏ */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🏆</Text>
          </View>

          {/* Cờ quốc gia & Tên viết tắt */}
          <View style={styles.countryInfo}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{code}</Text>
            </View>
            <Text style={styles.flagEmoji}>{flag}</Text>
          </View>
        </View>

        {/* Hộp năm sinh đặt dưới cờ */}
        <View style={styles.yearContainer}>
          <View style={styles.yearBox}>
            <Text style={styles.yearText}>{birthYear}</Text>
          </View>
        </View>

        {/* Ảnh cutout của cầu thủ nằm ở giữa */}
        <View style={styles.playerImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.playerImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <IconSymbol size={48} name="person.fill" color="#A0AEC0" />
            </View>
          )}
        </View>

        {/* Biểu ngữ trắng uốn lượn ở dưới cùng */}
        <View style={styles.cardFooter}>
          {/* Hộp ngày sinh nhỏ nhắn đè lên giữa biểu ngữ */}
          <View style={styles.dobWrapper}>
            <View style={styles.dobBox}>
              <Text style={styles.dobText}>{dobStr}</Text>
            </View>
          </View>

          {/* Tên cầu thủ viết hoa in đậm */}
          <Text numberOfLines={1} style={styles.playerName}>
            {player.name.toUpperCase()}
          </Text>

          {/* Tên Câu Lạc Bộ / Team */}
          <View style={styles.teamBox}>
            <Text numberOfLines={1} style={styles.teamText}>
              {player.team}
            </Text>
          </View>

          {/* Góc dưới bên phải: Chiều cao, cân nặng và nút tròn xanh */}
          <View style={styles.statsContainer}>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>m</Text>
              <Text style={styles.statValue}>{stats.height}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>kg</Text>
              <Text style={styles.statValue}>{stats.weight}</Text>
            </View>
          </View>

          {/* Huy hiệu tròn xanh lục góc dưới */}
          <View style={styles.greenBadge} />
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

export default function PlayersScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Hiển thị 6 cầu thủ mỗi trang

  // Hàm chuyển chữ có dấu thành không dấu phục vụ tìm kiếm chính xác
  const searchNormalize = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Lọc danh sách cầu thủ dựa trên tìm kiếm
  const filteredPlayers = useMemo(() => {
    const term = searchNormalize(searchText);
    if (!term) return playersData as Player[];

    return (playersData as Player[]).filter((p) => {
      const nameNorm = searchNormalize(p.name);
      const teamNorm = searchNormalize(p.team);
      const positionNorm = searchNormalize(p.position);
      const nationNorm = searchNormalize(p.nationality);

      return (
        nameNorm.includes(term) ||
        teamNorm.includes(term) ||
        positionNorm.includes(term) ||
        nationNorm.includes(term)
      );
    });
  }, [searchText]);

  // Tổng số trang
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage) || 1;

  // Reset trang hiện tại về 1 nếu thay đổi từ khóa tìm kiếm
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  // Dữ liệu cầu thủ trang hiện tại
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlayers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlayers, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.titleText}>
          Siêu Sao Bóng Đá
        </ThemedText>
        <ThemedText style={{ color: "#A0AEC0", marginTop: 4 }}>
          Danh sách cầu thủ
        </ThemedText>
      </View>

      {/* Tìm kiếm */}
      <View
        style={[
          styles.searchSection,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <IconSymbol
          size={20}
          name="paperplane.fill"
          color="#A0AEC0"
          style={{ transform: [{ rotate: "45deg" }] }}
        />
        <TextInput
          placeholder="Tìm kiếm cầu thủ, CLB, vị trí, quốc gia..."
          placeholderTextColor="#718096"
          value={searchText}
          onChangeText={handleSearchChange}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange("")}>
            <IconSymbol size={18} name="chevron.right" color="#A0AEC0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Kết quả lọc */}
      <View style={styles.resultSummary}>
        <ThemedText style={styles.resultText}>
          Tìm thấy{" "}
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            {filteredPlayers.length}
          </Text>{" "}
          siêu sao
        </ThemedText>
      </View>

      {/* Lưới thẻ cầu thủ */}
      <FlatList
        data={paginatedPlayers}
        keyExtractor={(item) => item.idPlayer}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <PlayerCard player={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol size={48} name="person.fill" color="#A0AEC0" />
            <ThemedText style={styles.emptyText}>
              Không tìm thấy cầu thủ nào phù hợp!
            </ThemedText>
          </View>
        }
      />

      {/* Phân trang ở chân trang */}
      {filteredPlayers.length > 0 && (
        <View
          style={[
            styles.paginationContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <TouchableOpacity
            onPress={handlePrevPage}
            disabled={currentPage === 1}
            style={[
              styles.pageButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              currentPage === 1 && { opacity: 0.4 },
            ]}
          >
            <IconSymbol
              size={20}
              name="chevron.left.forwardslash.chevron.right"
              color={colors.text}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
            <Text
              style={[
                styles.pageButtonText,
                { color: colors.text, marginLeft: 4 },
              ]}
            >
              Trước
            </Text>
          </TouchableOpacity>

          <View style={styles.pageIndicator}>
            <ThemedText style={styles.pageText}>
              Trang{" "}
              <Text style={{ fontWeight: "bold", color: colors.primary }}>
                {currentPage}
              </Text>{" "}
              / {totalPages}
            </ThemedText>
          </View>

          <TouchableOpacity
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
            style={[
              styles.pageButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              currentPage === totalPages && { opacity: 0.4 },
            ]}
          >
            <Text
              style={[
                styles.pageButtonText,
                { color: colors.text, marginRight: 4 },
              ]}
            >
              Sau
            </Text>
            <IconSymbol size={20} name="chevron.right" color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "bold",
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 14,
  },
  resultSummary: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: "#A0AEC0",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  rowWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    color: "#A0AEC0",
    fontSize: 15,
  },
  // Style cho Thẻ Cầu Thủ
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardBg: {
    flex: 1,
    padding: 6,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECEFF1",
  },
  logoText: {
    fontSize: 12,
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B0BEC5",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 4,
  },
  codeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#37474F",
  },
  flagEmoji: {
    fontSize: 16,
  },
  yearContainer: {
    alignItems: "flex-end",
    marginTop: -2,
    marginRight: 2,
  },
  yearBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B0BEC5",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  yearText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#37474F",
  },
  playerImageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
    zIndex: 1,
  },
  playerImage: {
    width: "90%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    height: 56,
    backgroundColor: "#ECEFF1",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 6,
    paddingTop: 8,
    alignItems: "center",
    position: "relative",
    zIndex: 2,
    borderWidth: 1,
    borderColor: "#CFD8DC",
  },
  dobWrapper: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    zIndex: 3,
  },
  dobBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B0BEC5",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  dobText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#37474F",
  },
  playerName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 2,
  },
  teamBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#CFD8DC",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    maxWidth: "90%",
  },
  teamText: {
    fontSize: 7,
    color: "#4A5568",
    textAlign: "center",
    fontWeight: "600",
  },
  statsContainer: {
    position: "absolute",
    bottom: 4,
    right: 18,
    alignItems: "flex-start",
  },
  statLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7,
    color: "#718096",
    marginRight: 2,
  },
  statValue: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#2D3748",
  },
  greenBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00C853",
    position: "absolute",
    bottom: 8,
    right: 6,
  },
  // Pagination
  paginationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pageIndicator: {
    alignItems: "center",
  },
  pageText: {
    fontSize: 13,
  },
});
