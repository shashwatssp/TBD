# Wedding Planner App - Comprehensive Enhancement Plan

## Executive Summary

This document outlines the implementation plan for 20 enhancements to the Wedding Planner mobile app, focusing on improving user experience, adding collaborative features, and expanding functionality.

## Current Architecture

- **Frontend**: React Native (Expo) with TypeScript
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React Context API
- **Navigation**: Expo Router
- **User Roles**: Manager (organizer) and Participant (helper)

## Enhancement Categories

### 1. Critical UI/UX Fixes (2 items)
### 2. Feature Additions (10 items)
### 3. Feature Enhancements (4 items)
### 4. Architecture Changes (2 items)
### 5. Business Logic (1 item)
### 6. Design Improvements (1 item)

---

## Detailed Implementation Plan

### 1. Fix Android Keyboard Hiding Input Fields

**Problem**: On Android devices, the keyboard often hides input fields when typing.

**Solution**:
- Use `react-native-keyboard-controller` (already installed)
- Implement proper `KeyboardAvoidingView` with platform-specific behavior
- Add `keyboardVerticalOffset` for Android
- Ensure all forms use `KeyboardAwareScrollViewCompat`

**Files to Modify**:
- [`artifacts/vivah/app/create-event.tsx`](../artifacts/vivah/app/create-event.tsx)
- [`artifacts/vivah/app/function/[id].tsx`](../artifacts/vivah/app/function/[id].tsx)
- [`artifacts/vivah/app/task/[id].tsx`](../artifacts/vivah/app/task/[id].tsx)
- [`artifacts/vivah/app/(tabs)/guests.tsx`](../artifacts/vivah/app/(tabs)/guests.tsx)
- [`artifacts/vivah/app/(auth)/profile.tsx`](../artifacts/vivah/app/(auth)/profile.tsx)

**Implementation Steps**:
1. Replace `ScrollView` with `KeyboardAwareScrollViewCompat` in all forms
2. Add `keyboardVerticalOffset` prop for Android (typically 80-100)
3. Set `behavior="padding"` for iOS, `behavior="height"` for Android
4. Test on multiple Android devices

**Code Example**:
```tsx
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "android" ? 80 : 0}
>
  <KeyboardAwareScrollViewCompat
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
  >
    {/* Form content */}
  </KeyboardAwareScrollViewCompat>
</KeyboardAvoidingView>
```

---

### 2. Add "Custom" Wedding Type Option

**Problem**: Users cannot create custom wedding types when predefined templates don't apply.

**Solution**:
- Add "Custom" option to wedding type selection
- When "Custom" is selected, allow users to manually add functions
- Store custom functions in Firestore

**Files to Modify**:
- [`artifacts/vivah/app/create-event.tsx`](../artifacts/vivah/app/create-event.tsx)
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)

**Implementation Steps**:
1. Add "custom" to `WeddingType` union type
2. Add "Custom" option to wedding type selector UI
3. When "Custom" is selected, show "Add Function" button
4. Create custom functions with user-defined names
5. Store custom functions in Firestore with `isCustom: true` flag

**Database Schema Changes**:
```typescript
// Update FirebaseFunction interface
export interface FirebaseFunction {
  id: string;
  eventId: string;
  name: string;
  date: string | null;
  description: string;
  icon: string;
  color: string;
  budget: number | null;
  isCustom: boolean; // NEW
  createdAt: Timestamp;
}
```

---

### 3. Implement Pre-Added Subtasks for Functions

**Problem**: Functions don't have default subtasks, requiring manual entry each time.

**Solution**:
- Create default subtask templates for each function type
- Auto-populate subtasks when creating functions
- Allow users to add/remove subtasks

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/app/function/[id].tsx`](../artifacts/vivah/app/function/[id].tsx)

**Implementation Steps**:
1. Create `DEFAULT_SUBTASKS` configuration object
2. Map function names to default subtasks
3. When creating a function, auto-create default subtasks
4. Allow users to customize subtasks

**Configuration Example**:
```typescript
export const DEFAULT_SUBTASKS: Record<string, string[]> = {
  "Haldi": [
    "Book venue for Haldi",
    "Arrange turmeric paste",
    "Order flowers",
    "Arrange music/DJ",
    "Prepare traditional attire",
  ],
  "Mehendi": [
    "Book mehendi artist",
    "Arrange seating",
    "Order mehendi cones",
    "Prepare snacks",
    "Arrange music",
  ],
  "Sangeet": [
    "Book venue",
    "Hire choreographer",
    "Arrange decorations",
    "Book DJ/Band",
    "Prepare performances",
  ],
  "Wedding Ceremony": [
    "Book venue",
    "Arrange pandal/mandap",
    "Book priest",
    "Arrange catering",
    "Order flowers",
    "Arrange photography",
  ],
  "Reception": [
    "Book venue",
    "Arrange decorations",
    "Book DJ/Band",
    "Arrange catering",
    "Prepare guest list",
  ],
};
```

---

### 4. Add Task Assignee Selection When Creating Tasks

**Status**: Already implemented in [`function/[id].tsx`](../artifacts/vivah/app/function/[id].tsx)

**Verification Needed**:
- Confirm assignee selection works correctly
- Test with multiple participants
- Verify notifications are sent

**Enhancement**:
- Add assignee selection to task creation modal
- Show assignee avatar/name on task cards
- Filter tasks by assignee

---

### 5. Implement "Add Helper by Mobile Number" Feature

**Problem**: No way to add participants/helpers by mobile number.

**Solution**:
- Add "Add Helper" button in profile/settings
- Input mobile number and send invitation
- Create user account if doesn't exist
- Add to event participants

**Files to Create**:
- [`artifacts/vivah/app/add-helper.tsx`](../artifacts/vivah/app/add-helper.tsx)

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/app/(tabs)/profile.tsx`](../artifacts/vivah/app/(tabs)/profile.tsx)

**Implementation Steps**:
1. Create "Add Helper" screen with phone input
2. Validate phone number format
3. Check if user exists in Firestore
4. If exists: Add to participants, send notification
5. If doesn't exist: Create user with "participant" role, send SMS invitation
6. Show list of current helpers

**Database Schema Changes**:
```typescript
// Add to FirebaseUser
export interface FirebaseUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Timestamp;
  invitedBy?: string; // NEW: Who invited this user
  invitationStatus?: "pending" | "accepted"; // NEW
}
```

---

### 6. Add Comments System for Tasks and Subtasks

**Problem**: No way to add comments or notes to tasks/subtasks.

**Solution**:
- Create comments collection in Firestore
- Add comment UI to task detail screen
- Support threaded comments
- Show comment count on task cards

**Files to Create**:
- [`artifacts/vivah/components/CommentSection.tsx`](../artifacts/vivah/components/CommentSection.tsx)
- [`artifacts/vivah/components/CommentItem.tsx`](../artifacts/vivah/components/CommentItem.tsx)

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/app/task/[id].tsx`](../artifacts/vivah/app/task/[id].tsx)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)

**Database Schema**:
```typescript
export interface Comment {
  id: string;
  taskId: string;
  subtaskId?: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Implementation Steps**:
1. Create `comments` collection in Firestore
2. Add CRUD operations in `firebaseService.ts`
3. Create comment UI components
4. Add comment section to task detail screen
5. Show comment count on task cards
6. Send notifications for new comments

---

### 7. Add File Attachment Support (PDF/Photos) for Tasks

**Problem**: No way to attach files (PDFs, photos) to tasks.

**Solution**:
- Use Firebase Storage for file uploads
- Add file picker integration
- Show file attachments in task detail
- Support image preview and PDF viewing

**Dependencies to Add**:
```bash
npm install expo-document-picker expo-image-picker expo-file-system
```

**Files to Create**:
- [`artifacts/vivah/components/FileAttachment.tsx`](../artifacts/vivah/components/FileAttachment.tsx)
- [`artifacts/vivah/components/FilePicker.tsx`](../artifacts/vivah/components/FilePicker.tsx)

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/app/task/[id].tsx`](../artifacts/vivah/app/task/[id].tsx)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)

**Database Schema**:
```typescript
export interface FileAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: "image" | "pdf" | "document";
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
}
```

**Implementation Steps**:
1. Set up Firebase Storage
2. Create file upload/download functions
3. Add file picker UI
4. Show attachments in task detail
5. Add image preview modal
6. Implement PDF viewer

---

### 8. Create Detailed Summary Views for Task Statistics

**Problem**: Summary tabs on home page don't show detailed task lists.

**Solution**:
- Create detailed task list screens for each status
- Add filtering and sorting options
- Show task progress and assignee info
- Navigate from summary cards to detailed views

**Files to Create**:
- [`artifacts/vivah/app/tasks/[status].tsx`](../artifacts/vivah/app/tasks/[status].tsx)

**Files to Modify**:
- [`artifacts/vivah/app/(tabs)/index.tsx`](../artifacts/vivah/app/(tabs)/index.tsx)

**Implementation Steps**:
1. Create dynamic route `/tasks/[status]`
2. Fetch tasks by status from Firestore
3. Display task list with details
4. Add filter options (by function, assignee, priority)
5. Add sort options (by date, priority, name)
6. Show progress indicators

**Navigation Flow**:
```
Home Page (Summary Cards)
  ↓ Tap on "Completed Tasks"
Tasks Screen (All completed tasks)
  ↓ Tap on task
Task Detail Screen
```

---

### 9. Add Refresh Button After Adding Subtasks

**Problem**: No way to refresh task list after adding subtasks.

**Solution**:
- Add pull-to-refresh functionality
- Add manual refresh button
- Auto-refresh after subtask operations
- Show loading indicator

**Files to Modify**:
- [`artifacts/vivah/app/task/[id].tsx`](../artifacts/vivah/app/task/[id].tsx)
- [`artifacts/vivah/app/function/[id].tsx`](../artifacts/vivah/app/function/[id].tsx)

**Implementation Steps**:
1. Add `refreshing` state to task detail screen
2. Implement `onRefresh` function
3. Add `RefreshControl` to ScrollView
4. Call `loadTasksForFunction` after subtask operations
5. Show loading indicator during refresh

**Code Example**:
```tsx
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadTasksForFunction(functionId);
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {/* Task content */}
</ScrollView>
```

---

### 10. Implement Floating Action Button (FAB) at Bottom of Screen

**Problem**: No quick way to add tasks/functions from any screen.

**Solution**:
- Add FAB to main screens
- Show context-aware actions based on current screen
- Position at bottom-right with safe area padding
- Add animation and haptic feedback

**Files to Create**:
- [`artifacts/vivah/components/FloatingActionButton.tsx`](../artifacts/vivah/components/FloatingActionButton.tsx)

**Files to Modify**:
- [`artifacts/vivah/app/(tabs)/index.tsx`](../artifacts/vivah/app/(tabs)/index.tsx)
- [`artifacts/vivah/app/(tabs)/functions.tsx`](../artifacts/vivah/app/(tabs)/functions.tsx)

**Implementation Steps**:
1. Create reusable FAB component
2. Add to home screen (shows "Add Task" or "Add Function")
3. Add to functions screen (shows "Add Function")
4. Add to task detail screen (shows "Add Subtask")
5. Add animation and haptic feedback
6. Ensure proper positioning with safe areas

**Code Example**:
```tsx
<FloatingActionButton
  icon="add"
  onPress={() => setShowAddModal(true)}
  style={{
    position: "absolute",
    bottom: insets.bottom + 20,
    right: 20,
  }}
/>
```

---

### 11. Add Support for Multiple Assignees (Max 2) per Task

**Problem**: Tasks can only be assigned to one person.

**Solution**:
- Update task schema to support multiple assignees
- Add multi-select UI for assignees
- Show all assignees on task cards
- Send notifications to all assignees

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/app/function/[id].tsx`](../artifacts/vivah/app/function/[id].tsx)
- [`artifacts/vivah/app/task/[id].tsx`](../artifacts/vivah/app/task/[id].tsx)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)

**Database Schema Changes**:
```typescript
export interface FirebaseTask {
  id: string;
  functionId: string;
  title: string;
  description: string;
  dueDate: string | null;
  assignedTo: string | null; // Primary assignee (legacy)
  assignedToName: string | null; // Primary assignee name (legacy)
  assignees: Array<{id: string, name: string}>; // NEW: Multiple assignees
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  budget: number | null;
  createdAt: Timestamp;
  subtasks: FirebaseSubtask[];
}
```

**Implementation Steps**:
1. Update task schema to include `assignees` array
2. Modify task creation to support multiple assignees
3. Add multi-select UI for assignees
4. Show all assignees on task cards (avatars)
5. Update task filtering logic
6. Send notifications to all assignees

---

### 12. Verify and Enhance Budget Utilization Display on Home Page

**Status**: Already implemented in [`index.tsx`](../artifacts/vivah/app/(tabs)/index.tsx)

**Verification Needed**:
- Confirm budget calculation is accurate
- Test with multiple functions and tasks
- Verify budget vs spent display

**Enhancements**:
- Add budget breakdown by function
- Show budget utilization percentage
- Add budget alerts when over budget
- Show budget trends

---

### 13. Convert Functions List from Horizontal to Vertical Scrolling

**Problem**: Functions are displayed horizontally, making it hard to see all functions.

**Solution**:
- Change horizontal ScrollView to vertical FlatList
- Show more details per function card
- Add better visual hierarchy
- Improve navigation

**Files to Modify**:
- [`artifacts/vivah/app/(tabs)/index.tsx`](../artifacts/vivah/app/(tabs)/index.tsx)

**Implementation Steps**:
1. Replace `ScrollView` with `FlatList`
2. Update function card layout for vertical display
3. Add more details to function cards (task count, progress)
4. Add pull-to-refresh
5. Improve spacing and visual design

**Code Example**:
```tsx
<FlatList
  data={functions}
  renderItem={({ item }) => <FunctionCard function={item} />}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{ padding: 16, gap: 12 }}
  showsVerticalScrollIndicator={false}
/>
```

---

### 14. Verify Deadline Functionality for Tasks

**Status**: Already implemented in task schema

**Verification Needed**:
- Confirm deadline picker works
- Test deadline display on task cards
- Verify deadline notifications

**Enhancements**:
- Add deadline countdown
- Show overdue tasks prominently
- Add deadline reminders
- Color-code deadlines (urgent, upcoming, normal)

---

### 15. Add Upcoming Milestones Feature

**Problem**: No way to track important milestones and deadlines.

**Solution**:
- Create milestones collection in Firestore
- Add milestone tracking to home page
- Show countdown to milestones
- Add milestone completion tracking

**Files to Create**:
- [`artifacts/vivah/components/MilestoneCard.tsx`](../artifacts/vivah/components/MilestoneCard.tsx)
- [`artifacts/vivah/app/milestones.tsx`](../artifacts/vivah/app/milestones.tsx)

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/app/(tabs)/index.tsx`](../artifacts/vivah/app/(tabs)/index.tsx)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)

**Database Schema**:
```typescript
export interface Milestone {
  id: string;
  eventId: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

**Implementation Steps**:
1. Create `milestones` collection in Firestore
2. Add CRUD operations in `firebaseService.ts`
3. Create milestone UI components
4. Add milestones section to home page
5. Show upcoming milestones with countdown
6. Add milestone completion tracking
7. Send milestone reminders

---

### 16. Implement Polling System for Collective Decisions

**Problem**: No way to take collective decisions with helpers.

**Solution**:
- Create polls collection in Firestore
- Add poll creation UI
- Allow participants to vote
- Show poll results

**Files to Create**:
- [`artifacts/vivah/components/PollCard.tsx`](../artifacts/vivah/components/PollCard.tsx)
- [`artifacts/vivah/components/CreatePollModal.tsx`](../artifacts/vivah/components/CreatePollModal.tsx)
- [`artifacts/vivah/app/polls.tsx`](../artifacts/vivah/app/polls.tsx)

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)

**Database Schema**:
```typescript
export interface Poll {
  id: string;
  eventId: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  status: "active" | "closed";
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionId: string;
  votedAt: Timestamp;
}
```

**Implementation Steps**:
1. Create `polls` and `pollVotes` collections
2. Add poll CRUD operations
3. Create poll UI components
4. Add poll creation modal
5. Show active polls on home page
6. Allow participants to vote
7. Display poll results with charts
8. Send notifications for new polls

---

### 17. Add Support for Multiple Organizers/Managers

**Problem**: Only one person can be the organizer/manager.

**Solution**:
- Update event schema to support multiple managers
- Add manager role management
- Show all managers in profile
- Allow manager permissions

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)
- [`artifacts/vivah/app/(tabs)/profile.tsx`](../artifacts/vivah/app/(tabs)/profile.tsx)

**Database Schema Changes**:
```typescript
export interface FirebaseEvent {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  weddingCity: string;
  weddingDate: string;
  weddingType: WeddingType | null;
  venue: string | null;
  location: string | null;
  budget: number | null;
  description: string;
  eventCode: string;
  managerId: string; // Primary manager (legacy)
  managerIds: string[]; // NEW: Multiple managers
  createdAt: Timestamp;
}
```

**Implementation Steps**:
1. Update event schema to include `managerIds` array
2. Add manager management functions
3. Update role checking logic
4. Add "Add Manager" UI
5. Show all managers in profile
6. Allow managers to perform all manager actions
7. Send notifications when new manager is added

---

### 18. Define and Implement Free vs Premium Feature Tiers

**Problem**: No differentiation between free and premium features.

**Solution**:
- Define feature tiers
- Add subscription management
- Implement feature gating
- Add upgrade prompts

**Feature Tiers**:

**Free Tier**:
- 1 event
- 5 functions per event
- 10 tasks per function
- 1 assignee per task
- Basic notifications
- No file attachments
- No polls
- No milestones

**Premium Tier**:
- Unlimited events
- Unlimited functions
- Unlimited tasks
- 2 assignees per task
- Advanced notifications
- File attachments (PDF/photos)
- Polls for collective decisions
- Milestone tracking
- Multiple organizers
- Custom wedding types
- Priority support

**Files to Create**:
- [`artifacts/vivah/components/SubscriptionModal.tsx`](../artifacts/vivah/components/SubscriptionModal.tsx)
- [`artifacts/vivah/lib/subscriptionService.ts`](../artifacts/vivah/lib/subscriptionService.ts)

**Files to Modify**:
- [`artifacts/vivah/lib/firebaseService.ts`](../artifacts/vivah/lib/firebaseService.ts)
- [`artifacts/vivah/context/AppContext.tsx`](../artifacts/vivah/context/AppContext.tsx)
- [`artifacts/vivah/app/(tabs)/profile.tsx`](../artifacts/vivah/app/(tabs)/profile.tsx)

**Database Schema**:
```typescript
export interface Subscription {
  id: string;
  userId: string;
  tier: "free" | "premium";
  startDate: Timestamp;
  endDate?: Timestamp;
  autoRenew: boolean;
}
```

**Implementation Steps**:
1. Define feature tiers and limits
2. Create subscription collection
3. Add subscription checking logic
4. Implement feature gating
5. Add upgrade prompts
6. Create subscription UI
7. Integrate payment (optional for now)

---

### 19. Update UI Color Scheme with Punchy Colors

**Problem**: Current colors are muted and not visually appealing.

**Solution**:
- Update color palette with vibrant, punchy colors
- Improve contrast and readability
- Add gradient effects
- Update all UI components

**Files to Modify**:
- [`artifacts/vivah/constants/colors.ts`](../artifacts/vivah/constants/colors.ts)
- All UI components and screens

**New Color Palette**:
```typescript
export const Colors = {
  // Primary - Vibrant Red/Maroon
  primary: "#E63946",
  primaryDark: "#9D0208",
  primaryLight: "#FF6B6B",
  
  // Secondary - Golden Yellow
  secondary: "#FFB703",
  secondaryDark: "#FB8500",
  secondaryLight: "#FFD166",
  
  // Accent - Teal
  accent: "#2A9D8F",
  accentDark: "#264653",
  accentLight: "#48CAE4",
  
  // Backgrounds
  background: "#FAFAFA",
  backgroundDark: "#1A1A2E",
  surface: "#FFFFFF",
  surfaceDark: "#16213E",
  
  // Text
  text: "#1A1A2E",
  textSecondary: "#4A4A68",
  textMuted: "#8B8B9E",
  
  // Status Colors
  success: "#2ECC71",
  warning: "#F39C12",
  error: "#E74C3C",
  info: "#3498DB",
  
  // Priority Colors
  priorityHigh: "#E74C3C",
  priorityMedium: "#F39C12",
  priorityLow: "#2ECC71",
  
  // UI Elements
  border: "#E0E0E0",
  card: "#FFFFFF",
  cardBorder: "#F0F0F0",
  tabBar: "#FFFFFF",
  tabBarBorder: "#F0F0F0",
  
  // Gradients
  gradientPrimary: ["#E63946", "#9D0208"],
  gradientSecondary: ["#FFB703", "#FB8500"],
  gradientAccent: ["#2A9D8F", "#264653"],
};
```

**Implementation Steps**:
1. Update color constants
2. Replace all color references
3. Add gradient effects to headers and buttons
4. Improve contrast ratios
5. Test on different screen modes (light/dark)

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. Fix Android keyboard hiding input fields
2. Add refresh button after adding subtasks
3. Verify and enhance budget utilization display

### Phase 2: Core Features (Week 2-3)
4. Add "Custom" wedding type option
5. Implement pre-added subtasks for functions
6. Add task assignee selection when creating tasks
7. Implement "Add helper by mobile number" feature

### Phase 3: Collaboration Features (Week 4-5)
8. Add comments system for tasks and subtasks
9. Add file attachment support (PDF/photos) for tasks
10. Add support for multiple assignees (max 2) per task
11. Implement polling system for collective decisions

### Phase 4: UI/UX Improvements (Week 6)
12. Create detailed summary views for task statistics
13. Implement floating action button (FAB) at bottom of screen
14. Convert functions list from horizontal to vertical scrolling
15. Update UI color scheme with punchy colors

### Phase 5: Advanced Features (Week 7-8)
16. Add upcoming milestones feature
17. Add support for multiple organizers/managers
18. Define and implement Free vs Premium feature tiers
19. Verify deadline functionality for tasks

### Phase 6: Testing & Deployment (Week 9)
20. Test all features and create deployment plan

---

## Testing Strategy

### Unit Testing
- Test all Firebase service functions
- Test context providers
- Test utility functions

### Integration Testing
- Test task creation and assignment flow
- Test participant invitation flow
- Test file upload/download flow
- Test notification system

### UI Testing
- Test keyboard handling on Android
- Test all forms and inputs
- Test navigation flows
- Test responsive layouts

### User Acceptance Testing
- Test with real wedding scenarios
- Test with multiple users
- Test on different devices
- Gather feedback and iterate

---

## Deployment Plan

### Pre-Deployment Checklist
- [ ] All features implemented and tested
- [ ] Code reviewed and optimized
- [ ] Documentation updated
- [ ] Firebase security rules configured
- [ ] Error handling implemented
- [ ] Performance optimized

### Deployment Steps
1. Create feature branch for each phase
2. Implement and test features
3. Create pull requests
4. Code review and approval
5. Merge to main branch
6. Build and test APK
7. Deploy to testing environment
8. User acceptance testing
9. Deploy to production
10. Monitor and gather feedback

### Post-Deployment
- Monitor app performance
- Track user feedback
- Fix bugs and issues
- Plan next iteration

---

## Risk Assessment

### Technical Risks
- **Firebase Storage Limits**: Monitor storage usage and implement cleanup
- **Performance Issues**: Optimize queries and implement pagination
- **Offline Support**: Implement offline caching for critical features

### User Experience Risks
- **Complexity**: Keep UI simple and intuitive
- **Learning Curve**: Provide onboarding and tutorials
- **Feature Overload**: Implement progressive disclosure

### Business Risks
- **Subscription Adoption**: Provide clear value for premium features
- **User Retention**: Focus on core features first
- **Competition**: Differentiate with unique features

---

## Success Metrics

### User Engagement
- Daily active users
- Task completion rate
- Feature usage statistics
- User retention rate

### Technical Performance
- App crash rate < 1%
- API response time < 500ms
- Screen load time < 2s
- Battery usage optimization

### Business Metrics
- Free to premium conversion rate
- User satisfaction score
- Feature adoption rate
- Customer support tickets

---

## Conclusion

This comprehensive enhancement plan addresses all 20 requirements while maintaining code quality, user experience, and business viability. The phased approach allows for iterative development and testing, ensuring each feature is properly implemented before moving to the next phase.

The plan balances immediate fixes with long-term feature additions, ensuring the app remains stable while continuously improving. Regular testing and user feedback will guide the implementation and help prioritize features based on actual user needs.