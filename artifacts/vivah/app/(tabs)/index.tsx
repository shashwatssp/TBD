import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { Task, useApp } from "@/context/AppContext";
import { getTasks } from "@/lib/firebaseService";

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressBg}>
      <Animated.View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as never} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentEvent, functions, tasks } = useApp();
  const [myTasks, setMyTasks] = useState<Task[]>([]);

  const isParticipant = user?.role === "participant";

  useEffect(() => {
    if (isParticipant && user && currentEvent) {
      getTasks({ assignedTo: user.id, eventId: currentEvent.id })
        .then((t) => setMyTasks(t))
        .catch(console.error);
    }
  }, [user?.id, currentEvent?.id, isParticipant]);

  const eventFunctions = useMemo(
    () => functions.filter((f) => f.eventId === currentEvent?.id),
    [functions, currentEvent]
  );

  const eventTasks = useMemo(() => {
    if (isParticipant) return myTasks;
    return tasks.filter((t) => eventFunctions.some((f) => f.id === t.functionId));
  }, [tasks, eventFunctions, isParticipant, myTasks]);

  const totalTasks = eventTasks.length;
  const completedTasks = eventTasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = eventTasks.filter((t) => t.status === "in_progress").length;
  const pendingTasks = eventTasks.filter((t) => t.status === "not_started").length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const upcomingTasks = useMemo(
    () =>
      eventTasks
        .filter((t) => t.status !== "completed" && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 3),
    [eventTasks]
  );

  const weddingDate = currentEvent?.weddingDate ? new Date(currentEvent.weddingDate) : null;
  const today = new Date();
  const daysLeft = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  if (!user) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#1A0505", "#3D0C0C"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Namaste,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            {currentEvent && !isParticipant && (
              <View style={styles.codeChip}>
                <Ionicons name="share-outline" size={14} color={Colors.gold} />
                <Text style={styles.codeText}>{currentEvent.eventCode}</Text>
              </View>
            )}
            {isParticipant && (
              <View style={[styles.codeChip, { backgroundColor: "rgba(212,160,23,0.08)" }]}>
                <Ionicons name="hand-left-outline" size={14} color={Colors.gold} />
                <Text style={styles.codeText}>Helper</Text>
              </View>
            )}
          </View>

          {currentEvent ? (
            <View style={styles.eventCard}>
              <View style={styles.eventTop}>
                <View style={styles.eventNames}>
                  <Text style={styles.eventTitle}>{currentEvent.name}</Text>
                  <Text style={styles.eventSub}>
                    {currentEvent.brideName} & {currentEvent.groomName}
                  </Text>
                  <Text style={[styles.eventSub, { marginTop: 2 }]}>
                    <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.55)" />
                    {"  "}{currentEvent.weddingCity}
                  </Text>
                </View>
                {daysLeft !== null && (
                  <View style={styles.daysChip}>
                    <Text style={styles.daysNum}>{daysLeft}</Text>
                    <Text style={styles.daysLabel}>days</Text>
                  </View>
                )}
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {isParticipant ? "My Task Progress" : "Overall Progress"}
                  </Text>
                  <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
                </View>
                <ProgressBar progress={progress} />
              </View>
            </View>
          ) : (
            <View style={styles.noEventCard}>
              <Text style={styles.noEventText}>No wedding event selected</Text>
              <Pressable
                style={styles.createEventBtn}
                onPress={() => router.push(isParticipant ? "/join-event" : "/create-event")}
              >
                <Text style={styles.createEventBtnText}>
                  {isParticipant ? "Join Wedding" : "Create Wedding"}
                </Text>
              </Pressable>
            </View>
          )}
        </LinearGradient>

        {currentEvent && (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
              <StatCard label="Completed" value={completedTasks} icon="checkmark-circle-outline" color={Colors.success} />
              <StatCard label="In Progress" value={inProgressTasks} icon="time-outline" color={Colors.warning} />
              <StatCard label="Pending" value={pendingTasks} icon="ellipse-outline" color={Colors.textMuted} />
            </Animated.View>

            {!isParticipant && eventFunctions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Functions</Text>
                  <Pressable onPress={() => router.push("/(tabs)/functions")}>
                    <Text style={styles.seeAll}>See all</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.functionsScroll}>
                  {eventFunctions.slice(0, 6).map((fn) => {
                    const fnTasks = tasks.filter((t) => t.functionId === fn.id);
                    const fnCompleted = fnTasks.filter((t) => t.status === "completed").length;
                    const fnProgress = fnTasks.length > 0 ? fnCompleted / fnTasks.length : 0;
                    return (
                      <Pressable
                        key={fn.id}
                        style={({ pressed }) => [styles.fnCard, { borderTopColor: fn.color, opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({ pathname: "/function/[id]", params: { id: fn.id } });
                        }}
                      >
                        <Ionicons name={fn.icon as never} size={24} color={fn.color} />
                        <Text style={styles.fnName}>{fn.name}</Text>
                        <Text style={styles.fnTaskCount}>{fnTasks.length} tasks</Text>
                        <View style={styles.fnProgressBg}>
                          <View style={[styles.fnProgressFill, { width: `${fnProgress * 100}%` as any, backgroundColor: fn.color }]} />
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            )}

            {isParticipant && myTasks.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                <Text style={styles.sectionTitle}>My Tasks</Text>
                <View style={styles.deadlineList}>
                  {myTasks.slice(0, 5).map((task) => {
                    const fn = functions.find((f) => f.id === task.functionId);
                    const statusColors: Record<string, string> = {
                      not_started: Colors.textMuted,
                      in_progress: Colors.warning,
                      completed: Colors.success,
                    };
                    const statusLabels: Record<string, string> = {
                      not_started: "Pending",
                      in_progress: "In Progress",
                      completed: "Done",
                    };
                    return (
                      <Pressable
                        key={task.id}
                        style={({ pressed }) => [styles.deadlineCard, { opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })}
                      >
                        <View style={[styles.priorityBar, { backgroundColor: statusColors[task.status] }]} />
                        <View style={styles.deadlineInfo}>
                          <Text style={styles.deadlineTitle}>{task.title}</Text>
                          <Text style={styles.deadlineFn}>{fn?.name ?? "—"}</Text>
                        </View>
                        <Text style={[styles.dueDate, { color: statusColors[task.status] }]}>
                          {statusLabels[task.status]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {upcomingTasks.length > 0 && !isParticipant && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
                <View style={styles.deadlineList}>
                  {upcomingTasks.map((task) => {
                    const fn = functions.find((f) => f.id === task.functionId);
                    const due = task.dueDate ? new Date(task.dueDate) : null;
                    const isOverdue = due && due < today;
                    return (
                      <Pressable
                        key={task.id}
                        style={({ pressed }) => [styles.deadlineCard, { opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })}
                      >
                        <View style={[styles.priorityBar, { backgroundColor: Colors[`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof Colors] as string }]} />
                        <View style={styles.deadlineInfo}>
                          <Text style={styles.deadlineTitle}>{task.title}</Text>
                          <Text style={styles.deadlineFn}>{fn?.name ?? "—"}</Text>
                        </View>
                        {due && (
                          <Text style={[styles.dueDate, isOverdue && { color: Colors.error }]}>
                            {due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {totalTasks === 0 && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
                <Ionicons name="clipboard-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyTitle}>
                  {isParticipant ? "No tasks assigned yet" : "No tasks yet"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isParticipant
                    ? "The organiser will assign tasks to you soon"
                    : "Go to a function to start adding tasks"}
                </Text>
                {!isParticipant && (
                  <Pressable style={styles.emptyBtn} onPress={() => router.push("/(tabs)/functions")}>
                    <Text style={styles.emptyBtnText}>View Functions</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}
          </>
        )}

        {!currentEvent && (
          <Animated.View entering={FadeInDown.delay(100)} style={[styles.section, { alignItems: "center", paddingTop: 40 }]}>
            <Ionicons name="heart-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>No event yet</Text>
            <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>
              {isParticipant ? "Join a wedding event using the event code" : "Create a new wedding event to get started"}
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push(isParticipant ? "/join-event" : "/create-event")}
            >
              <Text style={styles.emptyBtnText}>{isParticipant ? "Join Event" : "Create Event"}</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {!currentEvent && !isParticipant && (
        <View style={[styles.fab, { bottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 }]}>
          <Pressable
            style={({ pressed }) => [styles.fabBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push("/create-event")}
          >
            <Ionicons name="add" size={28} color="#fff" />
            <Text style={styles.fabText}>Create Event</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {},
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 20 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 16,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.55)" },
  userName: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF" },
  codeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(212,160,23,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
  },
  codeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.gold },
  eventCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  eventTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eventNames: { gap: 4, flex: 1 },
  eventTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#FFFFFF" },
  eventSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.55)" },
  daysChip: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  daysNum: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF" },
  daysLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)" },
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.6)" },
  progressPct: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.gold },
  progressBg: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.gold, borderRadius: 4 },
  noEventCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  noEventText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "rgba(255,255,255,0.6)" },
  createEventBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  createEventBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, textAlign: "center" },
  section: { paddingHorizontal: 20, paddingTop: 24, gap: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.primary },
  functionsScroll: { gap: 12, paddingRight: 20 },
  fnCard: {
    width: 130,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fnName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text, lineHeight: 18 },
  fnTaskCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
  fnProgressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
  fnProgressFill: { height: "100%", borderRadius: 2 },
  deadlineList: { gap: 10 },
  deadlineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  priorityBar: { width: 4, alignSelf: "stretch" },
  deadlineInfo: { flex: 1, padding: 14, gap: 3 },
  deadlineTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  deadlineFn: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  dueDate: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, paddingRight: 14 },
  emptyState: { padding: 40, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted, textAlign: "center" },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  fab: { position: "absolute", left: 20, right: 20 },
  fabBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
});
