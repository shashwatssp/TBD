import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp, UserRole } from "@/context/AppContext";
import { api } from "@/lib/api";

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser } = useApp();
  const [step, setStep] = useState<"name" | "role">("name");
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const isNameValid = name.trim().length >= 2;

  const handleNameContinue = async () => {
    if (!isNameValid || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const user = await api.upsertUser({ phone: phone ?? "", name: name.trim() });
      setCreatedUserId(user.id);
      setStep("role");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    if (!createdUserId || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const updated = await api.updateUser(createdUserId, { role });
      await setUser({ id: updated.id, name: updated.name, phone: updated.phone, role: updated.role });
      router.dismissAll();
      if (role === "manager") {
        router.replace("/create-event");
      } else {
        router.replace("/join-event");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1A0505", "#3D0C0C", "#6B1A1A"]} style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Platform.OS === "web" ? 67 : insets.top + 24,
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {step === "name" ? (
            <Animated.View key="name" entering={FadeInRight.duration(400)} style={styles.stepContainer}>
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                <View style={styles.iconWrap}>
                  <Ionicons name="person-outline" size={32} color={Colors.gold} />
                </View>
                <Text style={styles.title}>What's your{"\n"}name?</Text>
                <Text style={styles.subtitle}>
                  This will be displayed to other wedding participants
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
                <TextInput
                  style={[styles.input, focused && styles.inputFocused]}
                  placeholder="Your full name"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleNameContinue}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    !isNameValid && styles.btnDisabled,
                    { opacity: pressed && isNameValid ? 0.85 : 1 },
                  ]}
                  onPress={handleNameContinue}
                  disabled={!isNameValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </Pressable>
              </Animated.View>
            </Animated.View>
          ) : (
            <Animated.View key="role" entering={FadeInRight.duration(400)} style={styles.stepContainer}>
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                <View style={styles.iconWrap}>
                  <Ionicons name="people-outline" size={32} color={Colors.gold} />
                </View>
                <Text style={styles.title}>What's your{"\n"}role?</Text>
                <Text style={styles.subtitle}>
                  This helps us show you the right features
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.roleCards}>
                <Pressable
                  style={({ pressed }) => [styles.roleCard, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => handleRoleSelect("manager")}
                  disabled={loading}
                >
                  <View style={[styles.roleIconWrap, { backgroundColor: "rgba(192,57,43,0.18)", borderColor: "rgba(192,57,43,0.35)" }]}>
                    <Ionicons name="ribbon-outline" size={32} color={Colors.primary} />
                  </View>
                  <View style={styles.roleTextWrap}>
                    <Text style={styles.roleTitle}>I'm the Organiser</Text>
                    <Text style={styles.roleDesc}>I'm managing the wedding — creating events, assigning tasks, and coordinating everything</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.roleCard, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => handleRoleSelect("participant")}
                  disabled={loading}
                >
                  <View style={[styles.roleIconWrap, { backgroundColor: "rgba(212,160,23,0.18)", borderColor: "rgba(212,160,23,0.35)" }]}>
                    <Ionicons name="hand-left-outline" size={32} color={Colors.gold} />
                  </View>
                  <View style={styles.roleTextWrap}>
                    <Text style={styles.roleTitle}>I'm a Helper</Text>
                    <Text style={styles.roleDesc}>I'm helping out — I'll join with an event code and complete tasks assigned to me</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                </Pressable>

                {loading && (
                  <View style={{ alignItems: "center", paddingTop: 12 }}>
                    <ActivityIndicator color={Colors.gold} />
                  </View>
                )}
              </Animated.View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, gap: 48 },
  stepContainer: { flex: 1, gap: 48 },
  header: { gap: 16 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(212,160,23,0.15)",
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: "#FFFFFF",
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 22,
  },
  form: { gap: 16 },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  inputFocused: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  roleCards: { gap: 16 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
  },
  roleIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextWrap: { flex: 1 },
  roleTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  roleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 19,
  },
});
