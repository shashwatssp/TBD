import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, currentEvent } = useApp();

  useEffect(() => {
    if (user && currentEvent) {
      router.replace("/(tabs)");
    } else if (user) {
      router.replace("/(tabs)");
    }
  }, [user, currentEvent]);

  return (
    <LinearGradient
      colors={["#1A0505", "#3D0C0C", "#6B1A1A"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 40,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32,
          },
        ]}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.logoArea}>
          <View style={styles.iconRing}>
            <Ionicons name="heart" size={44} color={Colors.gold} />
          </View>
          <Text style={styles.appName}>Vivah</Text>
          <Text style={styles.tagline}>Indian Wedding Coordinator</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300).duration(700)} style={styles.decorRow}>
          {["flower-outline", "sparkles-outline", "flower-outline"].map((icon, i) => (
            <Ionicons
              key={i}
              name={icon as never}
              size={18}
              color={Colors.gold}
              style={{ opacity: 0.6 }}
            />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.featureList}>
          {[
            { icon: "calendar-outline", text: "Plan every function & ritual" },
            { icon: "people-outline", text: "Coordinate with family & friends" },
            { icon: "checkmark-circle-outline", text: "Track tasks & subtasks" },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name={f.icon as never} size={20} color={Colors.goldLight} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(700)} style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
  },
  logoArea: { alignItems: "center", gap: 12 },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(212,160,23,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(212,160,23,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  decorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  featureList: { gap: 20 },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
  },
  actions: { gap: 14 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
