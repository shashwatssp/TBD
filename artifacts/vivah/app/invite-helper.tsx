import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface InviteHelperModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function InviteHelperModal({ visible, onClose }: InviteHelperModalProps) {
  console.log("[InviteHelper] Modal rendered", { visible, hasOnClose: typeof onClose === 'function' });
  
  const insets = useSafeAreaInsets();
  const { currentEvent, user, addParticipant, refreshParticipants } = useApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [helperName, setHelperName] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteMode, setInviteMode] = useState<"whatsapp" | "direct">("whatsapp");
  
  console.log("[InviteHelper] Context state:", {
    hasCurrentEvent: !!currentEvent,
    hasUser: !!user,
    currentEventId: currentEvent?.id,
    userId: user?.id,
    userName: user?.name
  });
  
  // Defensive check for onClose
  const safeOnClose = React.useCallback(() => {
    console.log("[InviteHelper] safeOnClose called", { hasOnClose: typeof onClose === 'function' });
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.error("[InviteHelper] ERROR: onClose is not a function!", onClose);
    }
  }, [onClose]);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    return phone.replace(/\D/g, "");
  };

  const handleDirectAdd = async () => {
    console.log("[InviteHelper] handleDirectAdd called");
    if (!currentEvent || !user) {
      console.error("[InviteHelper] Error: No current event or user", { hasCurrentEvent: !!currentEvent, hasUser: !!user });
      Alert.alert("Error", "Please create an event first");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!formattedPhone) {
      console.error("[InviteHelper] Error: No phone number provided");
      Alert.alert("Phone Number Required", "Please enter a phone number");
      return;
    }

    if (!helperName.trim()) {
      console.error("[InviteHelper] Error: No helper name provided");
      Alert.alert("Name Required", "Please enter the helper's name");
      return;
    }

    setSending(true);
    console.log("[InviteHelper] Adding helper:", {
      name: helperName,
      phone: formattedPhone,
      eventId: currentEvent.id,
      userId: `pending_${formattedPhone}`,
      role: "participant"
    });

    try {
      // Add the helper directly as a participant
      console.log("[InviteHelper] Calling addParticipant...");
      await addParticipant({
        eventId: currentEvent.id,
        userId: `pending_${formattedPhone}`, // Temporary ID for pending participants
        name: helperName.trim(),
        role: "participant",
        phoneNumber: formattedPhone,
      });

      console.log("[InviteHelper] Helper added successfully, refreshing participants...");
      
      // Explicitly refresh participants to ensure the UI updates
      await refreshParticipants();
      
      console.log("[InviteHelper] Participants refreshed successfully");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-close modal and reset form
      setPhoneNumber("");
      setHelperName("");
      safeOnClose();
      console.log("[InviteHelper] Modal closed after adding helper");
    } catch (error) {
      console.error("[InviteHelper] Error adding helper:", error);
      Alert.alert(
        "Error",
        "Failed to add helper. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendInvitation = async () => {
    console.log("[InviteHelper] handleSendInvitation called");
    if (!currentEvent || !user) {
      console.error("[InviteHelper] Error: No current event or user", { hasCurrentEvent: !!currentEvent, hasUser: !!user });
      Alert.alert("Error", "Please create an event first");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!formattedPhone) {
      console.error("[InviteHelper] Error: No phone number provided");
      Alert.alert("Phone Number Required", "Please enter a phone number");
      return;
    }

    setSending(true);
    console.log("[InviteHelper] Sending invitation to:", formattedPhone);

    try {
      // Create deep link for the invitation
      const deepLink = `vivah://join-event?code=${currentEvent.eventCode}`;
      
      // Create invitation message with clickable link
      const invitationMessage = `🎉 ${user.name} has invited you to help plan their wedding!\n\n` +
        `Event: ${currentEvent.name}\n` +
        `Bride: ${currentEvent.brideName}\n` +
        `Groom: ${currentEvent.groomName}\n\n` +
        `📱 Click this link to join:\n${deepLink}\n\n` +
        `Or use Join Code: ${currentEvent.eventCode}\n\n` +
        `Download the Vivah Wedding Planner app if you haven't already!`;

      console.log("[InviteHelper] Invitation message created:", { messageLength: invitationMessage.length });

      // Open WhatsApp with the invitation message
      const whatsappUrl = `whatsapp://send?phone=91${formattedPhone}&text=${encodeURIComponent(invitationMessage)}`;
      
      console.log("[InviteHelper] Checking if WhatsApp is available...");
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenWhatsApp) {
        console.log("[InviteHelper] Opening WhatsApp");
        await Linking.openURL(whatsappUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Auto-close modal and reset form
        setPhoneNumber("");
        setHelperName("");
        safeOnClose();
        console.log("[InviteHelper] Modal closed after sending WhatsApp invitation");
      } else {
        // Fallback to SMS if WhatsApp is not available
        console.log("[InviteHelper] WhatsApp not available, falling back to SMS");
        const smsUrl = `sms:+91${formattedPhone}?body=${encodeURIComponent(invitationMessage)}`;
        await Linking.openURL(smsUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Auto-close modal and reset form
        setPhoneNumber("");
        setHelperName("");
        safeOnClose();
        console.log("[InviteHelper] Modal closed after sending SMS invitation");
      }
    } catch (error) {
      console.error("[InviteHelper] Error sending invitation:", error);
      Alert.alert(
        "Error",
        "Failed to send invitation. Please try again or share the event code manually.",
        [
          { text: "Share Code", onPress: () => shareEventCode() },
          { text: "OK", style: "cancel" }
        ]
      );
    } finally {
      setSending(false);
    }
  };

  const shareEventCode = () => {
    if (!currentEvent) return;

    const shareMessage = `🎉 Join my wedding planning team!\n\n` +
      `Event: ${currentEvent.name}\n` +
      `Bride: ${currentEvent.brideName}\n` +
      `Groom: ${currentEvent.groomName}\n\n` +
      `Join Code: ${currentEvent.eventCode}\n\n` +
      `Download the Vivah Wedding Planner app and enter this code to join!`;

    // Use React Native's Share API if available, otherwise copy to clipboard
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(shareMessage);
      Alert.alert("Copied!", "Event code has been copied to clipboard");
    } else {
      // For mobile, we'll use a simple alert with the code
      Alert.alert(
        "Event Code",
        `Share this code with your helper:\n\n${currentEvent.eventCode}`,
        [
          { text: "Copy", onPress: () => {
            // In a real app, you'd use Clipboard.setString()
            Alert.alert("Copied!", "Event code has been copied to clipboard");
          }},
          { text: "OK" }
        ]
      );
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
              <Text style={styles.title}>Invite Helper</Text>
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

            <View style={styles.modeToggle}>
              <Pressable
                style={[
                  styles.modeButton,
                  inviteMode === "whatsapp" && styles.modeButtonActive,
                ]}
                onPress={() => setInviteMode("whatsapp")}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={18}
                  color={inviteMode === "whatsapp" ? "#FFFFFF" : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    inviteMode === "whatsapp" && styles.modeButtonTextActive,
                  ]}
                >
                  Send Invite
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modeButton,
                  inviteMode === "direct" && styles.modeButtonActive,
                ]}
                onPress={() => setInviteMode("direct")}
              >
                <Ionicons
                  name="person-add"
                  size={18}
                  color={inviteMode === "direct" ? "#FFFFFF" : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    inviteMode === "direct" && styles.modeButtonTextActive,
                  ]}
                >
                  Add Directly
                </Text>
              </Pressable>
            </View>

            {inviteMode === "direct" && (
              <>
                <Text style={styles.label}>Helper's Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter helper's name"
                  placeholderTextColor={Colors.textMuted}
                  value={helperName}
                  onChangeText={setHelperName}
                />
              </>
            )}

            <Text style={styles.label}>Helper's Mobile Number</Text>
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

            {inviteMode === "whatsapp" && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>
                  The invitation will be sent via WhatsApp (or SMS if WhatsApp is not available)
                </Text>
              </View>
            )}

            {inviteMode === "direct" && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.infoText}>
                  The helper will be added directly to your event. They can join by downloading the app and entering the event code.
                </Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                (!phoneNumber || (inviteMode === "direct" && !helperName.trim()) || sending) && styles.sendBtnDisabled,
                { opacity: pressed && phoneNumber && (inviteMode === "whatsapp" || helperName.trim()) ? 0.85 : 1 },
              ]}
              onPress={inviteMode === "whatsapp" ? handleSendInvitation : handleDirectAdd}
              disabled={!phoneNumber || (inviteMode === "direct" && !helperName.trim()) || sending}
            >
              {sending ? (
                <Text style={styles.sendBtnText}>
                  {inviteMode === "whatsapp" ? "Sending..." : "Adding..."}
                </Text>
              ) : (
                <>
                  <Ionicons
                    name={inviteMode === "whatsapp" ? "send-outline" : "person-add-outline"}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.sendBtnText}>
                    {inviteMode === "whatsapp" ? "Send Invitation" : "Add Helper"}
                  </Text>
                </>
              )}
            </Pressable>

            {inviteMode === "whatsapp" && (
              <Pressable
                style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={shareEventCode}
              >
                <Ionicons name="share-outline" size={20} color={Colors.primary} />
                <Text style={styles.shareBtnText}>Share Event Code</Text>
              </Pressable>
            )}
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
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textMuted,
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
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
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.background,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.primary,
  },
});