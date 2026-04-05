import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function PollsScreen() {
  const { user, currentEvent, polls, loadingPolls, createPoll, voteOnPoll, closePoll, deletePoll, getUserVote, refreshPolls, canUsePolls, upgradeSubscription } = useApp();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  
  // Create poll form state
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load user votes when polls change
  useEffect(() => {
    if (!user || !polls) return;
    
    const loadUserVotes = async () => {
      const votes: Record<string, string> = {};
      for (const poll of polls) {
        try {
          const vote = await getUserVote(poll.id, user.id);
          if (vote) {
            votes[poll.id] = vote;
          }
        } catch (error) {
          console.error("Error loading user vote:", error);
          // Don't show alert for individual vote loading errors to avoid spam
        }
      }
      setUserVotes(votes);
    };
    
    loadUserVotes();
  }, [polls, user, getUserVote]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPolls();
    } catch (error) {
      console.error("Error refreshing polls:", error);
      Alert.alert(
        "Error",
        "Failed to refresh polls. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      Alert.alert("Maximum Options", "You can add up to 6 options");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert("Minimum Options", "You need at least 2 options");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    console.log("[Polls] handleCreatePoll called");
    // Check if user can use polls (premium feature)
    if (!canUsePolls()) {
      console.log("[Polls] User cannot use polls, showing upgrade modal");
      setShowUpgradeModal(true);
      return;
    }

    if (!question.trim()) {
      console.error("[Polls] Error: No question provided");
      Alert.alert("Error", "Please enter a question");
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      console.error("[Polls] Error: Not enough valid options", validOptions);
      Alert.alert("Error", "Please enter at least 2 options");
      return;
    }
    
    if (!user || !currentEvent) {
      console.error("[Polls] Error: User or event not found", { user: !!user, currentEvent: !!currentEvent });
      Alert.alert("Error", "User or event not found");
      return;
    }
    
    setCreating(true);
    console.log("[Polls] Creating poll:", {
      eventId: currentEvent.id,
      question: question.trim(),
      options: validOptions,
      createdBy: user.id
    });
    
    try {
      await createPoll({
        eventId: currentEvent.id,
        question: question.trim(),
        description: description.trim() || null,
        options: validOptions,
        createdBy: user.id,
        createdByName: user.name,
        deadline: deadline ? deadline.toISOString() : null,
      });
      
      console.log("[Polls] Poll created successfully");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-close modal and reset form
      setShowCreateModal(false);
      setQuestion("");
      setDescription("");
      setOptions(["", ""]);
      setDeadline(null);
      console.log("[Polls] Modal closed after creating poll");
    } catch (error: any) {
      console.error("[Polls] Error creating poll:", error);
      Alert.alert("Error", error.message || "Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    console.log("[Polls] handleVote called:", { pollId, optionId });
    if (!user) {
      console.error("[Polls] Error: User not found");
      Alert.alert("Error", "User not found");
      return;
    }
    
    setVoting(pollId);
    try {
      await voteOnPoll(pollId, optionId, user.id, user.name);
      console.log("[Polls] Vote recorded successfully");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUserVotes({ ...userVotes, [pollId]: optionId });
    } catch (error: any) {
      console.error("[Polls] Error voting:", error);
      Alert.alert("Error", error.message || "Failed to vote");
    } finally {
      setVoting(null);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    console.log("[Polls] handleClosePoll called:", pollId);
    Alert.alert(
      "Close Poll",
      "Are you sure you want to close this poll? No more votes will be accepted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: async () => {
            try {
              await closePoll(pollId);
              console.log("[Polls] Poll closed successfully");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              console.error("[Polls] Error closing poll:", error);
              Alert.alert("Error", error.message || "Failed to close poll");
            }
          },
        },
      ]
    );
  };

  const handleDeletePoll = async (pollId: string) => {
    console.log("[Polls] handleDeletePoll called:", pollId);
    Alert.alert(
      "Delete Poll",
      "Are you sure you want to delete this poll? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePoll(pollId);
              console.log("[Polls] Poll deleted successfully");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              console.error("[Polls] Error deleting poll:", error);
              Alert.alert("Error", error.message || "Failed to delete poll");
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = async () => {
    console.log("[Polls] handleUpgrade called");
    try {
      setUpgrading(true);
      await upgradeSubscription();
      console.log("[Polls] Subscription upgraded successfully");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "You've been upgraded to Premium! Enjoy all features.");
      setShowUpgradeModal(false);
    } catch (error: any) {
      console.error("[Polls] Error upgrading subscription:", error);
      Alert.alert("Error", error.message || "Failed to upgrade subscription");
    } finally {
      setUpgrading(false);
    }
  };

  const renderPoll = (poll: any) => {
    const isOwner = poll.createdBy === user?.id;
    const hasVoted = userVotes[poll.id];
    const isClosed = poll.status === "closed";
    const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes, 0);

    return (
      <View key={poll.id} style={styles.pollCard}>
        <View style={styles.pollHeader}>
          <View style={styles.pollHeaderLeft}>
            <Text style={styles.pollQuestion}>{poll.question}</Text>
            {poll.description && (
              <Text style={styles.pollDescription}>{poll.description}</Text>
            )}
          </View>
          <View style={styles.pollStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isClosed ? Colors.error : Colors.success }
            ]}>
              <Text style={styles.statusText}>
                {isClosed ? "Closed" : "Active"}
              </Text>
            </View>
          </View>
        </View>

        {poll.deadline && (
          <Text style={styles.pollDeadline}>
            Deadline: {new Date(poll.deadline).toLocaleDateString()}
          </Text>
        )}

        <View style={styles.pollOptions}>
          {poll.options.map((option: any) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const isSelected = hasVoted === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  isSelected && styles.selectedOption,
                  isClosed && styles.closedOption
                ]}
                onPress={() => !isClosed && !hasVoted && handleVote(poll.id, option.id)}
                disabled={isClosed || !!hasVoted || voting === poll.id}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    {!isClosed && !hasVoted && (
                      <View style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                    )}
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.text}
                    </Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={styles.voteCount}>{option.votes} votes</Text>
                    {!isClosed && (
                      <Text style={styles.votePercentage}>
                        {percentage.toFixed(0)}%
                      </Text>
                    )}
                  </View>
                </View>
                {isClosed && (
                  <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.pollFooter}>
          <Text style={styles.totalVotes}>
            Total votes: {totalVotes}
          </Text>
          {isOwner && (
            <View style={styles.pollActions}>
              {!isClosed && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleClosePoll(poll.id)}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.warning} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeletePoll(poll.id)}
              >
                <Ionicons name="trash" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loadingPolls && polls.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading polls...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Polls</Text>
        <Text style={styles.headerSubtitle}>
          {polls.length} {polls.length === 1 ? "poll" : "polls"}
        </Text>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {polls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={64} color={Colors.tabIconDefault} />
            <Text style={styles.emptyTitle}>No polls yet</Text>
            <Text style={styles.emptyText}>
              Create a poll to take collective decisions with your team
            </Text>
          </View>
        ) : (
          polls.map(renderPoll)
        )}
      </KeyboardAwareScrollViewCompat>

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => {
          if (!canUsePolls()) {
            setShowUpgradeModal(true);
          } else {
            setShowCreateModal(true);
          }
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Create Poll Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Poll</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Question *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What do you want to ask?"
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Add more details..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.optionsHeader}>
                  <Text style={styles.label}>Options *</Text>
                  <TouchableOpacity
                    style={styles.addOptionButton}
                    onPress={handleAddOption}
                  >
                    <Ionicons name="add" size={20} color={Colors.primary} />
                    <Text style={styles.addOptionText}>Add Option</Text>
                  </TouchableOpacity>
                </View>
                {options.map((option, index) => (
                  <View key={index} style={styles.optionInputContainer}>
                    <TextInput
                      style={styles.optionInput}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChangeText={(value) => handleOptionChange(index, value)}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeOptionButton}
                        onPress={() => handleRemoveOption(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Deadline (optional)</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {deadline ? deadline.toLocaleDateString() : "Select deadline"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreatePoll}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>Create Poll</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDeadline(selectedDate);
            }
          }}
        />
      )}

      {/* Upgrade Modal for Polls */}
      <Modal
        visible={showUpgradeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <Pressable style={styles.upgradeOverlay} onPress={() => setShowUpgradeModal(false)}>
          <Pressable style={styles.upgradeModal}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="lock-closed" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.upgradeTitle}>Premium Feature</Text>
            <Text style={styles.upgradeDescription}>
              Polls are available for Premium subscribers. Upgrade to unlock this feature and more!
            </Text>
            
            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>Create unlimited polls</Text>
              </View>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>Multiple organizers (up to 5)</Text>
              </View>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>File attachments for tasks</Text>
              </View>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>Unlimited tasks & functions</Text>
              </View>
            </View>

            <Text style={styles.upgradePrice}>₹499/month</Text>
            
            <Pressable
              style={({ pressed }) => [styles.upgradeBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
                </>
              )}
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [styles.cancelUpgradeBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.cancelUpgradeBtnText}>Maybe Later</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  pollCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pollHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  pollDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pollStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pollDeadline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  pollOptions: {
    marginBottom: 12,
  },
  pollOption: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    position: "relative",
    overflow: "hidden",
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  closedOption: {
    opacity: 0.8,
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: "600",
    color: Colors.primary,
  },
  optionRight: {
    alignItems: "flex-end",
  },
  voteCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  votePercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 2,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: Colors.primary,
  },
  pollFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalVotes: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pollActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },
  optionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  addOptionText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
  },
  optionInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  removeOptionButton: {
    padding: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateButtonText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  upgradeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  upgradeModal: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 28,
    gap: 16,
    maxWidth: 340,
    width: "100%",
  },
  upgradeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  upgradeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  upgradeFeatures: {
    gap: 10,
    marginVertical: 8,
  },
  upgradeFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  upgradeFeatureText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  upgradePrice: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginTop: 8,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelUpgradeBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelUpgradeBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});