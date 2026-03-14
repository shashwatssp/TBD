import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { useApp } from "@/context/AppContext";

const FUNCTION_ICONS = [
  { name: "Engagement", icon: "diamond-outline", color: "#9B59B6" },
  { name: "Haldi", icon: "flower-outline", color: "#F39C12" },
  { name: "Mehendi", icon: "leaf-outline", color: "#27AE60" },
  { name: "Sangeet", icon: "musical-notes-outline", color: "#E91E63" },
  { name: "Wedding Ceremony", icon: "heart-outline", color: "#C0392B" },
  { name: "Reception", icon: "star-outline", color: "#D4A017" },
  { name: "Tilak", icon: "sunny-outline", color: "#E67E22" },
  { name: "Sagan", icon: "gift-outline", color: "#3498DB" },
];

export default function FunctionsScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentEvent, functions, tasks, createFunction, addNotification } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(FUNCTION_ICONS[0]);
  const [addingFn, setAddingFn] = useState(false);

  const isParticipant = user?.role === "participant";

  const eventFunctions = useMemo(
    () => functions.filter((f) => f.eventId === currentEvent?.id),
    [functions, currentEvent]
  );

  const handleAdd = async () => {
    if (!currentEvent || !user || addingFn) return;
    setAddingFn(true);
    const name = customName.trim() || selectedIcon.name;
    try {
      await createFunction(currentEvent.id, {
        name,
        date: null,
        description: "",
        icon: selectedIcon.icon,
        color: selectedIcon.color,
      });
      await addNotification({
        userId: user.id,
        title: "New Function Added",
        message: `${name} has been added to the wedding`,
        type: "new_function",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAdd(false);
      setCustomName("");
    } catch (e) {
      console.error(e);
    } finally {
      setAddingFn(false);
    }
  };

  if (!currentEvent) {
    return (
      <View style={styles.noEvent}>
        <Ionicons name="calendar-outline" size={56} color={Colors.border} />
        <Text style={styles.noEventTitle}>No Event Selected</Text>
        <Text style={styles.noEventSub}>Create a wedding event first</Text>
        <Pressable style={styles.createBtn} onPress={() => router.push("/create-event")}>
          <Text style={styles.createBtnText}>Create Event</Text>
        </Pressable>
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
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>Functions</Text>
            <Text style={styles.screenSub}>{currentEvent.brideName} & {currentEvent.groomName}</Text>
          </View>
          {!isParticipant && (
            <Pressable
              style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowAdd(true)}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {eventFunctions.length === 0 ? (
          <Animated.View entering={FadeInDown} style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No functions yet</Text>
            <Text style={styles.emptySub}>Add wedding functions like Haldi, Sangeet, etc.</Text>
            <Pressable style={styles.emptyAddBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyAddText}>Add Function</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.fnGrid}>
            {eventFunctions.map((fn, i) => {
              const fnTasks = tasks.filter((t) => t.functionId === fn.id);
              const completed = fnTasks.filter((t) => t.status === "completed").length;
              const progress = fnTasks.length > 0 ? completed / fnTasks.length : 0;
              return (
                <Animated.View key={fn.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                  <Pressable
                    style={({ pressed }) => [styles.fnCard, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: "/function/[id]", params: { id: fn.id } });
                    }}
                  >
                    <View style={[styles.fnIconWrap, { backgroundColor: fn.color + "20" }]}>
                      <Ionicons name={fn.icon as never} size={28} color={fn.color} />
                    </View>
                    <View style={styles.fnInfo}>
                      <Text style={styles.fnName}>{fn.name}</Text>
                      <Text style={styles.fnTaskCount}>
                        {completed}/{fnTasks.length} tasks done
                      </Text>
                      <View style={styles.fnProgressBg}>
                        <View
                          style={[
                            styles.fnProgressFill,
                            { width: `${progress * 100}%` as any, backgroundColor: fn.color },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={[styles.fnStatusDot, { backgroundColor: progress === 1 && fnTasks.length > 0 ? Colors.success : fn.color }]} />
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.modalTitle}>Add Function</Text>

            <Text style={styles.modalLabel}>Choose a preset</Text>
            <View style={styles.presetGrid}>
              {FUNCTION_ICONS.map((item) => (
                <Pressable
                  key={item.name}
                  style={[
                    styles.presetItem,
                    selectedIcon.name === item.name && { borderColor: item.color, backgroundColor: item.color + "15" },
                  ]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <Ionicons name={item.icon as never} size={22} color={item.color} />
                  <Text style={styles.presetName} numberOfLines={2}>{item.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Custom name (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Tilak Ceremony"
              value={customName}
              onChangeText={setCustomName}
              placeholderTextColor={Colors.textMuted}
            />

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAdd}
            >
              <Text style={styles.modalBtnText}>Add Function</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  screenSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fnGrid: { gap: 12 },
  fnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fnIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  fnInfo: { flex: 1, gap: 4 },
  fnName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  fnTaskCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  fnProgressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden", marginTop: 4 },
  fnProgressFill: { height: "100%", borderRadius: 2 },
  fnStatusDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted, textAlign: "center" },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  noEvent: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  noEventTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: Colors.text },
  noEventSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  createBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  grabber: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  modalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetItem: {
    width: 80,
    alignItems: "center",
    padding: 10,
    gap: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  presetName: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.text, textAlign: "center" },
  modalInput: {
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
  modalBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
});
