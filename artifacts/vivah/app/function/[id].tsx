import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
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
import { Task, TaskPriority, TaskStatus, useApp } from "@/context/AppContext";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: Colors.textMuted,
  in_progress: Colors.warning,
  completed: Colors.success,
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: Colors.priorityHigh,
  medium: Colors.priorityMedium,
  low: Colors.priorityLow,
};

const TASK_SUGGESTIONS = [
  "Book photographer",
  "Arrange decorations",
  "Book venue",
  "Arrange transport",
  "Manage guest list",
  "Arrange catering",
  "Book DJ / Band",
  "Order flowers",
  "Print invitations",
  "Arrange makeup artist",
];

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const { updateTask, addNotification } = useApp();
  const completed = task.subtasks.filter((s) => s.completed).length;

  const cycleStatus = () => {
    const cycle: TaskStatus[] = ["not_started", "in_progress", "completed"];
    const next = cycle[(cycle.indexOf(task.status) + 1) % 3];
    updateTask(task.id, { status: next });
    addNotification({
      title: "Task Status Updated",
      message: `"${task.title}" is now ${STATUS_LABELS[next]}`,
      type: "status_change",
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.taskCard, { opacity: pressed ? 0.88 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.priorityStripe, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
      <View style={styles.taskBody}>
        <View style={styles.taskTop}>
          <Text style={[styles.taskTitle, task.status === "completed" && styles.taskTitleDone]} numberOfLines={2}>
            {task.title}
          </Text>
          <Pressable onPress={cycleStatus} style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[task.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[task.status] }]}>
              {STATUS_LABELS[task.status]}
            </Text>
          </Pressable>
        </View>
        <View style={styles.taskMeta}>
          {task.dueDate && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>
                {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </Text>
            </View>
          )}
          {task.assignedToName && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{task.assignedToName}</Text>
            </View>
          )}
          {task.subtasks.length > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="checkmark-circle-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{completed}/{task.subtasks.length}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function FunctionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { functions, tasks, user, createTask, addNotification } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");

  const fn = functions.find((f) => f.id === id);
  const fnTasks = useMemo(
    () => tasks.filter((t) => t.functionId === id),
    [tasks, id]
  );

  const filteredTasks = useMemo(
    () =>
      filterStatus === "all"
        ? fnTasks
        : fnTasks.filter((t) => t.status === filterStatus),
    [fnTasks, filterStatus]
  );

  const completed = fnTasks.filter((t) => t.status === "completed").length;
  const progress = fnTasks.length > 0 ? completed / fnTasks.length : 0;

  const handleAddTask = () => {
    if (!newTitle.trim() || !fn) return;
    createTask({
      functionId: fn.id,
      title: newTitle.trim(),
      description: "",
      dueDate: null,
      assignedTo: user?.id ?? null,
      assignedToName: user?.name ?? null,
      priority,
      status: "not_started",
      subtasks: [],
    });
    addNotification({
      title: "Task Assigned",
      message: `"${newTitle.trim()}" has been created in ${fn.name}`,
      type: "task_assigned",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAdd(false);
    setNewTitle("");
    setPriority("medium");
  };

  if (!fn) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Function not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
          { backgroundColor: fn.color + "18" },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={[styles.fnIcon, { backgroundColor: fn.color + "25" }]}>
            <Ionicons name={fn.icon as never} size={26} color={fn.color} />
          </View>
          <Pressable
            style={styles.addFab}
            onPress={() => setShowAdd(true)}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.fnTitle}>{fn.name}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{completed}/{fnTasks.length} tasks complete</Text>
          <Text style={[styles.progressPct, { color: fn.color }]}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: fn.color }]} />
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["all", "not_started", "in_progress", "completed"] as const).map((s) => (
          <Pressable
            key={s}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
              {s === "all" ? "All" : STATUS_LABELS[s as TaskStatus]}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <Animated.View entering={FadeInDown} style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySub}>
              {filterStatus !== "all" ? "No tasks with this status" : "Tap + to add your first task"}
            </Text>
          </Animated.View>
        ) : (
          filteredTasks.map((task, i) => (
            <Animated.View key={task.id} entering={FadeInDown.delay(i * 50).duration(350)}>
              <TaskCard
                task={task}
                onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Add Task</Text>

            <Text style={styles.sheetLabel}>Task Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Book photographer"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {TASK_SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => setNewTitle(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sheetLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(["high", "medium", "low"] as const).map((p) => (
                <Pressable
                  key={p}
                  style={[
                    styles.priorityChip,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      priority === p && { color: "#FFFFFF" },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addTaskBtn,
                !newTitle.trim() && styles.addTaskBtnDisabled,
                { opacity: pressed && !!newTitle.trim() ? 0.85 : 1 },
              ]}
              onPress={handleAddTask}
              disabled={!newTitle.trim()}
            >
              <Text style={styles.addTaskBtnText}>Add Task</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFound: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  fnIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fnTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  progressPct: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted },
  filterTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 10 },
  taskCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  priorityStripe: { width: 4 },
  taskBody: { flex: 1, padding: 14, gap: 8 },
  taskTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  taskTitle: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, lineHeight: 20 },
  taskTitleDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  taskMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
  empty: { paddingTop: 60, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted, textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  grabber: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  sheetLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  sheetInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  priorityChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textMuted },
  addTaskBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  addTaskBtnDisabled: { opacity: 0.4 },
  addTaskBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
});
