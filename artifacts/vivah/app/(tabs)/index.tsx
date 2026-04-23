import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { Task, useApp } from "@/context/AppContext";
import { getTasks } from "@/lib/firebaseService";
import InviteHelperModal from "@/app/invite-helper";
import AddManagerModal from "@/app/add-manager";

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressBg}>
      <Animated.View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
    </View>
  );
}

function StatCard({ label, value, icon, color, onPress }: { label: string; value: number | string; icon: string; color: string; onPress?: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.statCard, { borderTopColor: color, opacity: pressed ? 0.85 : 1 }]} onPress={onPress}>
      <Ionicons name={icon as never} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  console.log("[Dashboard] Component rendered");
  const insets = useSafeAreaInsets();
  const { user, currentEvent, functions, tasks, participants, guests, guestFamilies, refreshParticipants, refreshFunctions, refreshNotifications, isEventManager, canHaveMultipleManagers, getMaxManagers } = useApp();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInviteHelper, setShowInviteHelper] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  console.log("[Dashboard] State:", {
    hasUser: !!user,
    hasCurrentEvent: !!currentEvent,
    participantsCount: participants.length,
    helpersCount: participants.filter(p => p.role === "participant").length
  });

  const isParticipant = user?.role === "participant";
  const isManager = !isParticipant;

  const handleShare = async () => {
    if (!currentEvent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join our wedding event on Vivah! Use code: ${currentEvent.eventCode}\n\n${currentEvent.brideName} & ${currentEvent.groomName} | ${currentEvent.weddingCity}`,
      });
    } catch {}
  };

  const handleRefresh = async () => {
    console.log("[Dashboard] handleRefresh called");
    if (!currentEvent) {
      console.log("[Dashboard] handleRefresh blocked: no current event");
      return;
    }
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      console.log("[Dashboard] Refreshing data...");
      await Promise.all([
        refreshParticipants(),
        refreshFunctions(),
        refreshNotifications(),
      ]);
      console.log("[Dashboard] Data refreshed successfully");
      // Refresh participant's tasks
      if (isParticipant && user) {
        const t = await getTasks({ assignedTo: user.id, eventId: currentEvent.id });
        setMyTasks(t);
      }
    } catch (error) {
      console.error("[Dashboard] Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isParticipant && user && currentEvent) {
      getTasks({ assignedTo: user.id, eventId: currentEvent.id })
        .then((t) => setMyTasks(t))
        .catch(console.error);
    }
  }, [user?.id, currentEvent?.id, isParticipant]);

  // Track screen width for responsive design
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Determine if we need to show overflow menu based on screen width
  const needsOverflowMenu = screenWidth < 380; // Show overflow menu on small screens


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
  
  // Calculate managers from participants (to ensure they stay in sync)
  const managers = useMemo(() => {
    const mgrs = participants.filter(p => p.role === "manager");
    console.log("[Dashboard] Calculating managers:", {
      totalParticipants: participants.length,
      managersCount: mgrs.length,
      managers: mgrs.map(m => ({ id: m.id, name: m.name, role: m.role }))
    });
    return mgrs;
  }, [participants]);
  
  // Count helpers (participants excluding all managers)
  const helpersCount = useMemo(() => {
    const managerIds = managers.map(m => m.id);
    const helpers = participants.filter(p => p.role === "participant" && !managerIds.includes(p.id));
    console.log("[Dashboard] Calculating helpers:", {
      totalParticipants: participants.length,
      managersCount: managers.length,
      helpersCount: helpers.length,
      helpers: helpers.map(h => ({ id: h.id, name: h.name, role: h.role }))
    });
    return helpers.length;
  }, [participants, managers]);
  
  // Guest statistics
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter(g => g.rsvpStatus === 'accepted').length;
  const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined').length;
  const accommodationRequired = guests.filter(g => g.accommodationRequired).length;
  
  // Budget overview
  const eventBudget = currentEvent?.budget || 0;
  const totalTaskBudget = eventTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  const remainingBudget = eventBudget - totalTaskBudget;
  const budgetUtilization = eventBudget > 0 ? (totalTaskBudget / eventBudget) * 100 : 0;

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

  // Generate upcoming milestones
  const upcomingMilestones = useMemo(() => {
    const milestones: Array<{
      id: string;
      title: string;
      description: string;
      date: Date;
      type: "wedding" | "task" | "budget" | "guest";
      icon: string;
      color: string;
    }> = [];

    // Wedding date milestone
    if (weddingDate && daysLeft !== null && daysLeft > 0) {
      milestones.push({
        id: "wedding-date",
        title: "Wedding Day",
        description: `${daysLeft} days remaining`,
        date: weddingDate,
        type: "wedding",
        icon: "heart",
        color: Colors.primary,
      });
    }

    // Important task deadlines (high priority tasks)
    const importantTasks = eventTasks
      .filter((t) => t.status !== "completed" && t.dueDate && t.priority === "high")
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 2);

    importantTasks.forEach((task) => {
      const fn = functions.find((f) => f.id === task.functionId);
      const due = task.dueDate ? new Date(task.dueDate) : null;
      if (due) {
        const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        milestones.push({
          id: `task-${task.id}`,
          title: task.title,
          description: `${fn?.name ?? ""} • ${daysUntilDue > 0 ? `${daysUntilDue} days left` : "Overdue"}`,
          date: due,
          type: "task",
          icon: "calendar",
          color: Colors.warning,
        });
      }
    });

    // Budget milestone (50% utilization)
    if (eventBudget > 0 && budgetUtilization >= 40 && budgetUtilization < 60) {
      milestones.push({
        id: "budget-50",
        title: "Budget Milestone",
        description: `50% budget utilized (${budgetUtilization.toFixed(1)}%)`,
        date: today,
        type: "budget",
        icon: "wallet",
        color: Colors.success,
      });
    }

    // Guest list milestone (100 guests confirmed)
    if (confirmedGuests >= 100 && confirmedGuests < 150) {
      milestones.push({
        id: "guest-100",
        title: "Guest List Milestone",
        description: `${confirmedGuests} guests confirmed`,
        date: today,
        type: "guest",
        icon: "people",
        color: Colors.primary,
      });
    }

    // Sort milestones by date
    return milestones.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4);
  }, [eventTasks, functions, weddingDate, daysLeft, eventBudget, budgetUtilization, confirmedGuests, today]);

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.background}
          />
        }
      >
        <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Namaste,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            <View style={styles.headerActions}>
              {currentEvent && (
                <Pressable
                  style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Ionicons
                    name={isRefreshing ? "refresh" : "refresh-outline"}
                    size={18}
                    color={Colors.gold}
                    style={isRefreshing && styles.spinningIcon}
                  />
                </Pressable>
              )}
              {currentEvent && !isParticipant && (
                <>
                  {!needsOverflowMenu && (
                    <>
                      <Pressable
                        style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
                        onPress={handleShare}
                        accessibilityLabel="Share event code"
                        accessibilityHint={`Share code ${currentEvent.eventCode}`}
                      >
                        <Ionicons name="share-outline" size={18} color={Colors.gold} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
                        onPress={() => {
                          console.log("[Dashboard] Add Helper button pressed");
                          setShowInviteHelper(true);
                        }}
                        accessibilityLabel="Add helper"
                        accessibilityHint="Invite a helper to your event"
                      >
                        <Ionicons name="person-add-outline" size={18} color={Colors.gold} />
                      </Pressable>
                      {canHaveMultipleManagers() && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.iconBtn,
                            { opacity: pressed ? 0.8 : 1 },
                            managers.length >= getMaxManagers() && styles.iconBtnDisabled
                          ]}
                          onPress={() => {
                            console.log("[Dashboard] Add Manager button pressed");
                            if (managers.length < getMaxManagers()) {
                              setShowAddManager(true);
                            } else {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            }
                          }}
                          disabled={managers.length >= getMaxManagers()}
                          accessibilityLabel="Add manager"
                          accessibilityHint={managers.length >= getMaxManagers() ? "Maximum managers reached" : "Add another organizer"}
                        >
                          <Ionicons name="people-outline" size={18} color={Colors.gold} />
                        </Pressable>
                      )}
                    </>
                  )}
                  {needsOverflowMenu && (
                    <Pressable
                      style={({ pressed }) => [styles.overflowBtn, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowOverflowMenu(true);
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={Colors.gold} />
                    </Pressable>
                  )}
                </>
              )}
              {isParticipant && (
                <View style={[styles.iconBtn, { backgroundColor: "rgba(212,160,23,0.08)" }]} accessibilityLabel="Helper role">
                  <Ionicons name="hand-left-outline" size={18} color={Colors.gold} />
                </View>
              )}
            </View>
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
                  {isManager && managers.length > 0 && (
                    <Text style={[styles.eventSub, { marginTop: 2 }]}>
                      <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.55)" />
                      {"  "}{managers.length} organizer{managers.length > 1 ? 's' : ''}
                    </Text>
                  )}
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
              <StatCard
                label="Completed"
                value={completedTasks}
                icon="checkmark-circle-outline"
                color={Colors.success}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/tasks/completed" as any);
                }}
              />
              <StatCard
                label="In Progress"
                value={inProgressTasks}
                icon="time-outline"
                color={Colors.warning}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/tasks/in_progress" as any);
                }}
              />
              <StatCard
                label="Pending"
                value={pendingTasks}
                icon="ellipse-outline"
                color={Colors.textMuted}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/tasks/not_started" as any);
                }}
              />
              {!isParticipant && (
                <StatCard
                  label="Helpers"
                  value={helpersCount}
                  icon="people-outline"
                  color={Colors.primary}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/helpers" as any);
                  }}
                />
              )}
            </Animated.View>

            {!isParticipant && managers.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Organizers</Text>
                  <Pressable onPress={() => router.push("/(tabs)/profile")}>
                    <Text style={styles.seeAll}>Manage</Text>
                  </Pressable>
                </View>
                <View style={styles.managersList}>
                  {managers.map((manager) => (
                    <View key={manager.id} style={styles.managerCard}>
                      <View style={styles.managerAvatar}>
                        <Text style={styles.managerAvatarText}>
                          {manager.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.managerInfo}>
                        <Text style={styles.managerName}>{manager.name}</Text>
                        <Text style={styles.managerRole}>Organizer</Text>
                      </View>
                      {manager.id === user?.id && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>You</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {!isParticipant && totalGuests > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Guest Overview</Text>
                  <Pressable onPress={() => router.push("/(tabs)/guests")}>
                    <Text style={styles.seeAll}>Manage</Text>
                  </Pressable>
                </View>
                <View style={styles.guestStatsGrid}>
                  <View style={[styles.guestStatCard, { backgroundColor: Colors.primary + "15" }]}>
                    <Text style={[styles.guestStatValue, { color: Colors.primary }]}>{totalGuests}</Text>
                    <Text style={styles.guestStatLabel}>Total Guests</Text>
                  </View>
                  <View style={[styles.guestStatCard, { backgroundColor: Colors.success + "15" }]}>
                    <Text style={[styles.guestStatValue, { color: Colors.success }]}>{confirmedGuests}</Text>
                    <Text style={styles.guestStatLabel}>Confirmed</Text>
                  </View>
                  <View style={[styles.guestStatCard, { backgroundColor: Colors.warning + "15" }]}>
                    <Text style={[styles.guestStatValue, { color: Colors.warning }]}>{pendingGuests}</Text>
                    <Text style={styles.guestStatLabel}>Pending</Text>
                  </View>
                  <View style={[styles.guestStatCard, { backgroundColor: Colors.textSecondary + "15" }]}>
                    <Text style={[styles.guestStatValue, { color: Colors.textSecondary }]}>{accommodationRequired}</Text>
                    <Text style={styles.guestStatLabel}>Need Stay</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {!isParticipant && eventBudget > 0 && (
              <Animated.View entering={FadeInDown.delay(175).duration(500)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Budget Overview</Text>
                  <Pressable onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/budget" as any);
                  }}>
                    <Text style={styles.seeAll}>View Details</Text>
                  </Pressable>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/budget" as any);
                  }}
                >
                  <View style={styles.budgetRow}>
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Total Budget</Text>
                      <Text style={styles.budgetValue}>₹{eventBudget.toLocaleString()}</Text>
                    </View>
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Allocated</Text>
                      <Text style={[styles.budgetValue, { color: Colors.primary }]}>₹{totalTaskBudget.toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.budgetRow}>
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Remaining</Text>
                      <Text style={[styles.budgetValue, { color: remainingBudget >= 0 ? Colors.success : Colors.priorityHigh }]}>
                        ₹{remainingBudget.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Utilization</Text>
                      <Text style={[styles.budgetValue, { color: budgetUtilization > 90 ? Colors.priorityHigh : Colors.success }]}>
                        {budgetUtilization.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.budgetProgressBg}>
                    <View style={[styles.budgetProgressFill, { width: `${Math.min(budgetUtilization, 100)}%` as any, backgroundColor: budgetUtilization > 90 ? Colors.priorityHigh : Colors.primary }]} />
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {!isParticipant && eventFunctions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Functions</Text>
                  <Pressable onPress={() => router.push("/(tabs)/functions")}>
                    <Text style={styles.seeAll}>See all</Text>
                  </Pressable>
                </View>
                <View style={styles.functionsGrid}>
                  {eventFunctions.slice(0, 8).map((fn) => {
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
                </View>
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

            {upcomingMilestones.length > 0 && (
              <Animated.View entering={FadeInDown.delay(225).duration(500)} style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Milestones</Text>
                <View style={styles.milestonesList}>
                  {upcomingMilestones.map((milestone) => (
                    <View key={milestone.id} style={styles.milestoneCard}>
                      <View style={[styles.milestoneIcon, { backgroundColor: milestone.color + "20" }]}>
                        <Ionicons name={milestone.icon as never} size={20} color={milestone.color} />
                      </View>
                      <View style={styles.milestoneInfo}>
                        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                        <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                      </View>
                      <View style={styles.milestoneDate}>
                        <Text style={styles.milestoneDateText}>
                          {milestone.type === "wedding"
                            ? milestone.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : milestone.type === "task"
                            ? milestone.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : "Today"}
                        </Text>
                      </View>
                    </View>
                  ))}
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

      {/* Invite Helper Modal */}
      <InviteHelperModal
        visible={showInviteHelper}
        onClose={() => {
          console.log("[Dashboard] InviteHelperModal onClose called");
          setShowInviteHelper(false);
        }}
      />

      {/* Add Manager Modal */}
      <AddManagerModal
        visible={showAddManager}
        onClose={() => {
          console.log("[Dashboard] AddManagerModal onClose called");
          setShowAddManager(false);
        }}
      />

      {/* Overflow Menu Modal */}
      <Modal
        visible={showOverflowMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOverflowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOverflowMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.overflowMenu}>
                <View style={styles.overflowMenuHeader}>
                  <Text style={styles.overflowMenuTitle}>Quick Actions</Text>
                  <Pressable
                    style={styles.closeMenuBtn}
                    onPress={() => setShowOverflowMenu(false)}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </Pressable>
                </View>
                
                <TouchableOpacity
                  style={styles.overflowMenuItem}
                  onPress={() => {
                    setShowOverflowMenu(false);
                    handleShare();
                  }}
                >
                  <View style={styles.overflowMenuItemIcon}>
                    <Ionicons name="share-outline" size={20} color={Colors.gold} />
                  </View>
                  <View style={styles.overflowMenuItemContent}>
                    <Text style={styles.overflowMenuItemText}>Share Event Code</Text>
                    <Text style={styles.overflowMenuItemSubtext}>{currentEvent?.eventCode}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.overflowMenuItem}
                  onPress={() => {
                    setShowOverflowMenu(false);
                    setShowInviteHelper(true);
                  }}
                >
                  <View style={styles.overflowMenuItemIcon}>
                    <Ionicons name="person-add-outline" size={20} color={Colors.gold} />
                  </View>
                  <View style={styles.overflowMenuItemContent}>
                    <Text style={styles.overflowMenuItemText}>Add Helper</Text>
                    <Text style={styles.overflowMenuItemSubtext}>Invite a helper to your event</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>

                {canHaveMultipleManagers() && (
                  <TouchableOpacity
                    style={[
                      styles.overflowMenuItem,
                      managers.length >= getMaxManagers() && styles.overflowMenuItemDisabled
                    ]}
                    onPress={() => {
                      if (managers.length < getMaxManagers()) {
                        setShowOverflowMenu(false);
                        setShowAddManager(true);
                      } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      }
                    }}
                    disabled={managers.length >= getMaxManagers()}
                  >
                    <View style={styles.overflowMenuItemIcon}>
                      <Ionicons name="people-outline" size={20} color={Colors.gold} />
                    </View>
                    <View style={styles.overflowMenuItemContent}>
                      <Text style={styles.overflowMenuItemText}>Add Manager</Text>
                      <Text style={styles.overflowMenuItemSubtext}>
                        {managers.length >= getMaxManagers()
                          ? `Maximum managers (${getMaxManagers()}) reached`
                          : `Add another organizer (${managers.length}/${getMaxManagers()})`
                        }
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={managers.length >= getMaxManagers() ? Colors.textMuted : Colors.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,160,23,0.15)",
    borderRadius: 20,
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
  },
  spinningIcon: {
    transform: [{ rotate: "360deg" }],
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,160,23,0.15)",
    borderRadius: 20,
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
  },
  iconBtnDisabled: {
    opacity: 0.4,
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
  addHelperBtn: {
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
  addManagerBtn: {
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
  addManagerBtnDisabled: {
    opacity: 0.4,
  },
  overflowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,160,23,0.15)",
    borderRadius: 20,
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  overflowMenu: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  overflowMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  overflowMenuTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  closeMenuBtn: {
    padding: 4,
  },
  overflowMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  overflowMenuItemDisabled: {
    opacity: 0.5,
  },
  overflowMenuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  overflowMenuItemContent: {
    flex: 1,
    gap: 2,
  },
  overflowMenuItemText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  overflowMenuItemSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
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
  functionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  fnCard: {
    width: "48%",
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
  guestStatsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  guestStatCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  guestStatValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  guestStatLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  budgetCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  budgetRow: { flexDirection: "row", justifyContent: "space-between" },
  budgetItem: { flex: 1, gap: 4 },
  budgetLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted },
  budgetValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  budgetProgressBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: "hidden" },
  budgetProgressFill: { height: "100%", borderRadius: 4 },
  milestonesList: { gap: 12 },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneInfo: { flex: 1, gap: 4 },
  milestoneTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  milestoneDescription: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  milestoneDate: { alignItems: "flex-end" },
  milestoneDateText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textSecondary },
  managersList: { gap: 10 },
  managerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  managerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  managerAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.primary,
  },
  managerInfo: { flex: 1, gap: 2 },
  managerName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  managerRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  youBadge: {
    backgroundColor: Colors.primary + "15",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  youBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
});
