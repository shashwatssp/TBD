import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import InviteHelperModal from "@/app/invite-helper";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, currentEvent, participants, refreshParticipants, getManagers, addManager, removeManager, upgradeSubscription, downgradeSubscription, canHaveMultipleManagers, getMaxManagers } = useApp();
  const isManager = user?.role === "manager";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showInviteHelper, setShowInviteHelper] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [showAddManager, setShowAddManager] = useState(false);
  const [newManagerPhone, setNewManagerPhone] = useState("");
  const [addingManager, setAddingManager] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [downgrading, setDowngrading] = useState(false);

  useEffect(() => {
    if (currentEvent) {
      refreshParticipants().catch((error) => {
        console.error("Error loading participants:", error);
        Alert.alert("Error", "Failed to load participants. Please try again.");
      });
    }
  }, [currentEvent?.id]);

  useEffect(() => {
    if (currentEvent && isManager) {
      getManagers(currentEvent.id)
        .then((m) => setManagers(m))
        .catch((error) => {
          console.error("Error loading managers:", error);
          Alert.alert("Error", "Failed to load organizers. Please try again.");
        });
    }
  }, [currentEvent?.id, isManager, getManagers]);

  const handleShare = async () => {
    if (!currentEvent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join our wedding event on Vivah! Use code: ${currentEvent.eventCode}\n\n${currentEvent.brideName} & ${currentEvent.groomName} | ${currentEvent.weddingCity}`,
      });
    } catch (error: any) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share event. Please try again.");
    }
  };

  const handleAddManager = async () => {
    if (!currentEvent || !newManagerPhone.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    const cleanPhone = newManagerPhone.replace(/\D/g, "");

    // Check if user is already a manager
    const existingManager = managers.find(m => m.phone === cleanPhone);
    if (existingManager) {
      Alert.alert("Error", "This user is already an organizer");
      return;
    }

    setAddingManager(true);
    try {
      // Find user by phone number
      // Note: This would require a function to find user by phone
      // For now, we'll assume the user exists and add them as a manager
      // In a real implementation, you'd need to query the users collection
      
      Alert.alert(
        "Add Organizer",
        `Are you sure you want to add +91 ${cleanPhone} as an organizer?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setAddingManager(false),
          },
          {
            text: "Add",
            onPress: async () => {
              try {
                // For now, we'll use a placeholder user ID
                // In a real implementation, you'd get the user ID from the phone number
                const userId = `user_${cleanPhone}`;
                
                await addManager(currentEvent.id, userId);
                
                // Refresh managers list
                const updatedManagers = await getManagers(currentEvent.id);
                setManagers(updatedManagers);
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Organizer added successfully");
                setShowAddManager(false);
                setNewManagerPhone("");
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to add organizer");
              } finally {
                setAddingManager(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add organizer");
      setAddingManager(false);
    }
  };

  const handleRemoveManager = async (managerId: string, managerName: string) => {
    if (!currentEvent) return;

    // Prevent removing the last manager
    if (managers.length <= 1) {
      Alert.alert("Error", "Cannot remove the last organizer");
      return;
    }

    Alert.alert(
      "Remove Organizer",
      `Are you sure you want to remove ${managerName} as an organizer?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeManager(currentEvent.id, managerId);
              
              // Refresh managers list
              const updatedManagers = await getManagers(currentEvent.id);
              setManagers(updatedManagers);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Organizer removed successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to remove organizer");
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      await upgradeSubscription();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "You've been upgraded to Premium! Enjoy all features.");
      setShowUpgradeModal(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upgrade subscription");
    } finally {
      setUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    try {
      setDowngrading(true);
      await downgradeSubscription();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "You've been downgraded to Free tier. Some features will be limited.");
      setShowDowngradeModal(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to downgrade subscription");
    } finally {
      setDowngrading(false);
    }
  };

  const handleLogout = () => {
    console.log("=== LOGOUT PROCESS STARTED ===");
    console.log("Logout button pressed by user:", user?.id, user?.name, user?.phone);
    console.log("User role:", user?.role);
    console.log("Current event:", currentEvent?.id, currentEvent?.eventCode);
    console.log("Platform:", Platform.OS);
    console.log("Timestamp:", new Date().toISOString());
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("=== LOGOUT CANCELLED BY USER ===");
            console.log("User cancelled logout at:", new Date().toISOString());
          }
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            console.log("=== USER CONFIRMED LOGOUT ===");
            console.log("Logout confirmed at:", new Date().toISOString());
            
            try {
              console.log("Setting isLoggingOut to true");
              setIsLoggingOut(true);
              
              console.log("User details before logout:");
              console.log("- ID:", user?.id);
              console.log("- Name:", user?.name);
              console.log("- Phone:", user?.phone);
              console.log("- Role:", user?.role);
              
              if (currentEvent) {
                console.log("Current event details:");
                console.log("- Event ID:", currentEvent.id);
                console.log("- Event Code:", currentEvent.eventCode);
                console.log("- Bride:", currentEvent.brideName);
                console.log("- Groom:", currentEvent.groomName);
              }
              
              console.log("Calling centralized logout function...");
              const logoutStartTime = Date.now();
              await logout();
              const logoutDuration = Date.now() - logoutStartTime;
              console.log("Logout function completed in", logoutDuration, "ms");
              
              console.log("Resetting isLoggingOut to false");
              setIsLoggingOut(false);
              
              console.log("Navigating to welcome screen (/)");
              console.log("=== LOGOUT PROCESS COMPLETED SUCCESSFULLY ===");
              console.log("Final timestamp:", new Date().toISOString());
              router.replace("/");
            } catch (error) {
              console.error("=== LOGOUT ERROR OCCURRED ===");
              console.error("Error details:", error);
              console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
              console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
              console.error("Error timestamp:", new Date().toISOString());
              
              console.log("Resetting isLoggingOut to false due to error");
              setIsLoggingOut(false);
              
              console.log("Attempting navigation to welcome screen despite error");
              console.log("=== LOGOUT PROCESS COMPLETED WITH ERROR ===");
              router.replace("/");
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profilePhone}>+91 {user.phone}</Text>
          </View>
        </Animated.View>

        {/* Subscription Tier Section */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={[styles.subscriptionCard, user?.subscriptionTier === 'premium' && styles.premiumCard]}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionIcon}>
                <Ionicons
                  name={user?.subscriptionTier === 'premium' ? 'diamond' : 'star-outline'}
                  size={24}
                  color={user?.subscriptionTier === 'premium' ? '#FFD700' : Colors.primary}
                />
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={[styles.subscriptionTitle, user?.subscriptionTier === 'premium' && styles.premiumTitle]}>
                  {user?.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                </Text>
                <Text style={styles.subscriptionDescription}>
                  {user?.subscriptionTier === 'premium'
                    ? 'Unlimited access to all features'
                    : 'Basic features with limits'}
                </Text>
              </View>
            </View>
            
            {user?.subscriptionTier === 'free' && (
              <Pressable
                style={({ pressed }) => [styles.upgradeBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => setShowUpgradeModal(true)}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              </Pressable>
            )}
            
            {user?.subscriptionTier === 'premium' && (
              <Pressable
                style={({ pressed }) => [styles.downgradeBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => setShowDowngradeModal(true)}
              >
                <Text style={styles.downgradeBtnText}>Downgrade to Free</Text>
              </Pressable>
            )}
          </View>
          
          {/* Feature Comparison */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name={canHaveMultipleManagers() ? 'checkmark-circle' : 'close-circle'} size={18} color={canHaveMultipleManagers() ? Colors.success : Colors.textMuted} />
              <Text style={[styles.featureText, !canHaveMultipleManagers() && styles.featureTextDisabled]}>
                Multiple Organizers (Max {getMaxManagers()})
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name={user?.subscriptionTier === 'premium' ? 'checkmark-circle' : 'close-circle'} size={18} color={user?.subscriptionTier === 'premium' ? Colors.success : Colors.textMuted} />
              <Text style={[styles.featureText, user?.subscriptionTier === 'free' && styles.featureTextDisabled]}>
                File Attachments (PDF/Photos)
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name={user?.subscriptionTier === 'premium' ? 'checkmark-circle' : 'close-circle'} size={18} color={user?.subscriptionTier === 'premium' ? Colors.success : Colors.textMuted} />
              <Text style={[styles.featureText, user?.subscriptionTier === 'free' && styles.featureTextDisabled]}>
                Polls & Collective Decisions
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name={user?.subscriptionTier === 'premium' ? 'checkmark-circle' : 'close-circle'} size={18} color={user?.subscriptionTier === 'premium' ? Colors.success : Colors.textMuted} />
              <Text style={[styles.featureText, user?.subscriptionTier === 'free' && styles.featureTextDisabled]}>
                Unlimited Tasks & Functions
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name={user?.subscriptionTier === 'premium' ? 'checkmark-circle' : 'close-circle'} size={18} color={user?.subscriptionTier === 'premium' ? Colors.success : Colors.textMuted} />
              <Text style={[styles.featureText, user?.subscriptionTier === 'free' && styles.featureTextDisabled]}>
                Unlimited Guest List
              </Text>
            </View>
          </View>
        </Animated.View>

        {currentEvent && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Current Event</Text>
            <View style={styles.eventCard}>
              <View style={styles.eventTop}>
                <View style={styles.eventHeart}>
                  <Ionicons name="heart" size={20} color={Colors.primary} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>
                    {currentEvent.brideName} & {currentEvent.groomName}
                  </Text>
                  <Text style={styles.eventDetail}>
                    {currentEvent.weddingCity} · {currentEvent.weddingDate
                      ? new Date(currentEvent.weddingDate).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric",
                        })
                      : "Date TBD"}
                  </Text>
                </View>
              </View>

              <View style={styles.codeRow}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Event Code</Text>
                  <Text style={styles.codeValue}>{currentEvent.eventCode}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Invite</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {isManager && currentEvent && managers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(130).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Organizers ({managers.length})</Text>
              <Pressable onPress={() => setShowAddManager(true)}>
                <Text style={styles.addText}>+ Add</Text>
              </Pressable>
            </View>
            <View style={styles.menuList}>
              {managers.map((manager) => (
                <View key={manager.id} style={styles.participantItem}>
                  <View style={[styles.participantAvatar, { backgroundColor: Colors.primary + "20" }]}>
                    <Text style={[styles.participantInitials, { color: Colors.primary }]}>
                      {manager.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{manager.name}</Text>
                    <Text style={styles.participantPhone}>{manager.phone}</Text>
                  </View>
                  <View style={styles.managerBadge}>
                    <Text style={styles.managerBadgeText}>Organizer</Text>
                  </View>
                  {manager.id !== user?.id && managers.length > 1 && (
                    <Pressable
                      style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => handleRemoveManager(manager.id, manager.name)}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                    </Pressable>
                  )}
                  {manager.id === user?.id && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {isManager && currentEvent && participants.filter((p) => p.role === "participant" && !managers.some(m => m.id === p.id)).length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Team Helpers ({participants.filter((p) => p.role === "participant" && !managers.some(m => m.id === p.id)).length})</Text>
            <View style={styles.menuList}>
              {participants.filter((p) => p.role === "participant" && !managers.some(m => m.id === p.id)).map((p) => (
                <View key={p.id} style={styles.participantItem}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantInitials}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{p.name}</Text>
                    <Text style={styles.participantPhone}>{p.phone}</Text>
                  </View>
                  <View style={styles.helperBadge}>
                    <Text style={styles.helperBadgeText}>Helper</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.menuList}>
            {isManager && (
              <Pressable
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push("/create-event")}
              >
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                <Text style={styles.menuLabel}>Create New Event</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            )}
            {isManager && currentEvent && (
              <Pressable
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => setShowInviteHelper(true)}
              >
                <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
                <Text style={styles.menuLabel}>Invite Helper by Mobile</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push("/join-event")}
            >
              <Ionicons name="log-in-outline" size={22} color={Colors.primary} />
              <Text style={styles.menuLabel}>Join Event with Code</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              { opacity: pressed || isLoggingOut ? 0.85 : 1 }
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={Colors.error} size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            )}
            <Text style={styles.logoutText}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Invite Helper Modal */}
      <InviteHelperModal
        visible={showInviteHelper}
        onClose={() => setShowInviteHelper(false)}
      />

      {/* Add Manager Modal */}
      {showAddManager && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
          >
            <KeyboardAwareScrollViewCompat
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 0 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Organizer</Text>
                <Pressable onPress={() => setShowAddManager(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.textMuted}
                    value={newManagerPhone}
                    onChangeText={(text) => setNewManagerPhone(text.replace(/\D/g, ""))}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.modalHint}>
                  Enter the mobile number of the person you want to add as an organizer
                </Text>
              </View>
              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowAddManager(false)}
                >
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnConfirm, addingManager && styles.modalBtnDisabled]}
                  onPress={handleAddManager}
                  disabled={addingManager}
                >
                  {addingManager ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalBtnTextConfirm}>Add Organizer</Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAwareScrollViewCompat>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upgrade to Premium</Text>
              <Pressable onPress={() => setShowUpgradeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.premiumFeatures}>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.premiumFeatureText}>Multiple Organizers (up to 5)</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.premiumFeatureText}>File Attachments (PDF/Photos)</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.premiumFeatureText}>Polls & Collective Decisions</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.premiumFeatureText}>Unlimited Tasks & Functions</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.premiumFeatureText}>Unlimited Guest List</Text>
                </View>
              </View>
              <Text style={styles.pricingText}>
                <Text style={styles.pricingPrice}>₹499</Text> / month
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm, upgrading && styles.modalBtnDisabled]}
                onPress={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Upgrade Now</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Downgrade to Free</Text>
              <Pressable onPress={() => setShowDowngradeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.warningText}>
                Are you sure you want to downgrade to the Free tier?
              </Text>
              <Text style={styles.warningDescription}>
                You will lose access to premium features including:
              </Text>
              <View style={styles.lostFeatures}>
                <View style={styles.lostFeature}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.lostFeatureText}>Multiple Organizers (limited to 1)</Text>
                </View>
                <View style={styles.lostFeature}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.lostFeatureText}>File Attachments</Text>
                </View>
                <View style={styles.lostFeature}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.lostFeatureText}>Polls & Collective Decisions</Text>
                </View>
                <View style={styles.lostFeature}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.lostFeatureText}>Limited Tasks (max 20)</Text>
                </View>
                <View style={styles.lostFeature}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.lostFeatureText}>Limited Functions (max 5)</Text>
                </View>
                <View style={styles.lostFeature}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.lostFeatureText}>Limited Guests (max 50)</Text>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowDowngradeModal(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnDanger, downgrading && styles.modalBtnDisabled]}
                onPress={handleDowngrade}
                disabled={downgrading}
              >
                {downgrading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Downgrade</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text, marginBottom: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF" },
  profileInfo: { gap: 4 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  profilePhone: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
  section: { gap: 12, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  addText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.primary },
  eventCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventTop: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  eventHeart: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.text },
  eventDetail: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  codeBox: { gap: 3 },
  codeLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  codeValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.primary, letterSpacing: 3 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  menuList: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuItemActive: { borderWidth: 1.5, borderColor: Colors.primary + "40" },
  menuLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.text },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  participantInitials: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFFFFF" },
  participantInfo: { flex: 1, gap: 2 },
  participantName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  participantPhone: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  helperBadge: {
    backgroundColor: Colors.gold + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  helperBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.gold },
  managerBadge: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  managerBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.primary },
  removeBtn: {
    padding: 8,
  },
  youBadge: {
    backgroundColor: Colors.success + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  youBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.success },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.error + "15",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.error },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  modalBody: { padding: 20, gap: 12 },
  modalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  phonePrefix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  modalHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtnConfirm: {
    backgroundColor: Colors.primary,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalBtnTextCancel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  modalBtnTextConfirm: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  modalBtnDanger: {
    backgroundColor: Colors.error,
  },
  subscriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  premiumCard: {
    backgroundColor: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionInfo: {
    flex: 1,
    gap: 4,
  },
  subscriptionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  premiumTitle: {
    color: "#1A0A0A",
  },
  subscriptionDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#4A4A4A",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  downgradeBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  downgradeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textMuted,
  },
  featuresList: {
    gap: 12,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  featureTextDisabled: {
    color: Colors.textMuted,
  },
  premiumFeatures: {
    gap: 12,
  },
  premiumFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumFeatureText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  pricingText: {
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  pricingPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.primary,
  },
  warningText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  warningDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  lostFeatures: {
    gap: 10,
  },
  lostFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lostFeatureText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
});
