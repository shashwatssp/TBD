import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface AddManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddManagerModal({ visible, onClose }: AddManagerModalProps) {
  console.log("[AddManager] Modal rendered", { visible, hasOnClose: typeof onClose === 'function' });
  
  const insets = useSafeAreaInsets();
  const { currentEvent, user, addParticipant, refreshParticipants, getMaxManagers } = useApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [managerName, setManagerName] = useState("");
  const [adding, setAdding] = useState(false);
  
  const maxManagers = getMaxManagers();
  
  console.log("[AddManager] Context state:", {
    hasCurrentEvent: !!currentEvent,
    hasUser: !!user,
    currentEventId: currentEvent?.id,
    userId: user?.id,
    userName: user?.name,
    maxManagers
  });
  
  // Defensive check for onClose
  const safeOnClose = React.useCallback(() => {
    console.log("[AddManager] safeOnClose called", { hasOnClose: typeof onClose === 'function' });
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.error("[AddManager] ERROR: onClose is not a function!", onClose);
    }
  }, [onClose]);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    return phone.replace(/\D/g, "");
  };

  const handleAddManager = async () => {
    console.log("[AddManager] handleAddManager called");
    if (!currentEvent || !user) {
      console.error("[AddManager] Error: No current event or user", { hasCurrentEvent: !!currentEvent, hasUser: !!user });
      Alert.alert("Error", "Please create an event first");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!formattedPhone || formattedPhone.length === 0) {
      console.error("[AddManager] Error: No phone number provided");
      Alert.alert("Phone Number Required", "Please enter the manager's mobile number");
      return;
    }

    if (!managerName.trim()) {
      console.error("[AddManager] Error: No manager name provided");
      Alert.alert("Name Required", "Please enter the manager's name");
      return;
    }

    // Check if we've reached the maximum number of managers
    const currentManagersCount = currentEvent.managerIds?.length || 0;
    if (currentManagersCount >= maxManagers) {
      console.error("[AddManager] Error: Maximum managers reached", {
        currentManagersCount,
        maxManagers
      });
      Alert.alert(
        "Maximum Managers Reached",
        `You can only have ${maxManagers} manager${maxManagers > 1 ? 's' : ''} for your event. Please remove an existing manager to add a new one.`,
        [{ text: "OK" }]
      );
      return;
    }

    setAdding(true);
    console.log("[AddManager] Adding manager:", {
      name: managerName,
      phone: formattedPhone,
      eventId: currentEvent.id,
      userId: `pending_${formattedPhone}`,
      role: "manager"
    });

    try {
      // Add the manager directly as a participant
      console.log("[AddManager] Calling addParticipant...");
      await addParticipant({
        eventId: currentEvent.id,
        userId: `pending_${formattedPhone}`, // Temporary ID for pending participants
        name: managerName.trim(),
        role: "manager",
        phoneNumber: formattedPhone,
      });

      console.log("[AddManager] Manager added successfully, refreshing participants...");
      
      // Explicitly refresh participants to ensure the UI updates
      await refreshParticipants();
      
      console.log("[AddManager] Participants refreshed successfully");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-close modal and reset form
      setPhoneNumber("");
      setManagerName("");
      safeOnClose();
      console.log("[AddManager] Modal closed after adding manager");
    } catch (error) {
      console.error("[AddManager] Error adding manager:", error);
      Alert.alert(
        "Error",
        "Failed to add manager. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={safeOnClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grabber} />
            <View style={styles.header}>
              <Text style={styles.title}>Add Manager</Text>
              <Pressable onPress={safeOnClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.eventInfo}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <View style={styles.eventDetails}>
                <Text style={styles.eventName}>{currentEvent?.name}</Text>
                <Text style={styles.eventCode}>Code: {currentEvent?.eventCode}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                The manager will be added directly to your event. They can join by downloading the app and entering the event code.
              </Text>
            </View>

            <View style={styles.limitInfo}>
              <Ionicons name="people-outline" size={16} color={Colors.warning} />
              <Text style={styles.limitText}>
                Maximum {maxManagers} manager{maxManagers > 1 ? 's' : ''} allowed
              </Text>
            </View>

            <Text style={styles.label}>Manager's Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter manager's name"
              placeholderTextColor={Colors.textMuted}
              value={managerName}
              onChangeText={setManagerName}
            />

            <Text style={styles.label}>Manager's Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor={Colors.textMuted}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                autoFocus
                underlineColorAndroid="transparent"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                (!phoneNumber || !managerName.trim() || adding) && styles.addBtnDisabled,
                { opacity: pressed && phoneNumber && managerName.trim() ? 0.85 : 1 },
              ]}
              onPress={handleAddManager}
              disabled={!phoneNumber || !managerName.trim() || adding}
            >
              {adding ? (
                <Text style={styles.addBtnText}>Adding...</Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Add Manager</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  eventCode: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.primary + "10",
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  limitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warning + "10",
    padding: 12,
    borderRadius: 10,
  },
  limitText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.warning,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  input: {
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
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    outlineWidth: 0,
  } as any,
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});