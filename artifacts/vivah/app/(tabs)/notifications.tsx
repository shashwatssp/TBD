import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { Notification, useApp } from "@/context/AppContext";

const NOTIF_ICONS: Record<Notification["type"], { icon: string; color: string }> = {
  task_assigned: { icon: "person-add-outline", color: Colors.primary },
  deadline: { icon: "alarm-outline", color: Colors.warning },
  status_change: { icon: "refresh-circle-outline", color: Colors.success },
  new_function: { icon: "add-circle-outline", color: "#9B59B6" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifItem({ item, onPress }: { item: Notification; onPress: () => void }) {
  const meta = NOTIF_ICONS[item.type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        !item.read && styles.itemUnread,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
        <Ionicons name={meta.icon as never} size={22} color={meta.color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>{item.title}</Text>
        <Text style={styles.itemMsg}>{item.message}</Text>
        <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead } = useApp();

  const handlePress = (n: Notification) => {
    if (!n.read) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markNotificationRead(n.id);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            {notifications.some((n) => !n.read) && (
              <Text style={styles.unreadCount}>
                {notifications.filter((n) => !n.read).length} unread
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInDown} style={styles.empty}>
            <Ionicons name="notifications-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySub}>You have no notifications yet</Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
            <NotifItem item={item} onPress={() => handlePress(item)} />
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  unreadCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1, gap: 3 },
  itemTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  itemTitleUnread: { fontFamily: "Inter_600SemiBold", color: Colors.text },
  itemMsg: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  itemTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
});
