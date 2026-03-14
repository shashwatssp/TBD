import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences";
  multiline?: boolean;
}

function Field({ label, value, onChangeText, placeholder, icon, keyboardType = "default", autoCapitalize = "sentences", multiline }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.inputRow, focused && fieldStyles.inputFocused]}>
        <Ionicons name={icon as never} size={18} color={focused ? Colors.primary : Colors.textMuted} style={fieldStyles.icon} />
        <TextInput
          style={[fieldStyles.input, multiline && fieldStyles.multiline]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputFocused: { borderColor: Colors.primary },
  icon: { marginTop: 2 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.text, outlineWidth: 0 } as any,
  multiline: { minHeight: 72, textAlignVertical: "top" } as any,
});

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const { user, createEvent } = useApp();
  const [form, setForm] = useState({
    name: "",
    brideName: "",
    groomName: "",
    weddingCity: "",
    weddingDate: "",
    description: "",
  });

  const isValid = form.brideName.trim() && form.groomName.trim() && form.weddingCity.trim() && form.weddingDate.trim();

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!isValid || !user || loading) return;
    
    // Validate user has an ID
    if (!user.id) {
      console.error("User ID is missing. Please log in again.");
      alert("Session expired. Please log in again.");
      router.replace("/(auth)/login");
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      const eventName = form.name.trim() || `${form.brideName} & ${form.groomName} Wedding`;
      await createEvent(user.id, {
        name: eventName,
        brideName: form.brideName.trim(),
        groomName: form.groomName.trim(),
        weddingCity: form.weddingCity.trim(),
        weddingDate: form.weddingDate.trim(),
        description: form.description.trim(),
      });
      router.dismissAll();
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Error creating event:", e);
      alert("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1A0505", "#3D0C0C"]} style={styles.headerGrad}>
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Wedding Event</Text>
          <Text style={styles.headerSub}>Fill in the details to get started</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Field
              label="Event Name (optional)"
              value={form.name}
              onChangeText={set("name")}
              placeholder="e.g. The Sharma-Kapoor Wedding"
              icon="sparkles-outline"
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Bride's Name *"
                  value={form.brideName}
                  onChangeText={set("brideName")}
                  placeholder="Priya"
                  icon="person-outline"
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Groom's Name *"
                  value={form.groomName}
                  onChangeText={set("groomName")}
                  placeholder="Rahul"
                  icon="person-outline"
                  autoCapitalize="words"
                />
              </View>
            </View>
            <Field
              label="Wedding City *"
              value={form.weddingCity}
              onChangeText={set("weddingCity")}
              placeholder="e.g. Mumbai, Delhi, Jaipur"
              icon="location-outline"
              autoCapitalize="words"
            />
            <Field
              label="Wedding Date *"
              value={form.weddingDate}
              onChangeText={set("weddingDate")}
              placeholder="DD/MM/YYYY"
              icon="calendar-outline"
              keyboardType="default"
            />
            <Field
              label="Description (optional)"
              value={form.description}
              onChangeText={set("description")}
              placeholder="Any special notes about the wedding..."
              icon="document-text-outline"
              multiline
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.noteText}>
              Standard functions like Haldi, Mehendi, and Sangeet will be added automatically.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              (!isValid || loading) && styles.createBtnDisabled,
              { opacity: pressed && !!isValid ? 0.85 : 1 },
            ]}
            onPress={handleCreate}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.createBtnText}>Create Wedding Event</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  headerGrad: { paddingBottom: 28 },
  headerContent: { paddingHorizontal: 20, gap: 8 },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFFFFF" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.55)" },
  scroll: { padding: 20 },
  form: { gap: 18 },
  row: { flexDirection: "row", gap: 12 },
  note: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  noteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
});
