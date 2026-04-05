import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";

interface InvitationPreviewProps {
  visible: boolean;
  onClose: () => void;
  familyId?: string;
}

export default function InvitationPreview({
  visible,
  onClose,
  familyId,
}: InvitationPreviewProps) {
  const insets = useSafeAreaInsets();
  const { currentEvent, generateInvitation } = useApp();
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    if (visible && currentEvent) {
      loadInvitation();
    }
  }, [visible, currentEvent, familyId]);

  const loadInvitation = async () => {
    if (!currentEvent) {
      console.error("No current event found");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Loading invitation for event:", currentEvent.id, "family:", familyId);
      const data = await generateInvitation(currentEvent.id, familyId);
      console.log("Invitation data loaded:", data);
      setInvitation(data);
    } catch (error) {
      console.error("Error loading invitation:", error);
      // Show error state
      setInvitation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!invitation) {
      console.error("No invitation data available");
      return;
    }

    const familyName = invitation.family?.name || "Guest";
    const hotelRoom = invitation.family?.hotelRoom || "TBD";
    const guestNames = invitation.guests.map((g: any) => g.name).join(", ");
    
    const message = `
🎊 Wedding Invitation 🎊

${invitation.wedding.brideName} 💍 ${invitation.wedding.groomName}

📅 Date: ${new Date(invitation.wedding.weddingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
📍 Venue: ${invitation.wedding.venue || invitation.wedding.weddingCity}
${invitation.wedding.location ? `🗺️ Location: ${invitation.wedding.location}` : ''}

🏨 Accommodation: ${hotelRoom}
👥 For: ${familyName}
👤 Guests: ${guestNames}

📍 Location QR Code: ${invitation.qrCodeUrl}

📝 RSVP Link: ${invitation.rsvpLink}

We look forward to celebrating with you!
    `.trim();

    try {
      console.log("Attempting to share invitation...");
      if (Platform.OS === 'android') {
        // For Android, open WhatsApp directly
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        console.log("Opening WhatsApp URL:", whatsappUrl);
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          console.log("WhatsApp opened successfully");
        } else {
          console.log("WhatsApp not available, falling back to general share");
          // Fallback to general share
          await Share.share({
            message,
          });
        }
      } else {
        // For iOS, use general share
        console.log("Using general share for iOS");
        await Share.share({
          message,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error sharing:", error);
      // Show error alert to user
      Alert.alert(
        "Share Failed",
        "Unable to share the invitation. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleOpenLocation = () => {
    if (!invitation?.wedding.location) return;
    
    const locationQuery = encodeURIComponent(invitation.wedding.location);
    const mapsUrl = Platform.select({
      ios: `maps://?q=${locationQuery}`,
      android: `geo:0,0?q=${locationQuery}`,
    });
    
    if (mapsUrl) {
      Linking.openURL(mapsUrl).catch((err) => console.error("Error opening maps:", err));
    }
  };

  const handleOpenRSVP = () => {
    if (!invitation?.rsvpLink) return;
    
    Linking.openURL(invitation.rsvpLink).catch((err) => 
      console.error("Error opening RSVP link:", err)
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wedding Invitation</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Loading invitation...</Text>
            </View>
          ) : invitation ? (
            <>
              {/* Wedding Card */}
              <LinearGradient
                colors={[Colors.primary, Colors.primary + "CC"]}
                style={styles.weddingCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.weddingCardContent}>
                  <View style={styles.coupleRow}>
                    <Text style={styles.coupleName}>{invitation.wedding.brideName}</Text>
                    <Ionicons name="heart" size={24} color="#FFFFFF" />
                    <Text style={styles.coupleName}>{invitation.wedding.groomName}</Text>
                  </View>
                  <Text style={styles.weddingName}>{invitation.wedding.name}</Text>
                </View>
              </LinearGradient>

              {/* Date & Time */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>
                      {new Date(invitation.wedding.weddingDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Venue */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="location-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Venue</Text>
                    <Text style={styles.infoValue}>{invitation.wedding.venue || invitation.wedding.weddingCity}</Text>
                    {invitation.wedding.location && (
                      <TouchableOpacity onPress={handleOpenLocation} style={styles.locationBtn}>
                        <Text style={styles.locationBtnText}>Open in Maps</Text>
                        <Ionicons name="open-outline" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Family & Guests */}
              {invitation.family && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="people-outline" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Family</Text>
                      <Text style={styles.infoValue}>{invitation.family.name}</Text>
                      <Text style={styles.infoSub}>
                        {invitation.family.guests.length} guest{invitation.family.guests.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  {invitation.family.guests.map((guest: any, index: number) => (
                    <View key={guest.id} style={styles.guestRow}>
                      <Text style={styles.guestName}>• {guest.name}</Text>
                      {guest.phone && (
                        <Text style={styles.guestPhone}>{guest.phone}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Hotel Room */}
              {invitation.family?.hotelRoom && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="bed-outline" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Hotel Room</Text>
                      <Text style={styles.infoValue}>{invitation.family.hotelRoom}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* QR Code */}
              <View style={styles.qrCard}>
                <Text style={styles.qrLabel}>Location QR Code</Text>
                <Image
                  source={{ uri: invitation.qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <Text style={styles.qrHint}>Scan to get directions</Text>
              </View>

              {/* RSVP Link */}
              <TouchableOpacity onPress={handleOpenRSVP} style={styles.rsvpCard}>
                <View style={styles.rsvpIcon}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
                </View>
                <View style={styles.rsvpContent}>
                  <Text style={styles.rsvpLabel}>RSVP Now</Text>
                  <Text style={styles.rsvpSub}>Tap to confirm your attendance</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.priorityHigh} />
              <Text style={styles.errorText}>Failed to load invitation</Text>
            </View>
          )}
        </ScrollView>

        {/* Share Button */}
        {!loading && invitation && (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share via WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.priorityHigh,
  },
  weddingCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  weddingCardContent: {
    alignItems: "center",
    gap: 8,
  },
  coupleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coupleName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  weddingName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  infoValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  infoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.primary,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  guestName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  guestPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  qrCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  qrLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  rsvpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success + "15",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  rsvpIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.success + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpContent: {
    flex: 1,
    gap: 2,
  },
  rsvpLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  rsvpSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },
  shareBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});