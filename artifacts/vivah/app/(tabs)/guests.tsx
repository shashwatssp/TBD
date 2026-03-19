import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { RSVPStatus, useApp } from "@/context/AppContext";
import InvitationPreview from "@/components/InvitationPreview";

// RSVP Status Labels and Colors
const RSVP_LABELS: Record<RSVPStatus, string> = {
  pending: "Pending",
  accepted: "Confirmed",
  declined: "Declined",
};

const RSVP_COLORS: Record<RSVPStatus, string> = {
  pending: Colors.warning,
  accepted: Colors.success,
  declined: Colors.priorityHigh,
};

export default function GuestsScreen() {
  const insets = useSafeAreaInsets();
  const {
    guests,
    guestFamilies,
    user,
    currentEvent,
    createGuest,
    createGuestFamily,
    deleteGuest,
    deleteGuestFamily,
    getGuestStats,
    refreshGuests,
  } = useApp();

  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [filterFamily, setFilterFamily] = useState<string>("all");
  const [filterRSVP, setFilterRSVP] = useState<RSVPStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  // Add guest form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestFamilyId, setGuestFamilyId] = useState<string>("");
  const [guestRSVP, setGuestRSVP] = useState<RSVPStatus>("pending");
  const [guestAccommodation, setGuestAccommodation] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);

  // Add family form state
  const [familyName, setFamilyName] = useState("");
  const [familyHotelRoom, setFamilyHotelRoom] = useState("");
  const [addingFamily, setAddingFamily] = useState(false);

  const isManager = user?.role === "manager";

  useEffect(() => {
    refreshGuests();
  }, []);

  const stats = useMemo(() => ({
    total: guests.length,
    accepted: guests.filter(g => g.rsvpStatus === 'accepted').length,
    declined: guests.filter(g => g.rsvpStatus === 'declined').length,
    pending: guests.filter(g => g.rsvpStatus === 'pending').length,
    accommodationRequired: guests.filter(g => g.accommodationRequired).length,
  }), [guests]);

  const filteredGuests = useMemo(() => {
    let filtered = guests;

    if (filterFamily !== "all") {
      filtered = filtered.filter((g) => g.familyId === filterFamily);
    }

    if (filterRSVP !== "all") {
      filtered = filtered.filter((g) => g.rsvpStatus === filterRSVP);
    }

    return filtered;
  }, [guests, filterFamily, filterRSVP]);

  const groupedGuests = useMemo(() => {
    const groups: Record<string, typeof guests> = {};
    filteredGuests.forEach((guest) => {
      const familyId = guest.familyId || "ungrouped";
      if (!groups[familyId]) {
        groups[familyId] = [];
      }
      groups[familyId].push(guest);
    });
    return groups;
  }, [filteredGuests]);

  const handleAddGuest = async () => {
    if (!guestName.trim() || addingGuest) return;
    setAddingGuest(true);
    try {
      await createGuest({
        eventId: currentEvent?.id || "",
        name: guestName.trim(),
        phone: guestPhone.trim() || null,
        familyId: guestFamilyId || null,
        rsvpStatus: guestRSVP,
        accommodationRequired: guestAccommodation,
        relationship: null,
        dietaryRestrictions: null,
        notes: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddGuest(false);
      setGuestName("");
      setGuestPhone("");
      setGuestFamilyId("");
      setGuestRSVP("pending");
      setGuestAccommodation(false);
      await refreshGuests();
    } catch (error) {
      console.error("Error adding guest:", error);
    } finally {
      setAddingGuest(false);
    }
  };

  const handleAddFamily = async () => {
    if (!familyName.trim() || addingFamily) return;
    setAddingFamily(true);
    try {
      await createGuestFamily({
        eventId: currentEvent?.id || "",
        name: familyName.trim(),
        hotelRoom: familyHotelRoom.trim() || null,
        accommodationRequired: false,
        rsvpStatus: "pending",
        notes: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddFamily(false);
      setFamilyName("");
      setFamilyHotelRoom("");
      await refreshGuests();
    } catch (error) {
      console.error("Error adding family:", error);
    } finally {
      setAddingFamily(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      await deleteGuest(guestId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshGuests();
    } catch (error) {
      console.error("Error deleting guest:", error);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    try {
      await deleteGuestFamily(familyId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshGuests();
    } catch (error) {
      console.error("Error deleting family:", error);
    }
  };

  const getFamilyName = (familyId: string | null) => {
    if (!familyId) return "Ungrouped";
    const family = guestFamilies.find((f) => f.id === familyId);
    return family?.name || "Unknown Family";
  };

  const getFamilyRoom = (familyId: string | null) => {
    if (!familyId) return null;
    const family = guestFamilies.find((f) => f.id === familyId);
    return family?.hotelRoom || null;
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
      >
        <Text style={styles.headerTitle}>Guest Management</Text>
        <Text style={styles.headerSubtitle}>
          {guests.length} guests • {guestFamilies.length} families
        </Text>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.primary + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Guests</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.success + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.accepted}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.warning + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.priorityHigh + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.priorityHigh }]}>{stats.declined}</Text>
            <Text style={styles.statLabel}>Declined</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.textSecondary + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.textSecondary }]}>{stats.accommodationRequired}</Text>
            <Text style={styles.statLabel}>Need Stay</Text>
          </View>
        </View>
      </ScrollView>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, filterFamily === "all" && styles.filterChipActive]}
              onPress={() => setFilterFamily("all")}
            >
              <Text style={[styles.filterText, filterFamily === "all" && styles.filterTextActive]}>
                All Families
              </Text>
            </Pressable>
            {guestFamilies.map((family) => (
              <Pressable
                key={family.id}
                style={[styles.filterChip, filterFamily === family.id && styles.filterChipActive]}
                onPress={() => setFilterFamily(family.id)}
              >
                <Text style={[styles.filterText, filterFamily === family.id && styles.filterTextActive]}>
                  {family.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={styles.rsvpFilterRow}>
          {(["all", "accepted", "pending", "declined"] as const).map((status) => (
            <Pressable
              key={status}
              style={[styles.rsvpChip, filterRSVP === status && styles.rsvpChipActive]}
              onPress={() => setFilterRSVP(status as RSVPStatus | "all")}
            >
              <View style={[styles.rsvpDotSmall, { backgroundColor: status === "all" ? Colors.border : RSVP_COLORS[status as RSVPStatus] }]} />
              <Text style={[styles.rsvpText, filterRSVP === status && styles.rsvpTextActive]}>
                {status === "all" ? "All" : RSVP_LABELS[status as RSVPStatus]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Guest List */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : filteredGuests.length === 0 ? (
          <Animated.View entering={FadeInDown} style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No guests yet</Text>
            <Text style={styles.emptySub}>
              {filterFamily !== "all" || filterRSVP !== "all"
                ? "No guests match your filters"
                : "Tap + to add your first guest"}
            </Text>
          </Animated.View>
        ) : (
          Object.entries(groupedGuests).map(([familyId, familyGuests], groupIndex) => (
            <Animated.View key={familyId} entering={FadeInDown.delay(groupIndex * 50).duration(350)}>
              <View style={styles.familySection}>
                <View style={styles.familyHeader}>
                  <View>
                    <Text style={styles.familyName}>{getFamilyName(familyId)}</Text>
                    <Text style={styles.familyCount}>{familyGuests.length} member{familyGuests.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <View style={styles.familyHeaderRight}>
                    {getFamilyRoom(familyId) && (
                      <View style={styles.roomBadge}>
                        <Ionicons name="bed-outline" size={14} color={Colors.primary} />
                        <Text style={styles.roomText}>{getFamilyRoom(familyId)}</Text>
                      </View>
                    )}
                    {familyId !== "ungrouped" && (
                      <Pressable
                        style={styles.shareBtn}
                        onPress={() => {
                          setSelectedFamilyId(familyId);
                          setShowInvitation(true);
                        }}
                      >
                        <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
                      </Pressable>
                    )}
                  </View>
                </View>
                {familyGuests.map((guest, guestIndex) => (
                  <View key={guest.id} style={styles.guestCard}>
                    <View style={styles.guestInfo}>
                      <View style={styles.guestAvatar}>
                        <Text style={styles.guestAvatarText}>{guest.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.guestDetails}>
                        <Text style={styles.guestName}>{guest.name}</Text>
                        {guest.phone && (
                          <Text style={styles.guestPhone}>{guest.phone}</Text>
                        )}
                        <View style={styles.guestMeta}>
                          <View style={[styles.rsvpBadge, { backgroundColor: RSVP_COLORS[guest.rsvpStatus] + "18" }]}>
                            <View style={[styles.rsvpDot, { backgroundColor: RSVP_COLORS[guest.rsvpStatus] }]} />
                            <Text style={[styles.rsvpBadgeText, { color: RSVP_COLORS[guest.rsvpStatus] }]}>
                              {RSVP_LABELS[guest.rsvpStatus]}
                            </Text>
                          </View>
                          {guest.accommodationRequired && (
                            <View style={styles.accomBadge}>
                              <Ionicons name="bed-outline" size={12} color={Colors.primary} />
                              <Text style={styles.accomText}>Stay</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteGuest(guest.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.priorityHigh} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={styles.fab} onPress={() => setShowAddFamily(true)}>
          <Ionicons name="people-outline" size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.fab} onPress={() => setShowAddGuest(true)}>
          <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Add Guest Modal */}
      <Modal visible={showAddGuest} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddGuest(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Add Guest</Text>

            <Text style={styles.sheetLabel}>Guest Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Enter guest name"
              value={guestName}
              onChangeText={setGuestName}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              underlineColorAndroid="transparent"
            />

            <Text style={styles.sheetLabel}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Enter phone number"
              value={guestPhone}
              onChangeText={setGuestPhone}
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              underlineColorAndroid="transparent"
            />

            <Text style={styles.sheetLabel}>Family (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={[
                    styles.familyChip,
                    !guestFamilyId && { borderColor: Colors.primary, backgroundColor: Colors.primary + "15" },
                  ]}
                  onPress={() => setGuestFamilyId("")}
                >
                  <Text style={[styles.familyChipText, !guestFamilyId && { color: Colors.primary }]}>
                    No Family
                  </Text>
                </Pressable>
                {guestFamilies.map((family) => (
                  <Pressable
                    key={family.id}
                    style={[
                      styles.familyChip,
                      guestFamilyId === family.id && { borderColor: Colors.primary, backgroundColor: Colors.primary + "15" },
                    ]}
                    onPress={() => setGuestFamilyId(family.id)}
                  >
                    <Text style={[styles.familyChipText, guestFamilyId === family.id && { color: Colors.primary }]}>
                      {family.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sheetLabel}>RSVP Status</Text>
            <View style={styles.rsvpRow}>
              {(["pending", "accepted", "declined"] as const).map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.rsvpOption,
                    guestRSVP === status && { backgroundColor: RSVP_COLORS[status], borderColor: RSVP_COLORS[status] },
                  ]}
                  onPress={() => setGuestRSVP(status as RSVPStatus)}
                >
                  <Text style={[styles.rsvpOptionText, guestRSVP === status && { color: "#FFFFFF" }]}>
                    {RSVP_LABELS[status as RSVPStatus]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.accomToggle, guestAccommodation && styles.accomToggleActive]}
              onPress={() => setGuestAccommodation(!guestAccommodation)}
            >
              <Ionicons
                name={guestAccommodation ? "checkbox" : "square-outline"}
                size={20}
                color={guestAccommodation ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.accomToggleText, guestAccommodation && { color: Colors.primary }]}>
                Requires Accommodation
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sheetBtn,
                (!guestName.trim() || addingGuest) && styles.sheetBtnDisabled,
                { opacity: pressed && !!guestName.trim() ? 0.85 : 1 },
              ]}
              onPress={handleAddGuest}
              disabled={!guestName.trim() || addingGuest}
            >
              {addingGuest ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sheetBtnText}>Add Guest</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Family Modal */}
      <Modal visible={showAddFamily} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddFamily(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Add Family</Text>

            <Text style={styles.sheetLabel}>Family Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Sharma Family"
              value={familyName}
              onChangeText={setFamilyName}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              underlineColorAndroid="transparent"
            />

            <Text style={styles.sheetLabel}>Hotel Room (Optional)</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Room 201"
              value={familyHotelRoom}
              onChangeText={setFamilyHotelRoom}
              placeholderTextColor={Colors.textMuted}
              underlineColorAndroid="transparent"
            />

            <Pressable
              style={({ pressed }) => [
                styles.sheetBtn,
                (!familyName.trim() || addingFamily) && styles.sheetBtnDisabled,
                { opacity: pressed && !!familyName.trim() ? 0.85 : 1 },
              ]}
              onPress={handleAddFamily}
              disabled={!familyName.trim() || addingFamily}
            >
              {addingFamily ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sheetBtnText}>Add Family</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invitation Preview Modal */}
      <InvitationPreview
        visible={showInvitation}
        familyId={selectedFamilyId || ""}
        onClose={() => {
          setShowInvitation(false);
          setSelectedFamilyId(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
  statsScroll: { paddingHorizontal: 20, paddingVertical: 12 },
  statsContainer: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    minWidth: 80,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  filtersContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  filterScroll: { marginBottom: 4 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textMuted },
  filterTextActive: { color: "#FFFFFF" },
  rsvpFilterRow: { flexDirection: "row", gap: 8 },
  rsvpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rsvpChipActive: { backgroundColor: Colors.background },
  rsvpDot: { width: 6, height: 6, borderRadius: 3 },
  rsvpText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted },
  rsvpTextActive: { color: Colors.text, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  empty: { paddingTop: 60, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted, textAlign: "center" },
  familySection: { gap: 12 },
  familyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  familyHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  familyName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  familyCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  roomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roomText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary },
  guestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  guestInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  guestAvatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFFFFF" },
  guestDetails: { flex: 1, gap: 4 },
  guestName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  guestPhone: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  guestMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  rsvpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rsvpDotSmall: { width: 5, height: 5, borderRadius: 2.5 },
  rsvpBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  accomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  accomText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.primary },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.priorityHigh + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  fabContainer: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 80 : 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  grabber: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  sheetLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
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
  familyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  familyChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted },
  rsvpRow: { flexDirection: "row", gap: 10 },
  rsvpOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  rsvpOptionText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textMuted },
  accomToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accomToggleActive: { backgroundColor: Colors.primary + "10", borderColor: Colors.primary },
  accomToggleText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textMuted },
  sheetBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  sheetBtnDisabled: { opacity: 0.4 },
  sheetBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
});