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
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function JoinEventScreen() {
  const insets = useSafeAreaInsets();
  const { joinEvent } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shake = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const triggerShake = () => {
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleJoin = async () => {
    if (code.length < 6 || loading) return;
    setError("");
    setLoading(true);
    try {
      await joinEvent(code.toUpperCase().trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismissAll();
      router.replace("/(tabs)");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("No event found with this code. Check and try again.");
      triggerShake();
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
          <View style={styles.iconWrap}>
            <Ionicons name="log-in-outline" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.headerTitle}>Join Event</Text>
          <Text style={styles.headerSub}>Enter the 6-letter event code shared by the organizer</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 }]}>
          <Animated.View entering={FadeInDown.delay(100)} style={shakeStyle}>
            <TextInput
              style={[styles.codeInput, error ? { borderColor: Colors.error } : {}]}
              placeholder="Enter event code"
              placeholderTextColor={Colors.textMuted}
              value={code}
              onChangeText={(v) => {
                setCode(v.toUpperCase());
                setError("");
              }}
              autoCapitalize="characters"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
              underlineColorAndroid="transparent"
            />
          </Animated.View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              (code.length < 6 || loading) && styles.joinBtnDisabled,
              { opacity: pressed && code.length === 6 ? 0.85 : 1 },
            ]}
            onPress={handleJoin}
            disabled={code.length < 6 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>Join Event</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  headerGrad: { paddingBottom: 32 },
  headerContent: { paddingHorizontal: 20, gap: 12 },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(212,160,23,0.15)",
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFFFFF" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 20 },
  content: { flex: 1, padding: 24, gap: 16, justifyContent: "center" },
  codeInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingVertical: 20,
    textAlign: "center",
    letterSpacing: 6,
    outlineWidth: 0,
  } as any,
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.error, textAlign: "center" },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  joinBtnDisabled: { opacity: 0.4 },
  joinBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFFFFF" },
});
