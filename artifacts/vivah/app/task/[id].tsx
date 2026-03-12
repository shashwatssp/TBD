import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { TaskPriority, TaskStatus, useApp } from "@/context/AppContext";

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

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, functions, updateTask, addSubtask, toggleSubtask, addNotification, user, participants } = useApp();
  const [showAssign, setShowAssign] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  const isManager = user?.role === "manager";
  const task = tasks.find((t) => t.id === id);
  const fn = task ? functions.find((f) => f.id === task.functionId) : null;

  if (!task || !fn) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Task not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 ? completedSubtasks / task.subtasks.length : 0;

  const handleStatusChange = async (status: TaskStatus) => {
    setSaving(true);
    try {
      await updateTask(task.id, { status });
      if (user) {
        await addNotification({
          userId: user.id,
          title: "Task Updated",
          message: `"${task.title}" is now ${STATUS_LABELS[status]}`,
          type: "status_change",
        });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } finally {
      setSaving(false);
      setShowStatusMenu(false);
    }
  };

  const handleAssign = async (participantId: string, participantName: string) => {
    setSaving(true);
    try {
      await updateTask(task.id, { assignedTo: participantId, assignedToName: participantName });
      await addNotification({
        userId: participantId,
        title: "Task Assigned to You",
        message: `"${task.title}" has been assigned to you in ${fn.name}`,
        type: "task_assigned",
      });
      if (user) {
        await addNotification({
          userId: user.id,
          title: "Task Assigned",
          message: `"${task.title}" assigned to ${participantName}`,
          type: "task_assigned",
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSaving(false);
      setShowAssign(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || saving) return;
    setSaving(true);
    try {
      await addSubtask(task.id, newSubtask.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowAddSubtask(false);
      setNewSubtask("");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    await toggleSubtask(task.id, subtaskId, !completed);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const participantsList = participants.filter((p) => p.role === "participant");

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
          { borderBottomColor: fn.color + "30" },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={[styles.fnBadge, { backgroundColor: fn.color + "18" }]}>
            <Ionicons name={fn.icon as never} size={14} color={fn.color} />
            <Text style={[styles.fnBadgeText, { color: fn.color }]}>{fn.name}</Text>
          </View>
        </View>
        <Text style={styles.taskTitle}>{task.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.statusChip, { backgroundColor: STATUS_COLORS[task.status] + "18", borderColor: STATUS_COLORS[task.status] }]}
            onPress={() => setShowStatusMenu(true)}
          >
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[task.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[task.status] }]}>{STATUS_LABELS[task.status]}</Text>
            <Ionicons name="chevron-down" size={14} color={STATUS_COLORS[task.status]} />
          </Pressable>

          <View style={[styles.priorityChip, { backgroundColor: PRIORITY_COLORS[task.priority] + "18", borderColor: PRIORITY_COLORS[task.priority] }]}>
            <View style={[styles.statusDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
            <Text style={[styles.statusText, { color: PRIORITY_COLORS[task.priority] }]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Text>
          </View>
        </View>

        {task.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descText}>{task.description}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>Assigned to</Text>
            <Text style={styles.detailValue}>{task.assignedToName ?? "Unassigned"}</Text>
            {isManager && (
              <Pressable onPress={() => setShowAssign(true)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </Pressable>
            )}
          </View>
          {task.dueDate && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Due date</Text>
              <Text style={styles.detailValue}>
                {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Subtasks</Text>
              {task.subtasks.length > 0 && (
                <Text style={styles.subtaskCount}>{completedSubtasks}/{task.subtasks.length} done</Text>
              )}
            </View>
            <Pressable style={styles.addSubtaskBtn} onPress={() => setShowAddSubtask(true)}>
              <Ionicons name="add" size={18} color={Colors.primary} />
            </Pressable>
          </View>

          {task.subtasks.length > 0 && (
            <View style={styles.subtaskProgressBg}>
              <View style={[styles.subtaskProgressFill, { width: `${subtaskProgress * 100}%` as any }]} />
            </View>
          )}

          {task.subtasks.length === 0 ? (
            <View style={styles.emptySubtasks}>
              <Text style={styles.emptySubtasksText}>No subtasks yet. Tap + to add one.</Text>
            </View>
          ) : (
            task.subtasks.map((st, i) => (
              <Animated.View key={st.id} entering={FadeInDown.delay(i * 30)}>
                <Pressable
                  style={styles.subtaskItem}
                  onPress={() => handleToggleSubtask(st.id, st.completed)}
                >
                  <View style={[styles.checkbox, st.completed && styles.checkboxDone]}>
                    {st.completed && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.subtaskText, st.completed && styles.subtaskDone]}>
                    {st.title}
                  </Text>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        <View style={styles.actionRow}>
          {isManager && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowAssign(true)}
            >
              <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Reassign</Text>
            </Pressable>
          )}
          {task.status !== "completed" && (
            <Pressable
              style={({ pressed }) => [styles.completeBtn, { flex: isManager ? 2 : 1, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => handleStatusChange("completed")}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Mark Complete</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal visible={showStatusMenu} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowStatusMenu(false)}>
          <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Update Status</Text>
            {(["not_started", "in_progress", "completed"] as const).map((s) => (
              <Pressable
                key={s}
                style={[styles.statusOption, task.status === s && styles.statusOptionActive]}
                onPress={() => handleStatusChange(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s] }]} />
                <Text style={[styles.statusOptionText, task.status === s && { color: Colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {STATUS_LABELS[s]}
                </Text>
                {task.status === s && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAssign} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAssign(false)}>
          <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Assign Task</Text>
            {participantsList.length === 0 ? (
              <Text style={styles.noParticipantsText}>No helpers have joined this event yet. Share the event code with them.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {participantsList.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.participantOption,
                      task.assignedTo === p.id && styles.participantOptionActive,
                    ]}
                    onPress={() => handleAssign(p.id, p.name)}
                    disabled={saving}
                  >
                    <View style={styles.participantAvatar}>
                      <Text style={styles.participantAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.participantName}>{p.name}</Text>
                    {task.assignedTo === p.id && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAddSubtask} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddSubtask(false)}>
          <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Add Subtask</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Compare pricing"
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddSubtask}
              underlineColorAndroid="transparent"
            />
            <Pressable
              style={[styles.sheetBtn, (!newSubtask.trim() || saving) && { opacity: 0.4 }]}
              onPress={handleAddSubtask}
              disabled={!newSubtask.trim() || saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Add</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: Colors.background },
  notFound: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  fnBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fnBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  taskTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text, lineHeight: 30 },
  scroll: { padding: 20, gap: 16 },
  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  subtaskCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addSubtaskBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  descText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, flex: 1 },
  detailValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  subtaskProgressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
  subtaskProgressFill: { height: "100%", backgroundColor: Colors.success, borderRadius: 2 },
  emptySubtasks: { alignItems: "center", paddingVertical: 12 },
  emptySubtasksText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  subtaskItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  subtaskText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text, lineHeight: 20 },
  subtaskDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary + "15",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 14,
  },
  completeBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  statusSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  grabber: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  statusOptionActive: { backgroundColor: Colors.background },
  statusOptionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },
  noParticipantsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingVertical: 8,
  },
  participantOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  participantOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  participantAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  participantName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
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
    outlineWidth: 0,
  } as any,
  sheetBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  sheetBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
});
