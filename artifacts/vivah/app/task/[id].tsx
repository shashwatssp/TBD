import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Colors } from "@/constants/colors";
import { Task, TaskPriority, TaskStatus, useApp, CommentType, FileAttachmentType } from "@/context/AppContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: Colors.textMuted,
  in_progress: Colors.warning,
  completed: Colors.success,
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: Colors.priorityHigh,
  medium: Colors.priorityMedium,
  low: Colors.priorityLow,
};

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, functions, updateTask, addSubtask, toggleSubtask, addNotification, user, participants, getTask, refreshParticipants, getComments, addComment, updateComment, deleteComment, uploadFileAttachment, getFileAttachments, deleteFileAttachment, canUseFileAttachments, upgradeSubscription } = useApp();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<{ id: string; name: string }[]>([]);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);
  const [fetchedTask, setFetchedTask] = useState<Task | null>(null);
  const [editBudget, setEditBudget] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [showEditDueDate, setShowEditDueDate] = useState(false);
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<CommentType | null>(null);
  const [showCommentOptions, setShowCommentOptions] = useState<CommentType | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSubtaskComments, setSelectedSubtaskComments] = useState<CommentType[]>([]);
  const [showSubtaskComments, setShowSubtaskComments] = useState<string | null>(null);
  const [showAddSubtaskComment, setShowAddSubtaskComment] = useState(false);
  const [newSubtaskComment, setNewSubtaskComment] = useState("");
  const [editingSubtaskComment, setEditingSubtaskComment] = useState<CommentType | null>(null);
  const [showSubtaskCommentOptions, setShowSubtaskCommentOptions] = useState<CommentType | null>(null);
  const [attachments, setAttachments] = useState<FileAttachmentType[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState<FileAttachmentType | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const isManager = user?.role === "manager";
  const task = tasks.find((t) => t.id === id) || fetchedTask;
  const fn = task ? functions.find((f) => f.id === task.functionId) : null;

  // Fetch task if not found in context
  useEffect(() => {
    if (!task && id && !loadingTask && !fetchedTask) {
      setLoadingTask(true);
      getTask(id)
        .then(setFetchedTask)
        .catch((error) => {
          console.error("Error fetching task:", error);
          Alert.alert("Error", "Failed to load task. Please try again.");
        })
        .finally(() => {
          setLoadingTask(false);
        });
    }
  }, [id, task, loadingTask, fetchedTask, getTask]);

  // Initialize edit budget and due date when task changes
  useEffect(() => {
    if (task) {
      setEditBudget(task.budget ? task.budget.toString() : "");
      setEditDueDate(task.dueDate ? new Date(task.dueDate) : null);
    }
  }, [task]);

  // Refresh participants when opening the assign modal
  useEffect(() => {
    if (showAssign && isManager) {
      refreshParticipants();
    }
  }, [showAssign, isManager, refreshParticipants]);

  // Initialize selectedParticipants when modal opens
  useEffect(() => {
    if (showAssign && task && task.assignedTo && task.assignedToName) {
      setSelectedParticipants(
        task.assignedTo.map((id, index) => ({
          id,
          name: task.assignedToName[index] || ''
        }))
      );
    } else if (showAssign) {
      setSelectedParticipants([]);
    }
  }, [showAssign, task]);

  // Load comments when task changes
  useEffect(() => {
    if (task) {
      loadComments();
      loadAttachments();
    }
  }, [task]);

  const loadComments = async () => {
    if (!task) return;
    try {
      const taskComments = await getComments(task.id);
      setComments(taskComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      Alert.alert("Error", "Failed to load comments. Please try again.");
    }
  };

  const loadAttachments = async () => {
    if (!task) return;
    try {
      const taskAttachments = await getFileAttachments(task.id);
      setAttachments(taskAttachments);
    } catch (error) {
      console.error("Error loading attachments:", error);
      Alert.alert("Error", "Failed to load attachments. Please try again.");
    }
  };

  if (loadingTask) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  if (!task || !fn) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Task not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 ? completedSubtasks / task.subtasks.length : 0;

  const handleStatusChange = async (status: TaskStatus) => {
    setSaving(true);
    try {
      await updateTask(task.id, { status });
      if (user) {
        await addNotification({
          userId: user.id,
          title: "Task Updated",
          message: `"${task.title}" is now ${STATUS_LABELS[status]}`,
          type: "status_change",
        });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Error updating task status:", error);
      Alert.alert("Error", "Failed to update task status. Please try again.");
    } finally {
      setSaving(false);
      setShowStatusMenu(false);
    }
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      // If no participants selected, assign to "Myself"
      const assignees = selectedParticipants.length > 0
        ? selectedParticipants
        : [{ id: user?.id || "", name: user?.name || "" }];
      
      await updateTask(task.id, {
        assignedTo: assignees.map(a => a.id),
        assignedToName: assignees.map(a => a.name)
      });
      
      // Send notifications to all assignees
      for (const assignee of assignees) {
        if (assignee.id !== user?.id) {
          await addNotification({
            userId: assignee.id,
            title: "Task Assigned to You",
            message: `"${task.title}" has been assigned to you in ${fn.name}`,
            type: "task_assigned",
          });
        }
      }
      
      if (user) {
        await addNotification({
          userId: user.id,
          title: "Task Assigned",
          message: `"${task.title}" assigned to ${assignees.map(a => a.name).join(", ")}`,
          type: "task_assigned",
        });
      }
      
      // Refresh participants after assigning task
      await refreshParticipants();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error assigning task:", error);
      Alert.alert("Error", "Failed to assign task. Please try again.");
    } finally {
      setSaving(false);
      setShowAssign(false);
      setSelectedParticipants([]);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || saving) return;
    setSaving(true);
    try {
      await addSubtask(task.id, newSubtask.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowAddSubtask(false);
      setNewSubtask("");
      // Refresh task data after adding subtask
      await handleRefresh();
    } catch (error) {
      console.error("Error adding subtask:", error);
      Alert.alert("Error", "Failed to add subtask. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (id) {
        const refreshedTask = await getTask(id);
        setFetchedTask(refreshedTask);
      }
    } catch (error) {
      console.error("Error refreshing task:", error);
      Alert.alert("Error", "Failed to refresh task. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await toggleSubtask(task.id, subtaskId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error toggling subtask:", error);
      Alert.alert("Error", "Failed to update subtask. Please try again.");
    }
  };

  const handleUpdateBudget = async () => {
    setSaving(true);
    try {
      const budgetValue = editBudget.trim() ? parseFloat(editBudget.trim()) : null;
      await updateTask(task.id, { budget: budgetValue });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditBudget(false);
    } catch (error) {
      console.error("Error updating budget:", error);
      Alert.alert("Error", "Failed to update budget. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDueDate = async () => {
    setSaving(true);
    try {
      await updateTask(task.id, { dueDate: editDueDate ? editDueDate.toISOString() : null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditDueDate(false);
    } catch (error) {
      console.error("Error updating due date:", error);
      Alert.alert("Error", "Failed to update due date. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !task) return;
    setSaving(true);
    try {
      await addComment({
        taskId: task.id,
        userId: user.id,
        userName: user.name,
        text: newComment.trim(),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowAddComment(false);
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !newComment.trim()) return;
    setSaving(true);
    try {
      await updateComment(editingComment.id, { text: newComment.trim() });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditingComment(null);
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      Alert.alert("Error", "Failed to update comment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setSaving(true);
    try {
      await deleteComment(commentId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowCommentOptions(null);
      await loadComments();
    } finally {
      setSaving(false);
    }
  };

  const openEditComment = (comment: CommentType) => {
    setEditingComment(comment);
    setNewComment(comment.text);
    setShowCommentOptions(null);
  };

  const loadSubtaskComments = async (subtaskId: string) => {
    if (!task) return;
    try {
      const subtaskComments = await getComments(task.id, subtaskId);
      setSelectedSubtaskComments(subtaskComments);
    } catch (error) {
      console.error("Error loading subtask comments:", error);
      Alert.alert("Error", "Failed to load subtask comments. Please try again.");
    }
  };

  const handleOpenSubtaskComments = (subtaskId: string) => {
    setShowSubtaskComments(subtaskId);
    loadSubtaskComments(subtaskId);
  };

  const handleAddSubtaskComment = async () => {
    if (!newSubtaskComment.trim() || !user || !task || !showSubtaskComments) return;
    setSaving(true);
    try {
      await addComment({
        taskId: task.id,
        subtaskId: showSubtaskComments,
        userId: user.id,
        userName: user.name,
        text: newSubtaskComment.trim(),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowAddSubtaskComment(false);
      setNewSubtaskComment("");
      await loadSubtaskComments(showSubtaskComments);
    } catch (error) {
      console.error("Error adding subtask comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubtaskComment = async () => {
    if (!editingSubtaskComment || !newSubtaskComment.trim()) return;
    setSaving(true);
    try {
      await updateComment(editingSubtaskComment.id, { text: newSubtaskComment.trim() });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditingSubtaskComment(null);
      setNewSubtaskComment("");
      if (showSubtaskComments) {
        await loadSubtaskComments(showSubtaskComments);
      }
    } catch (error) {
      console.error("Error updating subtask comment:", error);
      Alert.alert("Error", "Failed to update comment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubtaskComment = async (commentId: string) => {
    setSaving(true);
    try {
      await deleteComment(commentId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowSubtaskCommentOptions(null);
      if (showSubtaskComments) {
        await loadSubtaskComments(showSubtaskComments);
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditSubtaskComment = (comment: CommentType) => {
    setEditingSubtaskComment(comment);
    setNewSubtaskComment(comment.text);
    setShowSubtaskCommentOptions(null);
  };

  const handlePickFile = async () => {
    // Check if user can use file attachments (premium feature)
    if (!canUseFileAttachments()) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setUploadingFile(true);

      await uploadFileAttachment(
        task.id,
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        file.size || 0,
        user?.id ?? '',
        user?.name ?? ''
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadAttachments();
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
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

  const handleDeleteAttachment = async (attachment: FileAttachmentType) => {
    Alert.alert(
      'Delete Attachment',
      'Are you sure you want to delete this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFileAttachment(attachment.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowAttachmentOptions(null);
              await loadAttachments();
            } catch (error) {
              console.error('Error deleting attachment:', error);
              Alert.alert('Error', 'Failed to delete attachment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenAttachment = async (attachment: FileAttachmentType) => {
    try {
      await Linking.openURL(attachment.downloadUrl);
    } catch (error) {
      console.error('Error opening attachment:', error);
      Alert.alert('Error', 'Failed to open attachment. Please try again.');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return 'image-outline';
    } else if (fileType === 'application/pdf') {
      return 'document-text-outline';
    }
    return 'document-outline';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const participantsList = participants.filter((p) => p.role === "participant");

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
          { borderBottomColor: fn.color + "30" },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={[styles.fnBadge, { backgroundColor: fn.color + "18" }]}>
            <Ionicons name={fn.icon as never} size={14} color={fn.color} />
            <Text style={[styles.fnBadgeText, { color: fn.color }]}>{fn.name}</Text>
          </View>
        </View>
        <Text style={styles.taskTitle}>{task.title}</Text>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.statusChip, { backgroundColor: STATUS_COLORS[task.status] + "18", borderColor: STATUS_COLORS[task.status] }]}
            onPress={() => setShowStatusMenu(true)}
          >
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[task.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[task.status] }]}>{STATUS_LABELS[task.status]}</Text>
            <Ionicons name="chevron-down" size={14} color={STATUS_COLORS[task.status]} />
          </Pressable>

          <View style={[styles.priorityChip, { backgroundColor: PRIORITY_COLORS[task.priority] + "18", borderColor: PRIORITY_COLORS[task.priority] }]}>
            <View style={[styles.statusDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
            <Text style={[styles.statusText, { color: PRIORITY_COLORS[task.priority] }]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Text>
          </View>
        </View>

        {task.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descText}>{task.description}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>Assigned to</Text>
            <Text style={styles.detailValue}>
              {task.assignedToName && task.assignedToName.length > 0
                ? task.assignedToName.length === 1
                  ? task.assignedToName[0]
                  : `${task.assignedToName[0]} +${task.assignedToName.length - 1}`
                : "Unassigned"}
            </Text>
            {isManager && (
              <Pressable onPress={() => setShowAssign(true)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </Pressable>
            )}
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>Due date</Text>
            <Text style={styles.detailValue}>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                : "Not set"}
            </Text>
            {isManager && (
              <Pressable onPress={() => setShowEditDueDate(true)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </Pressable>
            )}
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>
              {task.budget ? `₹${task.budget.toLocaleString("en-IN")}` : "Not set"}
            </Text>
            {isManager && (
              <Pressable onPress={() => setShowEditBudget(true)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Subtasks</Text>
              {task.subtasks.length > 0 && (
                <Text style={styles.subtaskCount}>{completedSubtasks}/{task.subtasks.length} done</Text>
              )}
            </View>
            <Pressable style={styles.addSubtaskBtn} onPress={() => setShowAddSubtask(true)}>
              <Ionicons name="add" size={18} color={Colors.primary} />
            </Pressable>
          </View>

          {task.subtasks.length > 0 && (
            <View style={styles.subtaskProgressBg}>
              <View style={[styles.subtaskProgressFill, { width: `${subtaskProgress * 100}%` as any }]} />
            </View>
          )}

          {task.subtasks.length === 0 ? (
            <View style={styles.emptySubtasks}>
              <Text style={styles.emptySubtasksText}>No subtasks yet. Tap + to add one.</Text>
            </View>
          ) : (
            task.subtasks.map((st, i) => (
              <Animated.View key={st.id} entering={FadeInDown.delay(i * 30)}>
                <View style={styles.subtaskItem}>
                  <Pressable
                    style={styles.subtaskCheckboxArea}
                    onPress={() => handleToggleSubtask(st.id, st.completed)}
                  >
                    <View style={[styles.checkbox, st.completed && styles.checkboxDone]}>
                      {st.completed && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                  <Text style={[styles.subtaskText, st.completed && styles.subtaskDone]}>
                    {st.title}
                  </Text>
                  <Pressable
                    style={styles.subtaskCommentBtn}
                    onPress={() => handleOpenSubtaskComments(st.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={Colors.textMuted} />
                  </Pressable>
                </View>
              </Animated.View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Comments</Text>
              {comments.length > 0 && (
                <Text style={styles.subtaskCount}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</Text>
              )}
            </View>
            <Pressable style={styles.addSubtaskBtn} onPress={() => setShowAddComment(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
            </Pressable>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptySubtasks}>
              <Text style={styles.emptySubtasksText}>No comments yet. Tap 💬 to add one.</Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{comment.userName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.commentInfo}>
                      <Text style={styles.commentAuthor}>{comment.userName}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt.toDate()).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    {comment.userId === user?.id && (
                      <Pressable onPress={() => setShowCommentOptions(comment)}>
                        <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Attachments</Text>
              {attachments.length > 0 && (
                <Text style={styles.subtaskCount}>{attachments.length} file{attachments.length !== 1 ? 's' : ''}</Text>
              )}
            </View>
            <Pressable style={styles.addSubtaskBtn} onPress={handlePickFile} disabled={uploadingFile}>
              {uploadingFile ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="attach-outline" size={18} color={Colors.primary} />
              )}
            </Pressable>
          </View>

          {attachments.length === 0 ? (
            <View style={styles.emptySubtasks}>
              <Text style={styles.emptySubtasksText}>No attachments yet. Tap 📎 to add one.</Text>
            </View>
          ) : (
            <View style={styles.attachmentsList}>
              {attachments.map((attachment) => (
                <Animated.View key={attachment.id} entering={FadeInDown}>
                  <Pressable
                    style={styles.attachmentItem}
                    onPress={() => handleOpenAttachment(attachment)}
                    onLongPress={() => setShowAttachmentOptions(attachment)}
                  >
                    <View style={styles.attachmentIcon}>
                      <Ionicons name={getFileIcon(attachment.fileType) as never} size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>{attachment.fileName}</Text>
                      <Text style={styles.attachmentMeta}>
                        {formatFileSize(attachment.fileSize)} • {attachment.uploadedByName}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {isManager && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowAssign(true)}
            >
              <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Reassign</Text>
            </Pressable>
          )}
          {task.status !== "completed" && (
            <Pressable
              style={({ pressed }) => [styles.completeBtn, { flex: isManager ? 2 : 1, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => handleStatusChange("completed")}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Mark Complete</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAwareScrollViewCompat>

      {/* Floating Action Button */}
      {isManager && (
        <Pressable
          style={({ pressed }) => [styles.fab, { bottom: Platform.OS === "web" ? 34 : insets.bottom + 20, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => setShowAddSubtask(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}

      <Modal visible={showStatusMenu} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowStatusMenu(false)}>
          <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Update Status</Text>
            {(["not_started", "in_progress", "completed"] as const).map((s) => (
              <Pressable
                key={s}
                style={[styles.statusOption, task.status === s && styles.statusOptionActive]}
                onPress={() => handleStatusChange(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s] }]} />
                <Text style={[styles.statusOptionText, task.status === s && { color: Colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {STATUS_LABELS[s]}
                </Text>
                {task.status === s && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAssign} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAssign(false)}>
          <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>
              Assign Task {selectedParticipants.length > 0 && `(${selectedParticipants.length}/2)`}
            </Text>
            {participantsList.length === 0 ? (
              <Text style={styles.noParticipantsText}>No helpers have joined this event yet. Share the event code with them.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      style={[
                        styles.participantChip,
                        selectedParticipants.length === 0 && { borderColor: Colors.primary, backgroundColor: Colors.primary + "15" },
                      ]}
                      onPress={() => setSelectedParticipants([])}
                    >
                      <Text style={[styles.participantChipText, selectedParticipants.length === 0 && { color: Colors.primary }]}>
                        Myself
                      </Text>
                    </Pressable>
                    {participantsList.map((p) => {
                      const isSelected = selectedParticipants.some(sp => sp.id === p.id);
                      return (
                        <Pressable
                          key={p.id}
                          style={[
                            styles.participantChip,
                            isSelected && { borderColor: Colors.primary, backgroundColor: Colors.primary + "15" },
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              // Remove from selection
                              setSelectedParticipants(selectedParticipants.filter(sp => sp.id !== p.id));
                            } else if (selectedParticipants.length < 2) {
                              // Add to selection (max 2)
                              setSelectedParticipants([...selectedParticipants, { id: p.id, name: p.name }]);
                            } else {
                              // Max 2 reached, show feedback
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            }
                          }}
                        >
                          <Ionicons
                            name={isSelected ? "checkmark-circle" : "person-outline"}
                            size={12}
                            color={isSelected ? Colors.primary : Colors.textMuted}
                          />
                          <Text style={[styles.participantChipText, isSelected && { color: Colors.primary }]}>
                            {p.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                {selectedParticipants.length === 2 && (
                  <Text style={styles.maxAssigneesText}>Maximum 2 assignees per task</Text>
                )}
                <Pressable
                  style={[styles.sheetBtn, (selectedParticipants.length === 0 || saving) && { opacity: 0.4 }]}
                  onPress={handleAssign}
                  disabled={selectedParticipants.length === 0 || saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Assign</Text>}
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAddSubtask} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddSubtask(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Add Subtask</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="e.g. Compare pricing"
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholderTextColor={Colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddSubtask}
                underlineColorAndroid="transparent"
              />
            <Pressable
              style={[styles.sheetBtn, (!newSubtask.trim() || saving) && { opacity: 0.4 }]}
              onPress={handleAddSubtask}
              disabled={!newSubtask.trim() || saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Add</Text>}
            </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={showEditBudget} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowEditBudget(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Edit Budget</Text>
              <View style={styles.budgetRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.budgetInput}
                  placeholder="0"
                  value={editBudget}
                  onChangeText={setEditBudget}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  autoFocus
                  underlineColorAndroid="transparent"
                />
            </View>
            <Pressable
              style={[styles.sheetBtn, (!editBudget.trim() || saving) && { opacity: 0.4 }]}
              onPress={handleUpdateBudget}
              disabled={!editBudget.trim() || saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Save</Text>}
            </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={showEditDueDate} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowEditDueDate(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Edit Due Date</Text>
              <Pressable
                style={styles.dateRow}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.dateText}>
                  {editDueDate
                    ? editDueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                    : "Select due date"}
                </Text>
                {editDueDate && (
                  <Pressable onPress={() => setEditDueDate(null)}>
                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                  </Pressable>
                )}
              </Pressable>
              <Pressable
                style={[styles.sheetBtn, saving && { opacity: 0.4 }]}
                onPress={handleUpdateDueDate}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Save</Text>}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={editDueDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "compact" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setEditDueDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
          style={{ width: "100%" }}
        />
      )}

      <Modal visible={showAddComment} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddComment(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Add Comment</Text>
              <TextInput
                style={[styles.sheetInput, styles.commentInput]}
                placeholder="Write your comment..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor={Colors.textMuted}
                autoFocus
                multiline
                returnKeyType="done"
                onSubmitEditing={handleAddComment}
                underlineColorAndroid="transparent"
              />
              <Pressable
                style={[styles.sheetBtn, (!newComment.trim() || saving) && { opacity: 0.4 }]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Post</Text>}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={!!editingComment} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setEditingComment(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Edit Comment</Text>
              <TextInput
                style={[styles.sheetInput, styles.commentInput]}
                placeholder="Edit your comment..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor={Colors.textMuted}
                autoFocus
                multiline
                returnKeyType="done"
                onSubmitEditing={handleUpdateComment}
                underlineColorAndroid="transparent"
              />
              <Pressable
                style={[styles.sheetBtn, (!newComment.trim() || saving) && { opacity: 0.4 }]}
                onPress={handleUpdateComment}
                disabled={!newComment.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Update</Text>}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={!!showCommentOptions} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowCommentOptions(null)}>
          <Pressable style={styles.optionsMenu}>
            {showCommentOptions && showCommentOptions.userId === user?.id && (
              <>
                <Pressable
                  style={styles.optionItem}
                  onPress={() => openEditComment(showCommentOptions)}
                >
                  <Ionicons name="pencil-outline" size={18} color={Colors.text} />
                  <Text style={styles.optionText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionItem, styles.deleteOption]}
                  onPress={() => handleDeleteComment(showCommentOptions.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  <Text style={[styles.optionText, { color: Colors.error }]}>Delete</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!showSubtaskComments} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowSubtaskComments(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, styles.subtaskCommentsModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Subtask Comments</Text>
                  {selectedSubtaskComments.length > 0 && (
                    <Text style={styles.subtaskCount}>{selectedSubtaskComments.length} comment{selectedSubtaskComments.length !== 1 ? 's' : ''}</Text>
                  )}
                </View>
                <Pressable style={styles.addSubtaskBtn} onPress={() => setShowAddSubtaskComment(true)}>
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
                </Pressable>
              </View>

              {selectedSubtaskComments.length === 0 ? (
                <View style={styles.emptySubtasks}>
                  <Text style={styles.emptySubtasksText}>No comments yet. Tap 💬 to add one.</Text>
                </View>
              ) : (
                <ScrollView style={styles.subtaskCommentsList}>
                  <View style={styles.commentsList}>
                    {selectedSubtaskComments.map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <View style={styles.commentHeader}>
                          <View style={styles.commentAvatar}>
                            <Text style={styles.commentAvatarText}>{comment.userName.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.commentInfo}>
                            <Text style={styles.commentAuthor}>{comment.userName}</Text>
                            <Text style={styles.commentDate}>
                              {new Date(comment.createdAt.toDate()).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                          {comment.userId === user?.id && (
                            <Pressable onPress={() => setShowSubtaskCommentOptions(comment)}>
                              <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
                            </Pressable>
                          )}
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={showAddSubtaskComment} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddSubtaskComment(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Add Comment</Text>
              <TextInput
                style={[styles.sheetInput, styles.commentInput]}
                placeholder="Write your comment..."
                value={newSubtaskComment}
                onChangeText={setNewSubtaskComment}
                placeholderTextColor={Colors.textMuted}
                autoFocus
                multiline
                returnKeyType="done"
                onSubmitEditing={handleAddSubtaskComment}
                underlineColorAndroid="transparent"
              />
              <Pressable
                style={[styles.sheetBtn, (!newSubtaskComment.trim() || saving) && { opacity: 0.4 }]}
                onPress={handleAddSubtaskComment}
                disabled={!newSubtaskComment.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Post</Text>}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={!!editingSubtaskComment} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setEditingSubtaskComment(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={[styles.statusSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Edit Comment</Text>
              <TextInput
                style={[styles.sheetInput, styles.commentInput]}
                placeholder="Edit your comment..."
                value={newSubtaskComment}
                onChangeText={setNewSubtaskComment}
                placeholderTextColor={Colors.textMuted}
                autoFocus
                multiline
                returnKeyType="done"
                onSubmitEditing={handleUpdateSubtaskComment}
                underlineColorAndroid="transparent"
              />
              <Pressable
                style={[styles.sheetBtn, (!newSubtaskComment.trim() || saving) && { opacity: 0.4 }]}
                onPress={handleUpdateSubtaskComment}
                disabled={!newSubtaskComment.trim() || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Update</Text>}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={!!showSubtaskCommentOptions} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowSubtaskCommentOptions(null)}>
          <Pressable style={styles.optionsMenu}>
            {showSubtaskCommentOptions && showSubtaskCommentOptions.userId === user?.id && (
              <>
                <Pressable
                  style={styles.optionItem}
                  onPress={() => openEditSubtaskComment(showSubtaskCommentOptions)}
                >
                  <Ionicons name="pencil-outline" size={18} color={Colors.text} />
                  <Text style={styles.optionText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionItem, styles.deleteOption]}
                  onPress={() => handleDeleteSubtaskComment(showSubtaskCommentOptions.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  <Text style={[styles.optionText, { color: Colors.error }]}>Delete</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!showAttachmentOptions} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowAttachmentOptions(null)}>
          <Pressable style={styles.optionsMenu}>
            {showAttachmentOptions && (
              <>
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    handleOpenAttachment(showAttachmentOptions);
                    setShowAttachmentOptions(null);
                  }}
                >
                  <Ionicons name="open-outline" size={18} color={Colors.text} />
                  <Text style={styles.optionText}>Open</Text>
                </Pressable>
                <Pressable
                  style={[styles.optionItem, styles.deleteOption]}
                  onPress={() => handleDeleteAttachment(showAttachmentOptions)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  <Text style={[styles.optionText, { color: Colors.error }]}>Delete</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Upgrade Modal for File Attachments */}
      <Modal visible={showUpgradeModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowUpgradeModal(false)}>
          <Pressable style={styles.upgradeModal}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="lock-closed" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.upgradeTitle}>Premium Feature</Text>
            <Text style={styles.upgradeDescription}>
              File attachments are available for Premium subscribers. Upgrade to unlock this feature and more!
            </Text>
            
            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>Unlimited file attachments</Text>
              </View>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>Multiple organizers (up to 5)</Text>
              </View>
              <View style={styles.upgradeFeature}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.upgradeFeatureText}>Create polls for decisions</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: Colors.background },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted, marginTop: 12 },
  notFound: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  fnBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fnBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  taskTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text, lineHeight: 30 },
  scroll: { padding: 20, gap: 16 },
  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  subtaskCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addSubtaskBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  descText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted, flex: 1 },
  detailValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  subtaskProgressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
  subtaskProgressFill: { height: "100%", backgroundColor: Colors.success, borderRadius: 2 },
  emptySubtasks: { alignItems: "center", paddingVertical: 12 },
  emptySubtasksText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  subtaskItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  subtaskCheckboxArea: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  subtaskText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text, lineHeight: 20 },
  subtaskDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
  subtaskCommentBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary + "15",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 14,
  },
  completeBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  statusSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  grabber: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  statusOptionActive: { backgroundColor: Colors.background },
  statusOptionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },
  noParticipantsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingVertical: 8,
  },
  participantOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  participantOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  participantAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  participantName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  participantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  participantChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  maxAssigneesText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.warning, marginTop: 4 },
  sheetInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    outlineWidth: 0,
  } as any,
  sheetBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  sheetBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currencySymbol: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, marginRight: 8 },
  budgetInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text,
    outlineWidth: 0,
  } as any,
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
  commentsList: { gap: 12 },
  commentItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  commentDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  commentInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionsMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    gap: 4,
    minWidth: 150,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteOption: {
    backgroundColor: Colors.error + "10",
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  subtaskCommentsModal: {
    maxHeight: "80%",
  },
  subtaskCommentsList: {
    maxHeight: 300,
  },
  attachmentsList: {
    gap: 10,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
  },
  attachmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentInfo: {
    flex: 1,
    gap: 2,
  },
  attachmentName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  attachmentMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  upgradeModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    gap: 16,
    marginHorizontal: 20,
    maxWidth: 340,
    alignSelf: "center",
  },
  upgradeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  upgradeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    textAlign: "center",
  },
  upgradeDescription: {
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  upgradePrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
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
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  cancelUpgradeBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelUpgradeBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMuted,
  },
});
