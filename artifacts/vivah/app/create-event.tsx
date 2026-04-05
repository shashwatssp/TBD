import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp, WeddingType } from "@/context/AppContext";

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
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
  
  // Set default date for web platform
  const defaultDate = Platform.OS === 'web'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    : '';
  
  const [form, setForm] = useState({
    name: "",
    brideName: "",
    groomName: "",
    weddingCity: "",
    weddingDate: defaultDate,
    weddingType: "north_indian" as WeddingType,
    venue: "",
    location: "",
    budget: "",
    description: "",
  });

  const isValid = form.brideName.trim() && form.groomName.trim() && form.weddingCity.trim() && form.weddingDate.trim() && form.weddingType;

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      set("weddingDate")(formattedDate);
    }
  };

  const handleCreate = async () => {
    if (!isValid || !user || loading) return;
    
    // Validate user has an ID
    if (!user.id) {
      console.error("User ID is missing. Please log in again.");
      Alert.alert("Session Expired", "Please log in again.");
      router.replace("/(auth)/login");
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      const eventName = form.name.trim() || `${form.brideName} & ${form.groomName} Wedding`;
      await createEvent([user.id], {
        name: eventName,
        brideName: form.brideName.trim(),
        groomName: form.groomName.trim(),
        weddingCity: form.weddingCity.trim(),
        weddingDate: form.weddingDate.trim(),
        weddingType: form.weddingType,
        venue: form.venue.trim() || null,
        location: form.location.trim() || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        description: form.description.trim(),
      });
      router.dismissAll();
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Error creating event:", e);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.headerGrad}>
        <View style={[styles.headerContent, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 16 }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Wedding Event</Text>
          <Text style={styles.headerSub}>Fill in the details to get started</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
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
            <View style={fieldStyles.wrap}>
              <Text style={fieldStyles.label}>Wedding Date *</Text>
              {Platform.OS === 'web' ? (
                <View style={[fieldStyles.inputRow, fieldStyles.inputFocused]}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={fieldStyles.icon} />
                  <Text style={fieldStyles.input}>
                    {form.weddingDate ? new Date(form.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Default date set"}
                  </Text>
                </View>
              ) : (
                <>
                  <Pressable
                    style={[fieldStyles.inputRow, form.weddingDate && fieldStyles.inputFocused]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={form.weddingDate ? Colors.primary : Colors.textMuted} style={fieldStyles.icon} />
                    <Text style={[fieldStyles.input, !form.weddingDate && { color: Colors.textMuted }]}>
                      {form.weddingDate ? new Date(form.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Select wedding date"}
                    </Text>
                  </Pressable>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={form.weddingDate ? new Date(form.weddingDate) : new Date()}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                      style={{ width: 120 }}
                    />
                  )}
                </>
              )}
            </View>
            
            <View style={fieldStyles.wrap}>
              <Text style={fieldStyles.label}>Wedding Type *</Text>
              <View style={styles.weddingTypeContainer}>
                {[
                  { value: "north_indian" as WeddingType, label: "North Indian", icon: "🎭" },
                  { value: "south_indian" as WeddingType, label: "South Indian", icon: "🪷" },
                  { value: "bengali" as WeddingType, label: "Bengali", icon: "🪔" },
                  { value: "gujarati" as WeddingType, label: "Gujarati", icon: "🎨" },
                  { value: "punjabi" as WeddingType, label: "Punjabi", icon: "💃" },
                  { value: "marathi" as WeddingType, label: "Marathi", icon: "🌸" },
                  { value: "tamil" as WeddingType, label: "Tamil", icon: "🎪" },
                  { value: "telugu" as WeddingType, label: "Telugu", icon: "🎭" },
                  { value: "kerala" as WeddingType, label: "Kerala", icon: "🌴" },
                  { value: "rajasthani" as WeddingType, label: "Rajasthani", icon: "🏰" },
                  { value: "custom" as WeddingType, label: "Custom", icon: "✨" },
                ].map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      styles.weddingTypeOption,
                      form.weddingType === type.value && styles.weddingTypeSelected,
                    ]}
                    onPress={() => set("weddingType")(type.value)}
                  >
                    <Text style={styles.weddingTypeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.weddingTypeLabel,
                      form.weddingType === type.value && styles.weddingTypeLabelSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Field
              label="Venue (optional)"
              value={form.venue}
              onChangeText={set("venue")}
              placeholder="e.g. Taj Palace, Grand Hyatt"
              icon="business-outline"
              autoCapitalize="words"
            />

            <Field
              label="Location (optional)"
              value={form.location}
              onChangeText={set("location")}
              placeholder="e.g. Connaught Place, New Delhi"
              icon="map-outline"
              autoCapitalize="words"
            />

            <Field
              label="Budget (optional)"
              value={form.budget}
              onChangeText={set("budget")}
              placeholder="e.g. 500000"
              icon="cash-outline"
              keyboardType="number-pad"
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
              Functions will be added automatically based on your wedding type.
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
  weddingTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  weddingTypeOption: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  weddingTypeSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(220, 38, 38, 0.08)",
  },
  weddingTypeIcon: {
    fontSize: 20,
  },
  weddingTypeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  weddingTypeLabelSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
