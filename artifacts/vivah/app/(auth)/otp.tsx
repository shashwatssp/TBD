import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(30);
  const refs = useRef<(TextInput | null)[]>([]);
  const shake = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handleChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    setError(false);
    if (val && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = (code: string) => {
    if (code === "000000" || code.length === 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/(auth)/profile", params: { phone } });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const maskedPhone = phone
    ? `+91 ${phone.slice(0, 2)}****${phone.slice(-4)}`
    : "+91 **********";

  return (
    <LinearGradient
      colors={["#1A0505", "#3D0C0C", "#6B1A1A"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: Platform.OS === "web" ? 67 : insets.top + 24,
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="shield-checkmark-outline" size={32} color={Colors.gold} />
            </View>
            <Text style={styles.title}>Verification{"\n"}Code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP sent to{"\n"}
              <Text style={{ color: Colors.gold, fontFamily: "Inter_600SemiBold" }}>{maskedPhone}</Text>
            </Text>
            <Text style={styles.hint}>(Use any 6 digits to continue)</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={[styles.otpRow, shakeStyle]}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { refs.current[i] = r; }}
                style={[
                  styles.otpCell,
                  digit && styles.otpCellFilled,
                  error && styles.otpCellError,
                ]}
                value={digit}
                onChangeText={(v) => handleChange(v.slice(-1), i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </Animated.View>

          {error && (
            <Text style={styles.errorText}>Incorrect OTP. Please try again.</Text>
          )}

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.resend}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend OTP in{" "}
                <Text style={{ color: Colors.gold, fontFamily: "Inter_600SemiBold" }}>
                  {timer}s
                </Text>
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  setTimer(30);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.resendBtn}>Resend OTP</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    gap: 32,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
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
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  otpCell: {
    width: 48,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.07)",
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  otpCellFilled: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(212,160,23,0.12)",
  },
  otpCellError: {
    borderColor: Colors.error,
    backgroundColor: "rgba(231,76,60,0.12)",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.error,
    textAlign: "center",
  },
  resend: { alignItems: "center" },
  timerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
  },
  resendBtn: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.gold,
  },
});
