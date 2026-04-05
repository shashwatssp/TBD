# Wedding Planner Enhancements - Implementation Plan

## Overview

This document outlines the implementation of major enhancements to the Vivah Wedding Planner app, including wedding type selection, guest management, family grouping, WhatsApp invitations, and budget tracking.

## Requirements Summary

### 1. Wedding Type Selection
- Support 10 wedding types: North Indian, South Indian, Bengali, Gujarati, Punjabi, Marathi, Tamil, Telugu, Kerala, Rajasthani
- Each type has its own set of default functions/events
- Add venue, location, and optional budget to wedding details

### 2. Task Enhancements
- Add optional budget field to tasks
- Already has name, deadline, assigned person

### 3. Guest Management (Core Feature)
- Each guest has: name, phone (optional), family/group tag, RSVP status, accommodation requirement (yes/no)
- Support both workflows: add guests directly OR create families first then add guests

### 4. Family Grouping
- Group guests as families (e.g., "Sharma Family (4 members)")
- Family-level hotel room assignments

### 5. WhatsApp Shareable Invitation
- Customizable invitation with: wedding details, venue, date/time, hotel room assignment (per family), QR code for location, RSVP link
- Template selection and customization

### 6. Dashboard Enhancements
- Show days left to wedding (already implemented)
- Show task status (already implemented)
- Add guest statistics
- Add budget overview

## Firebase Schema Changes

### Existing Collections
- `users` - User accounts
- `events` - Wedding events
- `participants` - Event participants
- `functions` - Wedding functions/events
- `tasks` - Tasks within functions
- `subtasks` - Subtasks within tasks
- `notifications` - User notifications

### New Collections

#### 1. `guestFamilies` Collection
```typescript
interface GuestFamily {
  id: string;
  eventId: string;
  name: string; // e.g., "Sharma Family"
  hotelRoom: string | null; // e.g., "Room 101, Floor 2"
  accommodationRequired: boolean;
  rsvpStatus: "pending" | "accepted" | "declined";
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. `guests` Collection
```typescript
interface Guest {
  id: string;
  eventId: string;
  familyId: string | null; // Optional - can be standalone
  name: string;
  phone: string | null; // Optional
  relationship: string | null; // e.g., "Uncle", "Friend", "Colleague"
  rsvpStatus: "pending" | "accepted" | "declined";
  accommodationRequired: boolean;
  dietaryRestrictions: string | null;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Modified Collections

#### 1. `events` Collection - Add Fields
```typescript
interface FirebaseEvent {
  // ... existing fields
  weddingType: "north_indian" | "south_indian" | "bengali" | "gujarati" | 
               "punjabi" | "marathi" | "tamil" | "telugu" | "kerala" | "rajasthani";
  venue: string | null;
  location: string | null; // Full address
  budget: number | null;
  // ... existing fields
}
```

#### 2. `tasks` Collection - Add Field
```typescript
interface FirebaseTask {
  // ... existing fields
  budget: number | null;
  // ... existing fields
}
```

#### 3. `functions` Collection - Add Field
```typescript
interface FirebaseFunction {
  // ... existing fields
  budget: number | null; // Optional per-function budget
  // ... existing fields
}
```

## Wedding Type Configurations

### Default Functions per Wedding Type

```typescript
const WEDDING_TYPE_FUNCTIONS: Record<string, Array<{name: string, icon: string, color: string}>> = {
  north_indian: [
    { name: "Haldi", icon: "sunny-outline", color: "#F0C040" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
    { name: "Wedding Ceremony", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
    { name: "Engagement", icon: "diamond-outline", color: "#1F5E8A" },
  ],
  south_indian: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Muhurtham", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  bengali: [
    { name: "Aashirbad", icon: "hand-left-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Gaye Holud", icon: "flower-outline", color: "#F39C12" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  gujarati: [
    { name: "Gol Dhana", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Mandap Muhurat", icon: "home-outline", color: "#9B59B6" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  punjabi: [
    { name: "Roka", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  marathi: [
    { name: "Sakhar Puda", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  tamil: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Muhurtham", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  telugu: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Muhurtham", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  kerala: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  rajasthani: [
    { name: "Tilak", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
};
```

## Backend Service Functions (Firebase)

### Updated Functions

#### 1. Event Operations
```typescript
// Update createEvent to accept wedding type, venue, location, budget
export const createEvent = async (eventData: {
  name: string;
  brideName: string;
  groomName: string;
  weddingCity: string;
  weddingDate: string;
  weddingType: WeddingType;
  venue?: string | null;
  location?: string | null;
  budget?: number | null;
  description?: string;
  managerId: string;
}): Promise<FirebaseEvent>

// Update getEvent to return new fields
export const getEvent = async (eventId: string): Promise<FirebaseEvent>
```

#### 2. Task Operations
```typescript
// Update createTask to accept budget
export const createTask = async (taskData: {
  functionId: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  budget?: number | null;
}): Promise<FirebaseTask>

// Update updateTask to accept budget
export const updateTask = async (taskId: string, updates: Partial<FirebaseTask>): Promise<FirebaseTask>
```

### New Functions

#### 3. Guest Family Operations
```typescript
export const createGuestFamily = async (familyData: {
  eventId: string;
  name: string;
  hotelRoom?: string | null;
  accommodationRequired?: boolean;
  notes?: string;
}): Promise<GuestFamily>

export const getGuestFamilies = async (eventId: string): Promise<GuestFamily[]>

export const updateGuestFamily = async (familyId: string, updates: Partial<GuestFamily>): Promise<GuestFamily>

export const deleteGuestFamily = async (familyId: string): Promise<void>

export const getGuestFamilyWithGuests = async (familyId: string): Promise<GuestFamily & { guests: Guest[] }>
```

#### 4. Guest Operations
```typescript
export const createGuest = async (guestData: {
  eventId: string;
  familyId?: string | null;
  name: string;
  phone?: string | null;
  relationship?: string | null;
  rsvpStatus?: "pending" | "accepted" | "declined";
  accommodationRequired?: boolean;
  dietaryRestrictions?: string | null;
  notes?: string;
}): Promise<Guest>

export const getGuests = async (eventId: string, familyId?: string): Promise<Guest[]>

export const updateGuest = async (guestId: string, updates: Partial<Guest>): Promise<Guest>

export const deleteGuest = async (guestId: string): Promise<void>

export const getGuestStats = async (eventId: string): Promise<{
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  accommodationRequired: number;
}>
```

#### 5. Invitation Generation
```typescript
export const generateInvitationData = async (eventId: string, familyId?: string): Promise<{
  wedding: FirebaseEvent;
  family?: GuestFamily;
  guests: Guest[];
  qrCodeUrl: string;
  rsvpLink: string;
}>
```

## Frontend UI Changes

### 1. Create Event Screen Updates
- Add wedding type selector (dropdown or cards)
- Add venue input field
- Add location input field (full address)
- Add budget input field (optional, numeric)
- Update validation logic
- Update form submission to include new fields

### 2. Task Creation/Editing Updates
- Add budget input field (optional, numeric)
- Update task card display to show budget if set
- Update task modal to include budget field

### 3. Guest Management Screens

#### Guest List Screen (`app/(tabs)/guests.tsx`)
- Display all guests grouped by family
- Show guest statistics (total, accepted, declined, pending)
- Filter by RSVP status
- Search functionality
- Add guest button
- Family grouping toggle

#### Add/Edit Guest Modal
- Name input (required)
- Phone input (optional)
- Family selector (optional - can create new family)
- Relationship input (optional)
- RSVP status selector
- Accommodation requirement toggle
- Dietary restrictions input (optional)
- Notes input (optional)

#### Family List Screen
- Display all families with member count
- Show family statistics
- Add family button
- Family card with expand/collapse to show members

#### Add/Edit Family Modal
- Family name input (required)
- Hotel room assignment (optional)
- Accommodation requirement toggle
- Notes input (optional)

### 4. Invitation Screen (`app/invitation/[id].tsx`)
- Preview invitation card
- Template selection (2-3 templates)
- Customization options (colors, fonts)
- Show wedding details
- Show venue and location
- Show hotel room assignment (if family)
- Show QR code for location
- RSVP link
- WhatsApp share button
- Download as image option

### 5. Dashboard Updates
- Add guest statistics card
- Add budget overview card
- Show total budget vs estimated
- Show budget by function (if per-function budget is set)
- Add quick actions (add guest, view invitation)

## AppContext Updates

### New Types
```typescript
export type WeddingType = "north_indian" | "south_indian" | "bengali" | "gujarati" | 
                        "punjabi" | "marathi" | "tamil" | "telugu" | "kerala" | "rajasthani";

export type RSVPStatus = "pending" | "accepted" | "declined";

export interface GuestFamily {
  id: string;
  eventId: string;
  name: string;
  hotelRoom: string | null;
  accommodationRequired: boolean;
  rsvpStatus: RSVPStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  eventId: string;
  familyId: string | null;
  name: string;
  phone: string | null;
  relationship: string | null;
  rsvpStatus: RSVPStatus;
  accommodationRequired: boolean;
  dietaryRestrictions: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### New State
```typescript
interface AppContextType {
  // ... existing state
  guestFamilies: GuestFamily[];
  guests: Guest[];
  loadingGuests: boolean;
  
  // ... existing methods
  createGuestFamily: (data: Omit<GuestFamily, 'id' | 'createdAt' | 'updatedAt'>) => Promise<GuestFamily>;
  updateGuestFamily: (familyId: string, updates: Partial<GuestFamily>) => Promise<GuestFamily>;
  deleteGuestFamily: (familyId: string) => Promise<void>;
  createGuest: (data: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Guest>;
  updateGuest: (guestId: string, updates: Partial<Guest>) => Promise<Guest>;
  deleteGuest: (guestId: string) => Promise<void>;
  refreshGuests: () => Promise<void>;
  getGuestStats: () => Promise<{total: number; accepted: number; declined: number; pending: number; accommodationRequired: number}>;
}
```

## Implementation Order

### Phase 1: Backend Foundation
1. Update Firebase types in `firebaseService.ts`
2. Update event operations (createEvent, getEvent)
3. Update task operations (createTask, updateTask)
4. Create guest family operations
5. Create guest operations
6. Create invitation generation function
7. Define wedding type configurations

### Phase 2: Context Integration
1. Update AppContext types
2. Add new state variables
3. Add new context methods
4. Update existing methods to handle new fields

### Phase 3: UI Updates - Wedding Creation
1. Update create-event screen
2. Add wedding type selector
3. Add venue, location, budget fields
4. Update function creation logic

### Phase 4: UI Updates - Tasks
1. Update task creation modal
2. Update task editing modal
3. Update task card display

### Phase 5: UI Updates - Guest Management
1. Create guest list screen
2. Create add/edit guest modal
3. Create family list screen
4. Create add/edit family modal
5. Add guest management to tab navigation

### Phase 6: UI Updates - Invitations
1. Create invitation preview screen
2. Add template selection
3. Add customization options
4. Implement WhatsApp sharing
5. Add QR code generation

### Phase 7: UI Updates - Dashboard
1. Add guest statistics card
2. Add budget overview card
3. Add quick actions

### Phase 8: Testing & Polish
1. Test all new features
2. Ensure backward compatibility
3. Fix bugs and edge cases
4. Optimize performance
5. Update documentation

## Backward Compatibility Strategy

### Existing Events
- Events without `weddingType` will default to "north_indian"
- Events without `venue`, `location`, `budget` will have null values
- Existing functions will remain unchanged

### Existing Tasks
- Tasks without `budget` will have null value
- All existing functionality will continue to work

### Migration
- No data migration required for existing events/tasks
- New fields are optional and nullable
- Default values will be used where appropriate

## Technical Considerations

### Performance
- Use Firestore indexes for frequently queried fields
- Implement pagination for guest lists (if many guests)
- Cache guest data in AppContext to reduce queries

### Security
- Ensure only event manager can add/edit guests
- Validate all user inputs
- Sanitize data before storage

### User Experience
- Provide clear error messages
- Show loading states for async operations
- Implement optimistic UI updates where possible
- Provide undo functionality for destructive actions

### WhatsApp Integration
- Use React Native's Share API for WhatsApp sharing
- Generate invitation as image for better sharing
- Include RSVP link that opens the app

## Testing Checklist

- [ ] Create event with all wedding types
- [ ] Verify default functions are created correctly for each type
- [ ] Add/edit/delete guests
- [ ] Add/edit/delete families
- [ ] Assign guests to families
- [ ] Update RSVP status
- [ ] Generate and share invitations
- [ ] View guest statistics
- [ ] View budget overview
- [ ] Test with existing events (backward compatibility)
- [ ] Test offline scenarios
- [ ] Test with large number of guests

## Success Criteria

1. All 10 wedding types are supported with correct default functions
2. Guest management is fully functional with both workflows
3. Family grouping works correctly
4. WhatsApp invitations are shareable with all required details
5. Dashboard shows guest statistics and budget overview
6. No existing functionality is broken
7. App remains performant with large datasets
8. User experience is intuitive and polished