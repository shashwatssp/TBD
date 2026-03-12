import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser } = useApp();
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);

  const isValid = name.trim().length >= 2;

  const handleContinue = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setUser({ id, name: name.trim(), phone: phone ?? "" });
    router.dismissAll();
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={["#1A0505", "#3D0C0C", "#6B1A1A"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
              onSubmitEditing={handleContinue}
            />

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                !isValid && styles.btnDisabled,
                { opacity: pressed && isValid ? 0.85 : 1 },
              ]}
              onPress={handleContinue}
              disabled={!isValid}
            >
              <Text style={styles.btnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, gap: 48 },
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
});
