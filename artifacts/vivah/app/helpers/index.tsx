import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import InviteHelperModal from "@/app/invite-helper";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name" },
  { label: "Name (Z-A)", value: "nameDesc" },
  { label: "Recently Added", value: "recent" },
];

export default function HelpersScreen() {
  const insets = useSafeAreaInsets();
  const { participants, tasks, functions, user, currentEvent, deleteParticipant } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showInviteHelper, setShowInviteHelper] = useState(false);

  // Filter and sort participants
  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter((p) => p.role === "participant");

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query)
      );
    }

    // Sort participants
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "recent":
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        default:
          return 0;
      }
    });

    return filtered;
  }, [participants, searchQuery, sortBy]);

  // Calculate task statistics for each participant
  const participantStats = useMemo(() => {
    return filteredParticipants.map((participant) => {
      const participantTasks = tasks.filter((t) => t.assignedTo.includes(participant.id));
      const completedTasks = participantTasks.filter((t) => t.status === "completed").length;
      const inProgressTasks = participantTasks.filter((t) => t.status === "in_progress").length;
      const pendingTasks = participantTasks.filter((t) => t.status === "not_started").length;
      const totalTasks = participantTasks.length;
      const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

      return {
        participant,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        progress,
      };
    });
  }, [filteredParticipants, tasks]);

  const handleInviteHelper = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInviteHelper(true);
  };

  const handleParticipantPress = (participantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to participant detail view (could be implemented later)
    Alert.alert("Participant Details", "Participant detail view coming soon!");
  };

  const handleDeleteParticipant = (participantId: string, participantName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Helper",
      `Are you sure you want to remove ${participantName} from this event? They will be removed from all assigned tasks.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!currentEvent) return;
            try {
              await deleteParticipant(currentEvent.id, participantId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("Error deleting participant:", error);
              Alert.alert("Error", "Failed to delete helper. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
          ]}
        >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Helpers</Text>
          <View style={styles.headerRight}>
            <Pressable onPress={() => setShowSortMenu(true)} style={styles.sortBtn}>
              <Ionicons name="options-outline" size={20} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search helpers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredParticipants.length}</Text>
            <Text style={styles.statLabel}>Total Helpers</Text>
          </View>
          <View style={[styles.statItem, { borderLeftColor: Colors.primary }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {participantStats.reduce((sum, stat) => sum + stat.totalTasks, 0)}
            </Text>
            <Text style={styles.statLabel}>Assigned Tasks</Text>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredParticipants.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? "No helpers found" : "No helpers yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? "Try a different search term"
                : "Invite helpers to help with wedding planning"}
            </Text>
            {!searchQuery.trim() && (
              <Pressable style={styles.inviteBtn} onPress={handleInviteHelper}>
                <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                <Text style={styles.inviteBtnText}>Invite Helper</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.participantsList}>
            {participantStats.map((stat, index) => (
              <Animated.View key={stat.participant.id} entering={FadeInDown.delay(index * 30)}>
                <Pressable
                  style={({ pressed }) => [styles.participantCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => handleParticipantPress(stat.participant.id)}
                >
                  <View style={styles.participantHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(stat.participant.name)}</Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{stat.participant.name}</Text>
                      {stat.participant.phone && (
                        <Text style={styles.participantPhone}>
                          {stat.participant.phone}
                        </Text>
                      )}
                    </View>
                    {user?.role === "manager" && (
                      <Pressable
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteParticipant(stat.participant.id, stat.participant.name)}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.taskStats}>
                    <View style={styles.taskStatItem}>
                      <Text style={styles.taskStatValue}>{stat.totalTasks}</Text>
                      <Text style={styles.taskStatLabel}>Total</Text>
                    </View>
                    <View style={[styles.taskStatItem, { borderLeftColor: Colors.success }]}>
                      <Text style={[styles.taskStatValue, { color: Colors.success }]}>
                        {stat.completedTasks}
                      </Text>
                      <Text style={styles.taskStatLabel}>Done</Text>
                    </View>
                    <View style={[styles.taskStatItem, { borderLeftColor: Colors.warning }]}>
                      <Text style={[styles.taskStatValue, { color: Colors.warning }]}>
                        {stat.inProgressTasks}
                      </Text>
                      <Text style={styles.taskStatLabel}>In Progress</Text>
                    </View>
                    <View style={[styles.taskStatItem, { borderLeftColor: Colors.textMuted }]}>
                      <Text style={[styles.taskStatValue, { color: Colors.textMuted }]}>
                        {stat.pendingTasks}
                      </Text>
                      <Text style={styles.taskStatLabel}>Pending</Text>
                    </View>
                  </View>

                  {stat.totalTasks > 0 && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressPct}>{Math.round(stat.progress * 100)}%</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View
                          style={[styles.progressFill, { width: `${stat.progress * 100}%` as any }]}
                        />
                      </View>
                    </View>
                  )}

                  {stat.totalTasks > 0 && (
                    <View style={styles.recentTasks}>
                      <Text style={styles.recentTasksLabel}>Recent Tasks</Text>
                      <View style={styles.recentTasksList}>
                        {tasks
                          .filter((t) => t.assignedTo.includes(stat.participant.id))
                          .slice(0, 3)
                          .map((task) => {
                            const fn = functions.find((f) => f.id === task.functionId);
                            return (
                              <View key={task.id} style={styles.recentTaskItem}>
                                <View style={[styles.taskStatusDot, { backgroundColor: task.status === "completed" ? Colors.success : task.status === "in_progress" ? Colors.warning : Colors.textMuted }]} />
                                <Text style={styles.recentTaskTitle} numberOfLines={1}>
                                  {task.title}
                                </Text>
                                {fn && (
                                  <Text style={styles.recentTaskFunction} numberOfLines={1}>
                                    {fn.name}
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                      </View>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>

      {showSortMenu && (
        <Pressable style={styles.overlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.sortMenu, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.menuTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.sortOption, sortBy === option.value && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === option.value && { color: Colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {option.label}
                </Text>
                {sortBy === option.value && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}

      {/* Invite Helper Modal */}
      <InviteHelperModal
        visible={showInviteHelper}
        onClose={() => setShowInviteHelper(false)}
      />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    outlineWidth: 0,
  } as any,
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderLeftWidth: 3,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  scroll: { padding: 20, gap: 12 },
  emptyState: {
    padding: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted, textAlign: "center" },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  inviteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  participantsList: { gap: 12 },
  participantCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  participantInfo: {
    flex: 1,
    gap: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  participantName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  participantEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  participantPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  taskStats: {
    flexDirection: "row",
    gap: 12,
  },
  taskStatItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderLeftWidth: 2,
  },
  taskStatValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  taskStatLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  progressPct: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  recentTasks: {
    gap: 8,
  },
  recentTasksLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textMuted,
  },
  recentTasksList: {
    gap: 6,
  },
  recentTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentTaskTitle: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
  },
  recentTaskFunction: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sortMenu: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  menuTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  sortOptionActive: {
    backgroundColor: Colors.background,
  },
  sortOptionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textSecondary,
  },
});