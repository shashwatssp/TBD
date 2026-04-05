
# Testing and Deployment Plan
# Vivah Wedding Planner App

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Feature Testing Checklist](#feature-testing-checklist)
3. [Platform-Specific Testing](#platform-specific-testing)
4. [Deployment Plan](#deployment-plan)
5. [Pre-Deployment Checklist](#pre-deployment-checklist)
6. [Post-Deployment Monitoring](#post-deployment-monitoring)

---

## Testing Strategy

### Overview
This document outlines the comprehensive testing and deployment strategy for the Vivah Wedding Planner mobile application. The testing approach covers all implemented features across multiple platforms (Android, iOS, Web).

### Testing Levels

#### 1. Unit Testing
- **Purpose**: Test individual components and functions in isolation
- **Tools**: Jest, React Native Testing Library
- **Coverage Target**: 80%+ code coverage

#### 2. Integration Testing
- **Purpose**: Test interactions between components and services
- **Tools**: Detox (for E2E), Jest
- **Focus**: API calls, Firebase integration, state management

#### 3. End-to-End (E2E) Testing
- **Purpose**: Test complete user workflows
- **Tools**: Detox, Appium
- **Focus**: Critical user journeys

#### 4. Manual Testing
- **Purpose**: Validate user experience and edge cases
- **Focus**: UI/UX, accessibility, real-world scenarios

---

## Feature Testing Checklist

### Phase 1: Critical Fixes ✅

#### 1.1 Android Keyboard Issue
- [ ] Test keyboard behavior on Android devices
- [ ] Verify input fields remain visible when keyboard opens
- [ ] Test with different screen sizes and orientations
- [ ] Verify KeyboardAwareScrollViewCompat functionality
- [ ] Test keyboardVerticalOffset on different Android versions

**Test Cases:**
- Open task detail screen on Android device
- Tap on input field to open keyboard
- Verify input field remains visible above keyboard
- Test with multiple input fields in sequence
- Test with landscape orientation

**Expected Result:** All input fields remain visible when keyboard is open on Android devices.

#### 1.2 Refresh Button After Adding Subtasks
- [ ] Test refresh functionality in task detail screen
- [ ] Test refresh functionality in function detail screen
- [ ] Verify subtasks appear immediately after refresh
- [ ] Test refresh indicator animation
- [ ] Verify no data loss during refresh

**Test Cases:**
- Add a new subtask to a task
- Pull down to refresh
- Verify subtask appears immediately
- Test with multiple subtasks
- Test refresh with no network connection

**Expected Result:** Subtasks appear immediately after refresh without data loss.

### Phase 2: Core Features ✅

#### 2.1 Custom Wedding Type
- [ ] Test "Custom" option in wedding type selection
- [ ] Verify custom wedding type creates event without predefined functions
- [ ] Test custom wedding type with all form fields
- [ ] Verify event creation with custom type
- [ ] Test switching between predefined and custom types

**Test Cases:**
- Create event with "Custom" wedding type
- Fill all required fields
- Submit form
- Verify event is created with no predefined functions
- Verify user can add custom functions manually

**Expected Result:** Custom wedding type creates event without predefined functions, allowing manual function creation.

#### 2.2 Pre-Added Subtasks for Functions
- [ ] Test default subtasks for each function type
- [ ] Verify subtasks are automatically created when function is created
- [ ] Test all 16 function types
- [ ] Verify subtask content is appropriate for each function
- [ ] Test ability to modify default subtasks

**Test Cases:**
- Create function for each type (Engagement, Haldi, Mehendi, etc.)
- Verify default subtasks are created automatically
- Check subtask content matches function type
- Test modifying default subtasks
- Test deleting default subtasks

**Expected Result:** Each function type automatically creates appropriate default subtasks that can be modified or deleted.

#### 2.3 Task Assignee Selection
- [ ] Test assignee selection when creating tasks
- [ ] Verify "Myself" option is always available
- [ ] Test assignee selection with multiple participants
- [ ] Verify assignee display in task cards
- [ ] Test filtering tasks by assignee

**Test Cases:**
- Create task with "Myself" as assignee
- Create task with participant as assignee
- Create task with multiple assignees (max 2)
- Verify assignee display in task list
- Test filtering tasks by assignee

**Expected Result:** Tasks can be assigned to "Myself" or participants, with proper display and filtering.

#### 2.4 Add Helper by Mobile Number
- [ ] Test mobile number validation
- [ ] Test WhatsApp invitation
- [ ] Test SMS invitation
- [ ] Verify invitation link format
- [ ] Test with invalid phone numbers

**Test Cases:**
- Enter valid Indian mobile number (10 digits)
- Click "Send via WhatsApp"
- Verify WhatsApp opens with correct message
- Click "Send via SMS"
- Verify SMS app opens with correct message
- Test with invalid phone number (less than 10 digits)

**Expected Result:** Valid mobile numbers can be invited via WhatsApp or SMS with correct invitation links.

#### 2.5 Comments System
- [ ] Test adding comments to tasks
- [ ] Test adding comments to subtasks
- [ ] Test editing comments
- [ ] Test deleting comments
- [ ] Test comment display and formatting

**Test Cases:**
- Add comment to task
- Add comment to subtask
- Edit existing comment
- Delete comment
- Verify comment display with author and timestamp

**Expected Result:** Comments can be added, edited, and deleted on both tasks and subtasks with proper display.

#### 2.6 Budget Utilization Display
- [ ] Test budget calculation accuracy
- [ ] Test budget display on home page
- [ ] Test color coding for budget status
- [ ] Test progress bar visualization
- [ ] Test with zero budget

**Test Cases:**
- Create event with budget
- Add tasks with budgets
- Verify budget utilization calculation
- Check color coding (green < 90%, red > 90%)
- Test with zero budget

**Expected Result:** Budget utilization is accurately calculated and displayed with appropriate color coding.

#### 2.7 Functions List Vertical Scrolling
- [ ] Test vertical scrolling of functions list
- [ ] Verify 2-column grid layout
- [ ] Test function card display
- [ ] Test function progress indicators
- [ ] Test navigation to function details

**Test Cases:**
- Scroll through functions list
- Verify 2-column grid layout
- Check function card display with icon, name, task count
- Test progress indicator for each function
- Tap function card to navigate to details

**Expected Result:** Functions display in 2-column grid with vertical scrolling, showing progress indicators.

#### 2.8 Deadline Functionality
- [ ] Test adding deadline to task
- [ ] Test editing deadline
- [ ] Test deadline display in task cards
- [ ] Test deadline sorting
- [ ] Test overdue task highlighting

**Test Cases:**
- Create task with deadline
- Edit task deadline
- Verify deadline display in task list
- Sort tasks by deadline
- Check overdue task highlighting

**Expected Result:** Tasks can have deadlines that are displayed, edited, and used for sorting and highlighting.

#### 2.9 File Attachments
- [ ] Test uploading PDF files
- [ ] Test uploading photo files
- [ ] Test file preview
- [ ] Test file deletion
- [ ] Test file size limits

**Test Cases:**
- Upload PDF file to task
- Upload photo file to task
- Preview uploaded files
- Delete uploaded files
- Test with large files (> 10MB)

**Expected Result:** PDF and photo files can be uploaded, previewed, and deleted from tasks.

### Phase 3: Collaboration Features ✅

#### 3.1 Detailed Summary Views
- [ ] Test task statistics views (completed, in progress, pending)
- [ ] Test helpers/participants view
- [ ] Test search functionality
- [ ] Test sort functionality
- [ ] Test navigation from stat cards

**Test Cases:**
- Tap "Completed" stat card
- Verify completed tasks view opens
- Test search in tasks view
- Test sort by date/priority
- Navigate back to home page

**Expected Result:** Stat cards navigate to detailed views with search and sort functionality.

#### 3.2 Floating Action Button (FAB)
- [ ] Test FAB on functions screen
- [ ] Test FAB on task detail screen
- [ ] Test FAB on function detail screen
- [ ] Verify FAB positioning
- [ ] Test FAB functionality

**Test Cases:**
- Tap FAB on functions screen
- Verify add function modal opens
- Tap FAB on task detail screen
- Verify add subtask modal opens
- Tap FAB on function detail screen
- Verify create task modal opens

**Expected Result:** FABs are positioned correctly and open appropriate modals for quick actions.

#### 3.3 Multiple Assignees (Max 2)
- [ ] Test selecting single assignee
- [ ] Test selecting two assignees
- [ ] Test selecting more than two assignees (should be blocked)
- [ ] Test assignee display with "Name +N" format
- [ ] Test filtering by multiple assignees

**Test Cases:**
- Select one participant as assignee
- Select two participants as assignees
- Try to select third participant (should be blocked)
- Verify assignee display shows "Name +1" for two assignees
- Filter tasks by assignee

**Expected Result:** Tasks can have up to 2 assignees, with proper display and filtering.

### Phase 4: Advanced Features ✅

#### 4.1 Upcoming Milestones
- [ ] Test wedding date milestone
- [ ] Test task deadline milestones
- [ ] Test budget milestone (50% utilization)
- [ ] Test guest list milestone (100 guests)
- [ ] Test milestone sorting and display

**Test Cases:**
- Create event with wedding date
- Add high-priority tasks with deadlines
- Reach 50% budget utilization
- Add 100+ confirmed guests
- Verify milestones appear on home page

**Expected Result:** Milestones are generated and displayed based on wedding date, task deadlines, budget, and guest list.

### Phase 5: Polling System ✅

#### 5.1 Poll Creation
- [ ] Test creating poll with options
- [ ] Test setting poll deadline
- [ ] Test poll validation
- [ ] Test poll creation for premium users
- [ ] Test poll creation blocked for free users

**Test Cases:**
- Create poll with 2 options
- Create poll with 5 options
- Set poll deadline
- Try to create poll as free user (should show upgrade modal)
- Create poll as premium user

**Expected Result:** Premium users can create polls with options and deadlines; free users see upgrade modal.

#### 5.2 Poll Voting
- [ ] Test voting on active polls
- [ ] Test changing vote
- [ ] Test voting on closed polls (should be blocked)
- [ ] Test vote count updates
- [ ] Test voter list display

**Test Cases:**
- Vote on active poll
- Change vote to different option
- Try to vote on closed poll (should be blocked)
- Verify vote count updates
- Check voter list

**Expected Result:** Users can vote on active polls, change votes, and see vote counts and voter lists.

#### 5.3 Poll Management
- [ ] Test closing polls
- [ ] Test deleting polls
- [ ] Test poll results display
- [ ] Test poll status changes
- [ ] Test poll notifications

**Test Cases:**
- Close active poll
- Delete poll
- View poll results
- Check poll status changes
- Verify poll notifications

**Expected Result:** Polls can be closed, deleted, and viewed with results and status changes.

### Phase 6: Multiple Organizers/Managers ✅

#### 6.1 Multiple Manager Support
- [ ] Test creating event with multiple managers
- [ ] Test adding managers to existing event
- [ ] Test removing managers from event
- [ ] Test manager display on home page
- [ ] Test manager permissions

**Test Cases:**
- Create event with 2 managers
- Add third manager to event
- Remove manager from event
- Verify managers display on home page
- Test manager permissions (can edit event, etc.)

**Expected Result:** Events can have multiple managers (up to 5 for premium) with proper display and permissions.

#### 6.2 Manager Management
- [ ] Test adding manager by phone number
- [ ] Test removing manager with confirmation
- [ ] Test manager list display
- [ ] Test manager role verification
- [ ] Test manager notifications

**Test Cases:**
- Add manager by phone number
- Remove manager with confirmation dialog
- View manager list in profile
- Verify manager role
- Check manager notifications

**Expected Result:** Managers can be added and removed with proper verification and notifications.

### Phase 7: Free vs Premium Features ✅

#### 7.1 Subscription Tiers
- [ ] Test free tier limitations
- [ ] Test premium tier features
- [ ] Test subscription upgrade
- [ ] Test subscription downgrade
- [ ] Test feature availability checks

**Test Cases:**
- Try to use premium feature as free user (should show upgrade modal)
- Use premium feature as premium user
- Upgrade from free to premium
- Downgrade from premium to free
- Verify feature availability checks

**Expected Result:** Free users have limitations; premium users have full access; upgrade/downgrade works correctly.

#### 7.2 Premium Feature Locks
- [ ] Test file attachments lock for free users
- [ ] Test polls lock for free users
- [ ] Test multiple managers lock for free users
- [ ] Test upgrade modal display
- [ ] Test upgrade flow

**Test Cases:**
- Try to upload file as free user (should show upgrade modal)
- Try to create poll as free user (should show upgrade modal)
- Try to add second manager as free user (should show upgrade modal)
- Verify upgrade modal shows premium features
- Complete upgrade flow

**Expected Result:** Premium features are locked for free users with upgrade modals and clear upgrade flow.

### Phase 8: UI Color Scheme ✅

#### 8.1 Vibrant Color Scheme
- [ ] Test new primary color (magenta-pink)
- [ ] Test new gold color
- [ ] Test new accent color (purple)
- [ ] Test function-specific colors
- [ ] Test color contrast and accessibility

**Test Cases:**
- Verify primary color displays correctly
- Verify gold color displays correctly
- Verify accent color displays correctly
- Check function colors in functions list
- Test color contrast for accessibility

**Expected Result:** New vibrant color scheme displays correctly with good contrast and accessibility.

---

## Platform-Specific Testing

### Android Testing

#### Device Coverage
- [ ] Test on Android 10 (API 29)
- [ ] Test on Android 11 (API 30)
- [ ] Test on Android 12 (API 31)
- [ ] Test on Android 13 (API 33)
- [ ] Test on Android 14 (API 34)

#### Screen Sizes
- [ ] Test on small screen (5.0" - 5.5")
- [ ] Test on medium screen (5.5" - 6.5")
- [ ] Test on large screen (6.5" - 7.0")
- [ ] Test on tablet (7.0"+)

#### Android-Specific Features
- [ ] Test keyboard handling
- [ ] Test back button navigation
- [ ] Test permissions handling
- [ ] Test notification display
- [ ] Test file picker integration

#### Performance
- [ ] Test app startup time (< 3 seconds)
- [ ] Test screen transition smoothness
- [ ] Test memory usage (< 200MB)
- [ ] Test battery impact
- [ ] Test network performance

### iOS Testing

#### Device Coverage
- [ ] Test on iPhone 11 (iOS 15)
- [ ] Test on iPhone 12 (iOS 16)
- [ ] Test on iPhone 13 (iOS 17)
- [ ] Test on iPhone 14 (iOS 17)
- [ ] Test on iPhone 15 (iOS 18)

#### Screen Sizes
- [ ] Test on iPhone SE (4.7")
- [ ] Test on iPhone 12/13/14 (6.1")
- [ ] Test on iPhone 12/13/14 Pro Max (6.7")
- [ ] Test on iPad (10.9"+)

#### iOS-Specific Features
- [ ] Test keyboard handling
- [ ] Test swipe gestures
- [ ] Test permissions handling
- [ ] Test notification display
- [ ] Test file picker integration

#### Performance
- [ ] Test app startup time (< 2 seconds)
- [ ] Test screen transition smoothness
- [ ] Test memory usage (< 150MB)
- [ ] Test battery impact
- [ ] Test network performance

### Web Testing

#### Browser Coverage
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)

#### Screen Sizes
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)

#### Web-Specific Features
- [ ] Test responsive design
- [ ] Test keyboard handling
- [ ] Test file upload/download
- [ ] Test browser notifications
- [ ] Test offline functionality

#### Performance
- [ ] Test page load time (< 2 seconds)
- [ ] Test interaction responsiveness
- [ ] Test memory usage (< 100MB)
- [ ] Test network performance
- [ ] Test SEO optimization

---

## Deployment Plan

### Pre-Deployment Checklist

#### Code Quality
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings addressed
- [ ] Code review completed
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing

#### Security
- [ ] Security audit completed
- [ ] No hardcoded secrets
- [ ] Environment variables configured
- [ ] Firebase security rules updated
- [ ] API rate limiting configured
- [ ] Input validation implemented

#### Performance
- [ ] App bundle size optimized
- [ ] Image assets optimized
- [ ] Lazy loading implemented
- [ ] Caching strategy configured
- [ ] Database queries optimized
- [ ] CDN configured for static assets

#### Documentation
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] Deployment documentation updated
- [ ] Troubleshooting guide created
- [ ] Release notes prepared

#### Legal & Compliance
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance verified
- [ ] Data retention policy defined
- [ ] User consent mechanism implemented

### Android Deployment

#### Build Configuration
```bash
# Install dependencies
cd artifacts/vivah
pnpm install

# Configure Android build
cd android
./gradlew clean

# Build APK for testing
./gradlew assembleDebug

# Build APK for release
./gradlew assembleRelease

# Build App Bundle for Play Store
./gradlew bundleRelease
```

#### Play Store Deployment Steps
1. **Prepare Release**
   - [ ] Update version code in `app.json`
   - [ ] Update version name in `app.json`
   - [ ] Update build number in `eas.json`
   - [ ] Generate release notes

2. **Build Release**
   ```bash
   # Using EAS Build
   eas build --platform android --profile production
   
   # Or using local build
   cd android
   ./gradlew bundleRelease
   ```

3. **Upload to Play Store**
   - [ ] Sign in to Google Play Console
   - [ ] Create new release
   - [ ] Upload AAB file
   - [ ] Add release notes
   - [ ] Set rollout percentage (start with 10%)
   - [ ] Submit for review

4. **Monitor Release**
   - [ ] Monitor crash reports
   - [ ] Monitor user feedback
   - [ ] Monitor performance metrics
   - [ ] Gradually increase rollout (25% → 50% → 100%)

#### APK Distribution (Alternative)
```bash
# Build APK for direct distribution
cd android
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore your-keystore.jks \
  app-release-unsigned.apk your-alias

# Align APK
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

### iOS Deployment

#### Build Configuration
```bash
# Install dependencies
cd artifacts/vivah
pnpm install

# Configure iOS build
cd ios
pod install

# Build for testing
xcodebuild -workspace Vivah.xcworkspace \
  -scheme Vivah \
  -configuration Debug \
  -sdk iphonesimulator

# Build for release
xcodebuild -workspace Vivah.xcworkspace \
  -scheme Vivah \
  -configuration Release \
  -sdk iphoneos
```

#### App Store Deployment Steps
1. **Prepare Release**
   - [ ] Update version code in `app.json`
   - [ ] Update version name in `app.json`
   - [ ] Update build number in `eas.json`
   - [ ] Generate release notes
   - [ ] Update app screenshots
   - [ ] Update app description

2. **Build Release**
   ```bash
   # Using EAS Build
   eas build --platform ios --profile production
   
   # Or using local build
   eas build --platform ios --local
   ```

3. **Upload to App Store**
   - [ ] Sign in to App Store Connect
   - [ ] Create new version
   - [ ] Upload IPA file
   - [ ] Add release notes
   - [ ] Submit for review

4. **Monitor Release**
   - [ ] Monitor crash reports
   - [ ] Monitor user feedback
   - [ ] Monitor performance metrics
   - [ ] Respond to App Store review questions

### Web Deployment

#### Build Configuration
```bash
# Install dependencies
cd artifacts/vivah
pnpm install

# Build for production
pnpm run web:build

# Or using Expo
expo export:web
```

#### Web Deployment Steps
1. **Prepare Release**
   - [ ] Update version in `package.json`
   - [ ] Update environment variables
   - [ ] Configure domain
   - [ ] Set up SSL certificate

2. **Build Release**
   ```bash
   # Build for production
   pnpm run web:build
   
   # Output will be in web-build/ directory
   ```

3. **Deploy to Hosting**
   
   **Option 1: Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```
   
   **Option 2: Netlify**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Deploy
   netlify deploy --prod --dir=web-build
   ```
   
   **Option 3: Firebase Hosting**
   ```bash
   # Install Firebase CLI
   npm i -g firebase-tools
   
   # Initialize Firebase
   firebase init hosting
   
   # Deploy
   firebase deploy --only hosting
   ```

4. **Monitor Release**
   - [ ] Monitor uptime
   - [ ] Monitor performance
   - [ ] Monitor error rates
   - [ ] Monitor user analytics

### Firebase Deployment

#### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
      
      // Nested collections
      match /functions/{functionId} {
        allow read, write: if request.auth != null;
      }
      
      match /tasks/{taskId} {
        allow read, write: if request.auth != null;
      }
      
      match /subtasks/{subtaskId} {
        allow read, write: if request.auth != null;
      }
      
      match /comments/{commentId} {
        allow read, write: if request.auth != null;
      }
      
      match /attachments/{attachmentId} {
        allow read, write: if request.auth != null;
      }
      
      match /polls/{pollId} {
        allow read, write: if request.auth != null;
      }
      
      match /guests/{guestId} {
        allow read, write: if request.auth != null;
      }
      
      match /notifications/{notificationId} {
        allow read: if request.auth != null && request.auth.uid == resource.data.userId;
        allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    }
  }
}
```

#### Firebase Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

#### Firebase Indexes
Create composite indexes for efficient queries:
- `events` collection: Index on `managerIds` array
- `tasks` collection: Index on `functionId` and `status`
- `tasks` collection: Index on `assignedTo` array and `eventId`
- `comments` collection: Index on `taskId` and `createdAt`
- `polls` collection: Index on `eventId` and `status`

---

## Post-Deployment Monitoring

### Monitoring Tools

#### Application Performance Monitoring (APM)
- **Firebase Performance Monitoring**: Monitor app performance
- **Crashlytics**: Monitor crash reports
- **Google Analytics**: Monitor user behavior
- **Sentry**: Monitor error tracking

#### Key Metrics to Monitor
- **Performance**
  - App startup time
  - Screen load time
  - API response time
  - Memory usage
  - Battery consumption

- **User Engagement**
  - Daily Active Users (DAU)
  - Monthly Active Users (MAU)
  - Session duration
  - Retention rate
  - Churn rate

- **Business Metrics**
  - Event creation rate
  - Task completion rate
  - Premium subscription rate
  - Feature usage rate
  - User satisfaction score

- **Technical Metrics**
  - Error rate
  - Crash rate
  - API failure rate
  - Network latency
  - Server uptime

### Alerting Strategy

#### Critical Alerts (Immediate Action Required)
- App crash rate > 5%
- API failure rate > 10%
- Database connection failures
- Security vulnerabilities detected
- Payment processing failures

#### Warning Alerts (Monitor Closely)
- App startup time > 5 seconds
- API response time > 2 seconds
- Memory usage > 300MB
- Error rate > 2%
- User complaints increase

#### Info Alerts (Track Trends)
- New user signups
- Feature usage changes
- Performance degradation
- User feedback trends

### Rollback Procedure

#### Android Rollback
1. **Immediate Rollback**
   - Reduce Play Store rollout to 0%
   - Notify users of known issues
   - Prepare hotfix release

2. **Hotfix Release**
   - Fix critical issues
   - Build new APK/AAB
   - Submit to Play Store
   - Expedite review process

3. **Gradual Rollout**
   - Start with 5% rollout
   - Monitor for 24 hours
   - Increase to 25% if stable
   - Increase to 100% after 48 hours

#### iOS Rollback
1. **Immediate Rollback**
   - Submit new version to App Store
   - Request expedited review
   - Notify users of known issues

2. **Hotfix Release**
   - Fix critical issues
   - Build new IPA
   - Submit to App Store
   - Request expedited review

3. **Gradual Rollout**
   - Monitor App Store reviews
   - Respond to user feedback
   - Release updates as needed

#### Web Rollback
1. **Immediate Rollback**
   - Revert to previous deployment
   - Clear CDN cache
   - Notify users of issues

2. **Hotfix Release**
   - Fix critical issues
   - Build new version
   - Deploy to staging
   - Test thoroughly
   - Deploy to production

3. **Gradual Rollout**
   - Monitor error rates
   - Monitor user feedback
   - Release updates as needed

### Maintenance Schedule

#### Daily
- [ ] Monitor error rates
- [ ] Monitor crash reports
- [ ] Review user feedback
- [ ] Check system health

#### Weekly
- [ ] Review performance metrics
- [ ] Analyze user behavior
- [ ] Plan feature improvements
- [ ] Update documentation

#### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature roadmap review
- [ ] User satisfaction survey

#### Quarterly
- [ ] Major feature release
- [ ] UI/UX improvements
- [ ] Technology stack updates
- [ ] Business strategy review

---

## Conclusion

This comprehensive testing and deployment plan ensures that the Vivah Wedding Planner app is thoroughly tested and deployed successfully across all platforms. By following this plan, we can:

1. **Ensure Quality**: Comprehensive testing across all features and platforms
2. **Minimize Risk**: Gradual rollout with monitoring and rollback procedures
3. **Optimize Performance**: Continuous monitoring and optimization
4. **Improve User Experience**: Regular updates based on user feedback
5. **Maintain Security**: Regular security audits and updates

The plan is designed to be flexible and can be adjusted based on project requirements, timeline, and resources.

---

## Appendix

### A. Test Environment Setup

#### Android Test Environment
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set up Android SDK
# Configure environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Create virtual devices
# Use Android Studio AVD Manager
```

#### iOS Test Environment
```bash
# Install Xcode
# Download from Mac App Store

# Install iOS Simulator
# Included with Xcode

# Install CocoaPods
sudo gem install cocoapods

# Install dependencies
cd artifacts/vivah/ios
pod install
```

#### Web Test Environment
```bash
# Install Node.js
# Download from: https://nodejs.org/

# Install dependencies
cd artifacts/vivah
pnpm install

# Start development server
pnpm run web
```

### B. Testing Tools

#### Unit Testing
```bash
# Install Jest
pnpm add -D jest @testing-library/react-native @testing-library/jest-native

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage
```

#### E2E Testing
```bash
# Install Detox
pnpm add -D detox detox-cli

# Build for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug
```

#### Performance Testing
```bash
# Install Lighthouse
npm install -g lighthouse

# Run Lighthouse
lighthouse https://your-app.com --view
```

### C. Deployment Tools

#### EAS Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android

