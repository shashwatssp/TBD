import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
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
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Pending",
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

const SORT_OPTIONS = [
  { label: "Due Date", value: "dueDate" },
  { label: "Priority", value: "priority" },
  { label: "Title", value: "title" },
];

export default function TasksByStatusScreen() {
  const insets = useSafeAreaInsets();
  const { status } = useLocalSearchParams<{ status: TaskStatus }>();
  const { tasks, functions, user, currentEvent, participants, refreshTasks } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isManager = user?.role === "manager";

  // Filter tasks by status and search query
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.status === status);

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        functions.find((f) => f.id === t.functionId)?.name.toLowerCase().includes(query)
      );
    }

    // Sort tasks
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, status, searchQuery, sortBy, functions]);

  const handleTaskPress = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/task/[id]", params: { id: taskId } });
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getDueDateText = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
    const date = new Date(dueDate);
    const today = new Date();
    const isOverdue = date < today;
    const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isOverdue) {
      return `Overdue by ${Math.abs(daysDiff)} days`;
    } else if (daysDiff === 0) {
      return "Due today";
    } else if (daysDiff === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${daysDiff} days`;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!status || !STATUS_LABELS[status]) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Invalid status</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{STATUS_LABELS[status]} Tasks</Text>
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
            placeholder="Search tasks..."
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
            <Text style={styles.statValue}>{filteredTasks.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statItem, { borderLeftColor: STATUS_COLORS[status] }]}>
            <Text style={[styles.statValue, { color: STATUS_COLORS[status] }]}>
              {filteredTasks.length}
            </Text>
            <Text style={styles.statLabel}>{STATUS_LABELS[status]}</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? "No tasks found" : `No ${STATUS_LABELS[status].toLowerCase()} tasks`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? "Try a different search term"
                : isManager
                ? "Go to a function to start adding tasks"
                : "The organiser will assign tasks to you soon"}
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {filteredTasks.map((task, index) => {
              const fn = functions.find((f) => f.id === task.functionId);
              const assignee = participants.find((p) => task.assignedTo?.includes(p.id));
              const dueDateText = getDueDateText(task.dueDate);
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

              return (
                <Animated.View key={task.id} entering={FadeInDown.delay(index * 30)}>
                  <Pressable
                    style={({ pressed }) => [styles.taskCard, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => handleTaskPress(task.id)}
                  >
                    <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <View style={styles.taskTitleRow}>
                          <Text style={styles.taskTitle} numberOfLines={2}>
                            {task.title}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] + "15" }]}>
                            <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
                              {getPriorityLabel(task.priority)}
                            </Text>
                          </View>
                        </View>
                        {fn && (
                          <View style={styles.functionBadge}>
                            <Ionicons name={fn.icon as never} size={12} color={fn.color} />
                            <Text style={[styles.functionName, { color: fn.color }]}>{fn.name}</Text>
                          </View>
                        )}
                      </View>

                      {task.description && (
                        <Text style={styles.taskDescription} numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}

                      <View style={styles.taskFooter}>
                        <View style={styles.taskMeta}>
                          {assignee && (
                            <View style={styles.assigneeInfo}>
                              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                              <Text style={styles.assigneeName}>{assignee.name}</Text>
                            </View>
                          )}
                          <View style={styles.dueDateInfo}>
                            <Ionicons 
                              name="calendar-outline" 
                              size={14} 
                              color={isOverdue ? Colors.error : Colors.textMuted} 
                            />
                            <Text style={[styles.dueDateText, isOverdue && { color: Colors.error }]}>
                              {dueDateText}
                            </Text>
                          </View>
                        </View>
                        {task.budget && (
                          <View style={styles.budgetInfo}>
                            <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.budgetText}>₹{task.budget.toLocaleString()}</Text>
                          </View>
                        )}
                      </View>

                      {task.subtasks.length > 0 && (
                        <View style={styles.subtasksInfo}>
                          <View style={styles.subtasksProgressBg}>
                            <View
                              style={[
                                styles.subtasksProgressFill,
                                {
                                  width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%` as any,
                                  backgroundColor: STATUS_COLORS[status],
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.subtasksText}>
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: Colors.background },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
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
  tasksList: { gap: 12 },
  taskCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  priorityBar: { width: 4, alignSelf: "stretch" },
  taskContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  taskHeader: { gap: 6 },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  functionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  functionName: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  taskDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  assigneeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assigneeName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  dueDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueDateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  budgetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  budgetText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
  },
  subtasksInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtasksProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  subtasksProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  subtasksText: {
    fontFamily: "Inter_500Medium",
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