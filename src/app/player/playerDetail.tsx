import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const { width } = Dimensions.get("window");

interface RawPlayer {
  strPlayer?: string | null;
  strPlayerAlternate?: string | null;
  strNationality?: string | null;
  strTeam?: string | null;
  strPosition?: string | null;
  strStatus?: string | null;
  dateBorn?: string | null;
  strBirthLocation?: string | null;
  strHeight?: string | null;
  strWeight?: string | null;
  strSide?: string | null;
  strNumber?: string | null;
  strDescriptionEN?: string | null;
  strRender?: string | null;
  strCutout?: string | null;
  strThumb?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strFacebook?: string | null;
  strTwitter?: string | null;
  strInstagram?: string | null;
  strAgent?: string | null;
  strWage?: string | null;
  idTeam?: string | null;
  idTeamNational?: string | null;
}

// Từ điển chuyển vị trí sang tiếng Việt
const POSITION_MAP: Record<string, string> = {
  Goalkeeper: "Thủ môn",
  Defender: "Hậu vệ",
  "Centre-Back": "Trung vệ",
  "Left-Back": "Hậu vệ cánh trái",
  "Right-Back": "Hậu vệ cánh phải",
  Midfielder: "Tiền vệ",
  "Defensive Midfielder": "Tiền vệ phòng ngự",
  "Defensive Midfield": "Tiền vệ phòng ngự",
  "Defensive midfield": "Tiền vệ phòng ngự",
  "Attacking Midfielder": "Tiền vệ tấn công",
  "Attacking Midfield": "Tiền vệ tấn công",
  "Attacking midfield": "Tiền vệ tấn công",
  "Central Midfielder": "Tiền vệ trung tâm",
  "Central Midfield": "Tiền vệ trung tâm",
  "Central midfield": "Tiền vệ trung tâm",
  Winger: "Tiền đạo cánh",
  "Left Winger": "Tiền đạo cánh trái",
  "Left Wing": "Tiền đạo cánh trái",
  "Left wing": "Tiền đạo cánh trái",
  "Right Winger": "Tiền đạo cánh phải",
  "Right Wing": "Tiền đạo cánh phải",
  "Right wing": "Tiền đạo cánh phải",
  Forward: "Tiền đạo",
  "Second Striker": "Hộ công",
  Striker: "Tiền đạo cắm",
};

const FOOT_MAP: Record<string, string> = {
  Left: "Chân trái",
  Right: "Chân phải",
  Both: "Cả hai chân",
};

const STATUS_MAP: Record<string, string> = {
  Active: "Còn thi đấu",
  Retired: "Đã giải nghệ",
};

const NATIONALITY_MAP: Record<string, string> = {
  Argentina: "Argentina",
  Portugal: "Bồ Đào Nha",
  Norway: "Na Uy",
  France: "Pháp",
  Spain: "Tây Ban Nha",
  England: "Anh",
  Brazil: "Brazil",
  Egypt: "Ai Cập",
  Belgium: "Bỉ",
  Croatia: "Croatia",
  Poland: "Ba Lan",
  "South Korea": "Hàn Quốc",
  Germany: "Đức",
  Uruguay: "Uruguay",
  Senegal: "Senegal",
  Nigeria: "Nigeria",
  Morocco: "Ma-rốc",
  Colombia: "Colombia",
  Netherlands: "Hà Lan",
  Ukraine: "Ukraina",
  Georgia: "Gruzia",
  Italy: "Ý",
  Austria: "Áo",
  Sweden: "Thụy Điển",
  Switzerland: "Thụy Sĩ",
  Denmark: "Đan Mạch",
  Japan: "Nhật Bản",
  Algeria: "Algérie",
};

const NATIONAL_TEAM_ID_MAP: Record<string, string> = {
  Argentina: "134509",
  Portugal: "133908",
  France: "133913",
  England: "133914",
  Brazil: "134496",
  Spain: "133909",
  Germany: "133907",
  Italy: "133910",
  Netherlands: "133905",
  Norway: "136516",
  Belgium: "134515",
  Croatia: "133912",
  Poland: "133901",
  "South Korea": "134517",
  Uruguay: "134504",
  Senegal: "136143",
  Nigeria: "134512",
  Morocco: "136139",
  Colombia: "134501",
  Ukraine: "133915",
  Georgia: "137104",
  Austria: "135986",
  Sweden: "133916",
  Switzerland: "134506",
  Denmark: "133906",
  Japan: "134503",
  Algeria: "134516",
};

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [player, setPlayer] = useState<RawPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  const [clubLogo, setClubLogo] = useState<string | null>(null);
  const [nationalLogo, setNationalLogo] = useState<string | null>(null);

  const fetchPlayerDetails = async () => {
    setLoading(true);
    setError(false);
    setClubLogo(null);
    setNationalLogo(null);
    try {
      const response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/lookupplayer.php?id=${id}`,
      );
      if (!response.ok) {
        throw new Error("Mạng không phản hồi tốt");
      }
      const data = await response.json();
      if (data && data.players && data.players.length > 0) {
        const playerObj = data.players[0] as RawPlayer;
        setPlayer(playerObj);

        if (playerObj.idTeam) {
          fetchClubLogo(playerObj.idTeam);
        }

        const nationalTeamId =
          playerObj.idTeamNational ||
          NATIONAL_TEAM_ID_MAP[playerObj.strNationality || ""];
        if (nationalTeamId) {
          fetchNationalLogo(nationalTeamId);
        }
      } else {
        setPlayer(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết cầu thủ:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubLogo = async (teamId: string) => {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/lookupteam.php?id=${teamId}`,
      );
      const data = await res.json();
      if (data && data.teams && data.teams.length > 0) {
        setClubLogo(data.teams[0].strBadge || null);
      }
    } catch (err) {
      console.error("Lỗi khi tải logo CLB:", err);
    }
  };

  const fetchNationalLogo = async (nationalTeamId: string) => {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/lookupteam.php?id=${nationalTeamId}`,
      );
      const data = await res.json();
      if (data && data.teams && data.teams.length > 0) {
        setNationalLogo(data.teams[0].strBadge || null);
      }
    } catch (err) {
      console.error("Lỗi khi tải logo ĐTQG:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPlayerDetails();
    }
  }, [id]);

  const translatedPosition = useMemo(() => {
    if (!player?.strPosition) return "";
    return POSITION_MAP[player.strPosition] || player.strPosition;
  }, [player?.strPosition]);

  const translatedSide = useMemo(() => {
    if (!player?.strSide) return "";
    return FOOT_MAP[player.strSide] || player.strSide;
  }, [player?.strSide]);

  const translatedStatus = useMemo(() => {
    if (!player?.strStatus) return "";
    return STATUS_MAP[player.strStatus] || player.strStatus;
  }, [player?.strStatus]);

  const translatedNationality = useMemo(() => {
    if (!player?.strNationality) return "";
    return NATIONALITY_MAP[player.strNationality] || player.strNationality;
  }, [player?.strNationality]);

  const formattedBirthDate = useMemo(() => {
    if (!player?.dateBorn) return "";
    const parts = player.dateBorn.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return player.dateBorn;
  }, [player?.dateBorn]);

  const fanartGallery = useMemo(() => {
    if (!player) return [];
    return [
      player.strFanart1,
      player.strFanart2,
      player.strFanart3,
      player.strFanart4,
    ].filter(
      (img): img is string => typeof img === "string" && img.trim() !== "",
    );
  }, [player]);

  const formatSocialUrl = (url?: string | null) => {
    if (!url || url.trim() === "") return "";
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleOpenSocial = async (url?: string | null) => {
    const formattedUrl = formatSocialUrl(url);
    if (formattedUrl) {
      const supported = await Linking.canOpenURL(formattedUrl);
      if (supported) {
        await Linking.openURL(formattedUrl);
      } else {
        console.warn(`Không thể mở URL: ${formattedUrl}`);
      }
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 12 }}>
          Đang tải thông tin siêu sao...
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <FontAwesome name="exclamation-triangle" size={48} color="#E53935" />
        <ThemedText type="subtitle" style={{ marginTop: 16 }}>
          Lỗi kết nối dữ liệu
        </ThemedText>
        <ThemedText
          style={{
            color: "#A0AEC0",
            textAlign: "center",
            marginHorizontal: 32,
            marginTop: 8,
          }}
        >
          Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng của
          bạn.
        </ThemedText>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={fetchPlayerDetails}
        >
          <Text style={styles.actionButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!player) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <FontAwesome name="user-times" size={48} color="#A0AEC0" />
        <ThemedText type="subtitle" style={{ marginTop: 16 }}>
          Không tìm thấy cầu thủ
        </ThemedText>
        <ThemedText style={{ color: "#A0AEC0", marginTop: 8 }}>
          Thông tin cầu thủ này không tồn tại hoặc đã bị xóa.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          onPress={() => router.back()}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mainPlayerImage =
    player.strRender || player.strCutout || player.strThumb || "";

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[
          styles.backBtn,
          {
            backgroundColor: isDark
              ? "rgba(13, 17, 23, 0.75)"
              : "rgba(255, 255, 255, 0.8)",
            borderColor: colors.border,
          },
        ]}
        onPress={() => router.back()}
      >
        <FontAwesome name="chevron-left" size={16} color={colors.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION (Ảnh cutout chồng trên nền mờ hoành tráng) */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: player.strThumb || mainPlayerImage }}
            style={styles.heroBackground}
            blurRadius={10}
          >
            <View style={styles.heroOverlayGradient} />
          </ImageBackground>

          {/* Ảnh cutout của cầu thủ */}
          {mainPlayerImage ? (
            <Image
              source={{ uri: mainPlayerImage }}
              style={styles.heroCutoutImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <FontAwesome name="user" size={80} color="#A0AEC0" />
            </View>
          )}

          {/* Tên & Vị trí phủ lên đáy phần Hero */}
          <View style={styles.heroFooter}>
            <Text style={styles.heroPlayerName}>{player.strPlayer}</Text>
            <View style={styles.heroSubtitleRow}>
              {translatedPosition && (
                <Text style={styles.heroPositionText}>
                  {translatedPosition}
                </Text>
              )}
              {translatedStatus && (
                <Text
                  style={[
                    styles.heroStatusText,
                    {
                      color:
                        player.strStatus?.toLowerCase() === "active"
                          ? "#00E676"
                          : "#FF9100",
                    },
                  ]}
                >
                  • {translatedStatus}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* CONTAINER NỘI DUNG CHÍNH (Có padding để tránh đè lấn) */}
        <View style={styles.mainContent}>
          {/* PHẦN LOGO ĐỘI BÓNG & ĐỘI TUYỂN (Chia 2 cột đẹp mắt) */}
          <View style={styles.logoGridRow}>
            {/* Cột 1: Câu Lạc Bộ */}
            {player.strTeam && (
              <View
                style={[
                  styles.logoCardBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {clubLogo ? (
                  <Image
                    source={{ uri: clubLogo }}
                    style={styles.largeLogoImage}
                  />
                ) : (
                  <View style={styles.fallbackLogoCircle}>
                    <FontAwesome
                      name="shield"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                )}
                <Text style={[styles.logoCardLabel, { color: colors.text }]}>
                  {player.strTeam}
                </Text>
                <Text style={styles.logoCardSubText}>Câu lạc bộ</Text>
              </View>
            )}

            {/* Cột 2: Đội Tuyển Quốc Gia */}
            {translatedNationality && (
              <View
                style={[
                  styles.logoCardBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {nationalLogo ? (
                  <Image
                    source={{ uri: nationalLogo }}
                    style={styles.largeLogoImage}
                  />
                ) : (
                  <View style={styles.fallbackLogoCircle}>
                    <FontAwesome name="globe" size={24} color="#00C853" />
                  </View>
                )}
                <Text style={[styles.logoCardLabel, { color: colors.text }]}>
                  {translatedNationality}
                </Text>
                <Text style={styles.logoCardSubText}>Đội tuyển quốc gia</Text>
              </View>
            )}
          </View>

          {/* CARD: THÔNG TIN CHI TIẾT */}
          <View
            style={[
              styles.detailsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.sectionTitleText}
              >
                Thông tin chi tiết
              </ThemedText>
            </View>

            <View style={styles.statsGrid}>
              {player.strPlayerAlternate && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="user"
                      size={14}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Tên đầy đủ</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {player.strPlayerAlternate}
                  </ThemedText>
                </View>
              )}
              {formattedBirthDate && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="calendar"
                      size={13}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Ngày sinh</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {formattedBirthDate}
                  </ThemedText>
                </View>
              )}
              {player.strBirthLocation && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="map-marker"
                      size={15}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Nơi sinh</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {player.strBirthLocation}
                  </ThemedText>
                </View>
              )}
              {player.strHeight && player.strHeight.trim() !== "" && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="arrows-v"
                      size={14}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Chiều cao</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {player.strHeight}
                  </ThemedText>
                </View>
              )}
              {player.strWeight && player.strWeight.trim() !== "" && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="balance-scale"
                      size={12}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Cân nặng</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {player.strWeight}
                  </ThemedText>
                </View>
              )}
              {translatedSide && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="dot-circle-o"
                      size={14}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Chân thuận</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {translatedSide}
                  </ThemedText>
                </View>
              )}
              {player.strNumber && player.strNumber.trim() !== "" && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="tag"
                      size={14}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Số áo</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {player.strNumber}
                  </ThemedText>
                </View>
              )}
              {player.strAgent && player.strAgent.trim() !== "" && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="briefcase"
                      size={13}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Người đại diện</Text>
                  </View>
                  <ThemedText style={styles.statVal}>
                    {player.strAgent}
                  </ThemedText>
                </View>
              )}
              {player.strWage && player.strWage.trim() !== "" && (
                <View style={styles.statRow}>
                  <View style={styles.labelCol}>
                    <FontAwesome
                      name="money"
                      size={13}
                      color="#718096"
                      style={styles.statIcon}
                    />
                    <Text style={styles.statLabel}>Lương tuần</Text>
                  </View>
                  <ThemedText
                    style={[
                      styles.statVal,
                      { color: colors.success, fontWeight: "bold" },
                    ]}
                  >
                    {player.strWage}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* CARD: TIỂU SỬ CẦU THỦ */}
          {player.strDescriptionEN && (
            <View
              style={[
                styles.bioSection,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.sectionTitleText}
                >
                  Tiểu sử cầu thủ
                </ThemedText>
              </View>

              <Text
                numberOfLines={showFullBio ? undefined : 6}
                style={[
                  styles.bioText,
                  { color: isDark ? "#E2E8F0" : "#4A5568" },
                ]}
              >
                {player.strDescriptionEN}
              </Text>

              <TouchableOpacity
                style={[
                  styles.readMoreBtn,
                  { borderTopColor: isDark ? "#30363D" : "#E2E8F0" },
                ]}
                onPress={() => setShowFullBio(!showFullBio)}
              >
                <Text style={[styles.readMoreText, { color: colors.primary }]}>
                  {showFullBio ? "Thu gọn" : "Xem thêm"}
                </Text>
                <FontAwesome
                  name={showFullBio ? "chevron-up" : "chevron-down"}
                  size={10}
                  color={colors.primary}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* CARD: DANH HIỆU CẦU THỦ */}
          <HonoursSection idPlayer={id} />

          {fanartGallery.length > 0 && (
            <View style={styles.galleryCardContainer}>
              <View style={[styles.sectionHeaderRow, { marginBottom: 12 }]}>
                <FontAwesome
                  name="picture-o"
                  size={15}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.sectionTitleText}
                >
                  Hình ảnh
                </ThemedText>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={fanartGallery}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.galleryImageContainer,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Image source={{ uri: item }} style={styles.galleryImage} />
                  </View>
                )}
              />
            </View>
          )}

          {/* CARD: LIÊN KẾT MẠNG XÃ HỘI */}
          {(player.strFacebook || player.strTwitter || player.strInstagram) && (
            <View
              style={[
                styles.socialSection,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[
                  styles.sectionTitleText,
                  { textAlign: "center", marginBottom: 16 },
                ]}
              >
                Liên kết mạng xã hội
              </ThemedText>

              <View style={styles.socialRow}>
                {player.strFacebook && player.strFacebook.trim() !== "" && (
                  <TouchableOpacity
                    style={[
                      styles.socialIconBtn,
                      { backgroundColor: "#1877F2" },
                    ]}
                    onPress={() => handleOpenSocial(player.strFacebook)}
                  >
                    <FontAwesome name="facebook" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
                {player.strTwitter && player.strTwitter.trim() !== "" && (
                  <TouchableOpacity
                    style={[
                      styles.socialIconBtn,
                      { backgroundColor: "#1DA1F2" },
                    ]}
                    onPress={() => handleOpenSocial(player.strTwitter)}
                  >
                    <FontAwesome name="twitter" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
                {player.strInstagram && player.strInstagram.trim() !== "" && (
                  <TouchableOpacity
                    style={[
                      styles.socialIconBtn,
                      { backgroundColor: "#E1306C" },
                    ]}
                    onPress={() => handleOpenSocial(player.strInstagram)}
                  >
                    <FontAwesome name="instagram" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// ==========================================
// COMPONENT DANH HIỆU CỦA CẦU THỦ (HONOURS)
// ==========================================
interface Honour {
  strHonour?: string | null;
  strSeason?: string | null;
  strTeam?: string | null;
  strTeamBadge?: string | null;
  strHonourLogo?: string | null;
  strHonourTrophy?: string | null;
}

const getSeasonYear = (seasonStr?: string | null) => {
  if (!seasonStr) return 0;
  const match = seasonStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 0;
};

function HonoursSection({ idPlayer }: { idPlayer: string }) {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [honours, setHonours] = useState<Honour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchHonours = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/123/lookuphonours.php?id=${idPlayer}`,
        );
        if (!response.ok) {
          throw new Error("Không thể tải");
        }
        const data = await response.json();
        if (data && data.honours) {
          const seen = new Set<string>();
          const uniqueList = (data.honours as Honour[]).filter((h) => {
            const key = `${h.strHonour || ""}_${h.strSeason || ""}_${h.strTeam || ""}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          uniqueList.sort(
            (a, b) => getSeasonYear(b.strSeason) - getSeasonYear(a.strSeason),
          );

          setHonours(uniqueList);
        } else {
          setHonours([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh hiệu:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (idPlayer) {
      fetchHonours();
    }
  }, [idPlayer]);

  if (loading) {
    return (
      <View
        style={[
          styles.honoursContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <FontAwesome
            name="trophy"
            size={15}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="defaultSemiBold" style={styles.sectionTitleText}>
            Danh hiệu đạt được
          </ThemedText>
        </View>
        <View style={styles.honoursLoadingCenter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[
              styles.honoursStateText,
              { color: colors.text, marginTop: 8 },
            ]}
          >
            Đang tải danh hiệu...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.honoursContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <FontAwesome
            name="trophy"
            size={15}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="defaultSemiBold" style={styles.sectionTitleText}>
            Danh hiệu đạt được
          </ThemedText>
        </View>
        <View style={styles.honoursLoadingCenter}>
          <FontAwesome name="exclamation-circle" size={24} color="#E53935" />
          <Text
            style={[
              styles.honoursStateText,
              { color: "#E53935", marginTop: 8, fontWeight: "bold" },
            ]}
          >
            Không thể tải danh hiệu.
          </Text>
        </View>
      </View>
    );
  }

  if (honours.length === 0) {
    return (
      <View
        style={[
          styles.honoursContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <FontAwesome
            name="trophy"
            size={15}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="defaultSemiBold" style={styles.sectionTitleText}>
            Danh hiệu đạt được
          </ThemedText>
        </View>
        <View style={styles.honoursLoadingCenter}>
          <Text style={[styles.honoursStateText, { color: "#718096" }]}>
            Không có danh hiệu nào.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.honoursWrapper}>
      <View
        style={[
          styles.sectionHeaderRow,
          { paddingHorizontal: 4, marginBottom: 12 },
        ]}
      >
        <FontAwesome
          name="trophy"
          size={15}
          color={colors.primary}
          style={{ marginRight: 8 }}
        />
        <ThemedText type="defaultSemiBold" style={styles.sectionTitleText}>
          Danh hiệu đạt được ({honours.length})
        </ThemedText>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={honours}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const mainImage = item.strHonourTrophy || item.strHonourLogo;

          return (
            <View
              style={[
                styles.honourCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.honourTrophyImageContainer}>
                {mainImage ? (
                  <Image
                    source={{ uri: mainImage }}
                    style={styles.honourTrophyImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.honourTrophyPlaceholder}>
                    <FontAwesome name="trophy" size={32} color="#FFD54F" />
                  </View>
                )}
              </View>

              <Text
                numberOfLines={2}
                style={[styles.honourNameText, { color: colors.text }]}
              >
                🏆 {item.strHonour}
              </Text>

              <Text numberOfLines={1} style={styles.honourSubText}>
                📅 {item.strSeason}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.honourSubText,
                  { fontWeight: "700", marginTop: 1 },
                ]}
              >
                🏟 {item.strTeam}
              </Text>

              <View style={styles.honourBadgesRow}>
                {item.strTeamBadge ? (
                  <Image
                    source={{ uri: item.strTeamBadge }}
                    style={styles.honourMiniBadge}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.honourMiniPlaceholder}>
                    <FontAwesome name="shield" size={10} color="#718096" />
                  </View>
                )}
                {item.strHonourLogo ? (
                  <Image
                    source={{ uri: item.strHonourLogo }}
                    style={styles.honourMiniBadge}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.honourMiniPlaceholder}>
                    <FontAwesome name="globe" size={10} color="#718096" />
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backBtn: {
    position: "absolute",
    top: 45,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  // HERO SECTION STYLING
  heroContainer: {
    height: 290,
    width: "100%",
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: "#000",
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  heroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // Tạo gradient tối đen dần ở đáy
    borderBottomWidth: 150,
    borderBottomColor: "#0D1117",
    opacity: 0.9,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroCutoutImage: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: "100%",
    height: 230,
    zIndex: 2,
  },
  heroAvatarPlaceholder: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  heroFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
    alignItems: "center",
  },
  heroPlayerName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  heroPositionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFD54F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroStatusText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },

  // CONTENT LAYOUT
  mainContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ĐỘI BÓNG & QUỐC GIA GRID
  logoGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logoCardBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  largeLogoImage: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginBottom: 8,
  },
  fallbackLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(113, 128, 150, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  logoCardSubText: {
    fontSize: 10,
    color: "#718096",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // THÔNG TIN CHI TIẾT
  detailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(113, 128, 150, 0.2)",
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: "700",
  },
  statsGrid: {
    width: "100%",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(160, 174, 192, 0.15)",
  },
  labelCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 20,
    marginRight: 6,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13.5,
    color: "#718096",
    fontWeight: "500",
  },
  statVal: {
    fontSize: 13.5,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },

  // TIỂU SỬ CẦU THỦ
  bioSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderTopWidth: 0.5,
    paddingTop: 10,
  },
  readMoreText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  // HÌNH ẢNH FANART
  galleryCardContainer: {
    marginBottom: 16,
  },
  galleryImageContainer: {
    width: width * 0.6,
    height: width * 0.38,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 1,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // LIÊN KẾT MẠNG XÃ HỘI
  socialSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  socialIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // TRẠNG THÁI GIAO DIỆN
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  actionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Honours section styles
  honoursContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    justifyContent: "center",
  },
  honoursLoadingCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  honoursStateText: {
    fontSize: 13,
  },
  honoursWrapper: {
    marginBottom: 20,
  },
  honourCard: {
    width: 155,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
  },
  honourTrophyImageContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  honourTrophyImage: {
    width: "100%",
    height: "100%",
  },
  honourTrophyPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 213, 79, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  honourNameText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    height: 32,
    lineHeight: 16,
    marginBottom: 6,
  },
  honourSubText: {
    fontSize: 10,
    color: "#718096",
    textAlign: "center",
    maxWidth: "95%",
  },
  honourBadgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(113, 128, 150, 0.15)",
    paddingTop: 8,
  },
  honourMiniBadge: {
    width: 20,
    height: 20,
  },
  honourMiniPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(113, 128, 150, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
