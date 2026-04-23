import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Polyline, Circle, Text as SvgText } from "react-native-svg";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 40 - CHART_PADDING * 2;
const CHART_HEIGHT = 200;

interface BudgetDataPoint {
  date: Date;
  spent: number;
}

interface FunctionBudgetData {
  functionId: string;
  functionName: string;
  functionColor: string;
  totalBudget: number;
  totalSpent: number;
  utilization: number;
  topTasks: Array<{
    taskId: string;
    taskTitle: string;
    budget: number;
  }>;
}

function BudgetLineChart({ data }: { data: BudgetDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Ionicons name="trending-up-outline" size={48} color={Colors.border} />
        <Text style={styles.emptyChartText}>No spending data yet</Text>
      </View>
    );
  }

  const maxSpent = Math.max(...data.map(d => d.spent || 0), 1);
  const minSpent = Math.min(...data.map(d => d.spent || 0), 0);
  const range = maxSpent - minSpent || 1;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * CHART_WIDTH : CHART_WIDTH / 2;
    const y = CHART_HEIGHT - ((d.spent - minSpent) / range) * CHART_HEIGHT;
    return { x, y, value: d.spent, date: d.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH + CHART_PADDING * 2} height={CHART_HEIGHT + 40}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = CHART_HEIGHT - ratio * CHART_HEIGHT;
          return (
            <Line
              key={ratio}
              x1={CHART_PADDING}
              y1={y}
              x2={CHART_WIDTH + CHART_PADDING}
              y2={y}
              stroke={Colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = CHART_HEIGHT - ratio * CHART_HEIGHT;
          const value = minSpent + ratio * range;
          return (
            <SvgText
              key={ratio}
              x={0}
              y={y + 4}
              fontSize={10}
              fill={Colors.textMuted}
              fontFamily="Inter_400Regular"
            >
              {value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value.toFixed(0)}`}
            </SvgText>
          );
        })}

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={Colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x + CHART_PADDING}
            cy={p.y}
            r={6}
            fill={Colors.primary}
            stroke={Colors.background}
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels (show first, middle, last) */}
        {points.length > 0 && (
          <>
            <SvgText
              x={CHART_PADDING}
              y={CHART_HEIGHT + 20}
              fontSize={10}
              fill={Colors.textMuted}
              fontFamily="Inter_400Regular"
              textAnchor="middle"
            >
              {points[0].date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </SvgText>
            {points.length > 2 && (
              <SvgText
                x={CHART_WIDTH / 2 + CHART_PADDING}
                y={CHART_HEIGHT + 20}
                fontSize={10}
                fill={Colors.textMuted}
                fontFamily="Inter_400Regular"
                textAnchor="middle"
              >
                {points[Math.floor(points.length / 2)].date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </SvgText>
            )}
            <SvgText
              x={CHART_WIDTH + CHART_PADDING}
              y={CHART_HEIGHT + 20}
              fontSize={10}
              fill={Colors.textMuted}
              fontFamily="Inter_400Regular"
              textAnchor="middle"
            >
              {points[points.length - 1].date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

function FunctionBudgetCard({ data }: { data: FunctionBudgetData }) {
  const isOverBudget = data.utilization > 100;
  const isNearBudget = data.utilization >= 80 && data.utilization <= 100;
  
  return (
    <Animated.View entering={FadeInDown} style={[
      styles.functionBudgetCard,
      isOverBudget && styles.functionBudgetCardOverBudget
    ]}>
      <View style={styles.functionBudgetHeader}>
        <View style={[styles.functionBudgetIcon, { backgroundColor: data.functionColor + "20" }]}>
          <Ionicons name="wallet-outline" size={20} color={data.functionColor} />
        </View>
        <View style={styles.functionBudgetInfo}>
          <Text style={styles.functionBudgetName}>{data.functionName}</Text>
          <Text style={styles.functionBudgetStats}>
            ₹{data.totalSpent.toLocaleString()} / ₹{data.totalBudget.toLocaleString()}
          </Text>
        </View>
        <View style={[
          styles.functionBudgetUtilization,
          {
            backgroundColor: isOverBudget
              ? Colors.error + "15"
              : isNearBudget
                ? Colors.warning + "15"
                : data.functionColor + "15"
          }
        ]}>
          <Text style={[
            styles.functionBudgetUtilizationText,
            {
              color: isOverBudget
                ? Colors.error
                : isNearBudget
                  ? Colors.warning
                  : data.functionColor
            }
          ]}>
            {data.utilization.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.functionBudgetProgressBg}>
        <View
          style={[
            styles.functionBudgetProgressFill,
            {
              width: `${Math.min(data.utilization, 100)}%` as any,
              backgroundColor: isOverBudget
                ? Colors.error
                : isNearBudget
                  ? Colors.warning
                  : data.functionColor
            },
          ]}
        />
      </View>

      {/* Over budget warning */}
      {isOverBudget && (
        <View style={styles.overBudgetWarning}>
          <Ionicons name="warning" size={14} color={Colors.error} />
          <Text style={styles.overBudgetWarningText}>
            Over budget by ₹{(data.totalSpent - data.totalBudget).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Top spending tasks */}
      {data.topTasks.length > 0 && (
        <View style={styles.topTasksSection}>
          <Text style={styles.topTasksTitle}>Top Spending Tasks</Text>
          <View style={styles.topTasksList}>
            {data.topTasks.map((task, index) => (
              <View key={task.taskId} style={styles.topTaskItem}>
                <View style={styles.topTaskRank}>
                  <Text style={styles.topTaskRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topTaskInfo}>
                  <Text style={styles.topTaskTitle} numberOfLines={1}>
                    {task.taskTitle}
                  </Text>
                  <Text style={styles.topTaskBudget}>₹{task.budget.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentEvent, functions, tasks } = useApp();

  const isParticipant = user?.role === "participant";

  // Calculate budget data
  const budgetData = useMemo(() => {
    if (!currentEvent || !functions.length || !tasks.length) {
      return {
        eventBudget: 0,
        totalSpent: 0,
        remaining: 0,
        utilization: 0,
        timeseriesData: [] as BudgetDataPoint[],
        functionBudgets: [] as FunctionBudgetData[],
      };
    }

    const eventBudget = currentEvent.budget || 0;
    const eventFunctions = functions.filter((f) => f.eventId === currentEvent.id);
    const eventTasks = tasks.filter((t) => eventFunctions.some((f) => f.id === t.functionId));

    // Calculate total spent
    const totalSpent = eventTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
    const remaining = eventBudget - totalSpent;
    const utilization = eventBudget > 0 ? (totalSpent / eventBudget) * 100 : 0;

    // Generate timeseries data (group by month - monthly spending, not cumulative)
    const timeseriesData: BudgetDataPoint[] = [];
    const monthlySpending = new Map<string, number>();

    eventTasks.forEach((task) => {
      if (task.createdAt) {
        const date = task.createdAt.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlySpending.set(monthKey, (monthlySpending.get(monthKey) || 0) + (task.budget || 0));
      }
    });

    // Sort months and create data points (monthly spending, not cumulative)
    const sortedMonths = Array.from(monthlySpending.keys()).sort();
    sortedMonths.forEach((monthKey) => {
      const [year, month] = monthKey.split("-");
      timeseriesData.push({
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        spent: monthlySpending.get(monthKey) || 0,
      });
    });

    // If no timeseries data, add current point
    if (timeseriesData.length === 0 && totalSpent > 0) {
      timeseriesData.push({
        date: new Date(),
        spent: totalSpent,
      });
    }

    // Calculate function-wise budgets
    const functionBudgets: FunctionBudgetData[] = eventFunctions.map((fn) => {
      const fnTasks = eventTasks.filter((t) => t.functionId === fn.id);
      const totalSpent = fnTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
      const fnBudget = fn.budget || totalSpent;
      const utilization = fnBudget > 0 ? (totalSpent / fnBudget) * 100 : 0;

      // Get top spending tasks
      const topTasks = fnTasks
        .filter((t) => t.budget && t.budget > 0)
        .sort((a, b) => (b.budget || 0) - (a.budget || 0))
        .slice(0, 3)
        .map((task) => ({
          taskId: task.id,
          taskTitle: task.title,
          budget: task.budget || 0,
        }));

      return {
        functionId: fn.id,
        functionName: fn.name,
        functionColor: fn.color,
        totalBudget: fnBudget,
        totalSpent,
        utilization,
        topTasks,
      };
    });

    // Sort by utilization (highest first), but put over-budget functions at the top
    functionBudgets.sort((a, b) => {
      const aOverBudget = a.utilization > 100;
      const bOverBudget = b.utilization > 100;
      if (aOverBudget && !bOverBudget) return -1;
      if (!aOverBudget && bOverBudget) return 1;
      return b.utilization - a.utilization;
    });

    return {
      eventBudget,
      totalSpent,
      remaining,
      utilization,
      timeseriesData,
      functionBudgets,
    };
  }, [currentEvent, functions, tasks]);

  if (!currentEvent) {
    return (
      <View style={styles.container}>
        <View style={styles.noEvent}>
          <Ionicons name="calendar-outline" size={56} color={Colors.border} />
          <Text style={styles.noEventTitle}>No Event Selected</Text>
          <Text style={styles.noEventSub}>Create a wedding event first</Text>
        </View>
      </View>
    );
  }

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View>
            <Text style={styles.screenTitle}>Budget Analytics</Text>
            <Text style={styles.screenSub}>{currentEvent.brideName} & {currentEvent.groomName}</Text>
          </View>
        </View>

        {/* Budget Overview Card */}
        <Animated.View entering={FadeInDown} style={styles.budgetOverviewCard}>
          <Text style={styles.cardTitle}>Budget Overview</Text>
          <View style={styles.budgetStatsRow}>
            <View style={styles.budgetStatItem}>
              <Text style={styles.budgetStatLabel}>Total Budget</Text>
              <Text style={styles.budgetStatValue}>₹{budgetData.eventBudget.toLocaleString()}</Text>
            </View>
            <View style={styles.budgetStatItem}>
              <Text style={styles.budgetStatLabel}>Total Spent</Text>
              <Text style={[styles.budgetStatValue, { color: Colors.primary }]}>
                ₹{budgetData.totalSpent.toLocaleString()}
              </Text>
            </View>
            <View style={styles.budgetStatItem}>
              <Text style={styles.budgetStatLabel}>Remaining</Text>
              <Text
                style={[
                  styles.budgetStatValue,
                  { color: budgetData.remaining >= 0 ? Colors.success : Colors.error },
                ]}
              >
                ₹{budgetData.remaining.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.budgetUtilizationSection}>
            <View style={styles.budgetUtilizationHeader}>
              <Text style={styles.budgetUtilizationLabel}>Budget Utilization</Text>
              <Text
                style={[
                  styles.budgetUtilizationValue,
                  { color: budgetData.utilization > 90 ? Colors.error : Colors.success },
                ]}
              >
                {budgetData.utilization.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.budgetUtilizationProgressBg}>
              <View
                style={[
                  styles.budgetUtilizationProgressFill,
                  {
                    width: `${Math.min(budgetData.utilization, 100)}%` as any,
                    backgroundColor: budgetData.utilization > 90 ? Colors.error : Colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Timeseries Chart */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Over Time</Text>
            <View style={[styles.chartBadge, { backgroundColor: Colors.primary + "15" }]}>
              <Text style={[styles.chartBadgeText, { color: Colors.primary }]}>Monthly</Text>
            </View>
          </View>
          <BudgetLineChart data={budgetData.timeseriesData} />
        </Animated.View>

        {/* Budget Health Alert */}
        {budgetData.functionBudgets.some(f => f.utilization > 100) && (
          <Animated.View entering={FadeInDown.delay(125).duration(500)} style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={24} color={Colors.error} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Over Budget Alert</Text>
              <Text style={styles.alertText}>
                {budgetData.functionBudgets.filter(f => f.utilization > 100).length} function(s) have exceeded their budget
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Function-wise Budget Breakdown */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Function-wise Budget Breakdown</Text>
            <View style={[styles.countBadge, { backgroundColor: Colors.primary + "15" }]}>
              <Text style={[styles.countBadgeText, { color: Colors.primary }]}>
                {budgetData.functionBudgets.length}
              </Text>
            </View>
          </View>
          {budgetData.functionBudgets.length > 0 ? (
            <View style={styles.functionBudgetList}>
              {budgetData.functionBudgets.map((data) => (
                <FunctionBudgetCard key={data.functionId} data={data} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No budget data yet</Text>
              <Text style={styles.emptySubtitle}>Add tasks with budgets to see breakdown</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text },
  screenSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  budgetOverviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  budgetStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  budgetStatItem: { flex: 1, gap: 4 },
  budgetStatLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted },
  budgetStatValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  budgetUtilizationSection: { gap: 8 },
  budgetUtilizationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetUtilizationLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  budgetUtilizationValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  budgetUtilizationProgressBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  budgetUtilizationProgressFill: { height: "100%", borderRadius: 4 },
  chartSection: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  chartBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  alertCard: {
    backgroundColor: Colors.error + "10",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.error,
  },
  alertText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyChartText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: { paddingTop: 24, gap: 16 },
  functionBudgetList: { gap: 12 },
  functionBudgetCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  functionBudgetCardOverBudget: {
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  functionBudgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  functionBudgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  functionBudgetInfo: { flex: 1, gap: 2 },
  functionBudgetName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  functionBudgetStats: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  functionBudgetUtilization: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  functionBudgetUtilizationText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  functionBudgetProgressBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  functionBudgetProgressFill: { height: "100%", borderRadius: 3 },
  overBudgetWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.error + "10",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overBudgetWarningText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.error,
  },
  topTasksSection: { gap: 8 },
  topTasksTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  topTasksList: { gap: 8 },
  topTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
  },
  topTaskRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  topTaskRankText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  topTaskInfo: { flex: 1, gap: 2 },
  topTaskTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  topTaskBudget: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted },
  emptyState: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textSecondary },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, textAlign: "center" },
  noEvent: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  noEventTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: Colors.text },
  noEventSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
});