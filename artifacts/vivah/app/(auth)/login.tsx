import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSendOTP = () => {
    if (!phone.trim()) {
      Alert.alert("Phone Number Required", "Please enter a phone number");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/(auth)/otp", params: { phone } });
  };

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
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
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="call-outline" size={32} color={Colors.gold} />
            </View>
            <Text style={styles.title}>Enter your{"\n"}phone number</Text>
            <Text style={styles.subtitle}>
              We'll send you a one-time password to verify your number
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
            <View style={[styles.inputWrap, focused && styles.inputFocused]}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>IN</Text>
                <Text style={styles.code}>+91</Text>
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="Mobile number"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                !phone.trim() && styles.sendBtnDisabled,
                { opacity: pressed && phone.trim() ? 0.85 : 1 },
              ]}
              onPress={handleSendOTP}
              disabled={!phone.trim()}
            >
              <Text style={styles.sendBtnText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.terms}>
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28 },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  header: { gap: 16, marginBottom: 48 },
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  flag: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  code: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  terms: { marginTop: "auto", paddingTop: 40 },
  termsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 18,
  },
});
