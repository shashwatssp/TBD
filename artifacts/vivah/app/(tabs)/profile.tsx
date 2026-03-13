import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, currentEvent, setCurrentEvent, participants, refreshParticipants } = useApp();
  const isManager = user?.role === "manager";

  useEffect(() => {
    if (currentEvent) {
      refreshParticipants();
    }
  }, [currentEvent?.id]);

  const handleShare = async () => {
    if (!currentEvent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join our wedding event on Vivah! Use code: ${currentEvent.eventCode}\n\n${currentEvent.brideName} & ${currentEvent.groomName} | ${currentEvent.weddingCity}`,
      });
    } catch {}
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            setUser(null);
            router.replace("/");
          },
        },
      ]
    );
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profilePhone}>+91 {user.phone}</Text>
          </View>
        </Animated.View>

        {currentEvent && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Current Event</Text>
            <View style={styles.eventCard}>
              <View style={styles.eventTop}>
                <View style={styles.eventHeart}>
                  <Ionicons name="heart" size={20} color={Colors.primary} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>
                    {currentEvent.brideName} & {currentEvent.groomName}
                  </Text>
                  <Text style={styles.eventDetail}>
                    {currentEvent.weddingCity} · {currentEvent.weddingDate
                      ? new Date(currentEvent.weddingDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric",
                        })
                      : "Date TBD"}
                  </Text>
                </View>
              </View>

              <View style={styles.codeRow}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Event Code</Text>
                  <Text style={styles.codeValue}>{currentEvent.eventCode}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Invite</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {isManager && currentEvent && participants.filter((p) => p.role === "participant").length > 0 && (
          <Animated.View entering={FadeInDown.delay(130).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Team Helpers ({participants.filter((p) => p.role === "participant").length})</Text>
            <View style={styles.menuList}>
              {participants.filter((p) => p.role === "participant").map((p) => (
                <View key={p.id} style={styles.participantItem}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantInitials}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{p.name}</Text>
                    <Text style={styles.participantPhone}>{p.phone}</Text>
                  </View>
                  <View style={styles.helperBadge}>
                    <Text style={styles.helperBadgeText}>Helper</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.menuList}>
            {isManager && (
              <Pressable
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push("/create-event")}
              >
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                <Text style={styles.menuLabel}>Create New Event</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push("/join-event")}
            >
              <Ionicons name="log-in-outline" size={22} color={Colors.primary} />
              <Text style={styles.menuLabel}>Join Event with Code</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text, marginBottom: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF" },
  profileInfo: { gap: 4 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  profilePhone: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
  section: { gap: 12, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  eventCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventTop: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  eventHeart: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.text },
  eventDetail: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  codeBox: { gap: 3 },
  codeLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  codeValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.primary, letterSpacing: 3 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  menuList: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuItemActive: { borderWidth: 1.5, borderColor: Colors.primary + "40" },
  menuLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.text },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  participantInitials: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFFFFF" },
  participantInfo: { flex: 1, gap: 2 },
  participantName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  participantPhone: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  helperBadge: {
    backgroundColor: Colors.gold + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  helperBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.gold },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.error + "15",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.error },
});
