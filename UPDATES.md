# Updates and Feature Documentation

## Role System and Premium Badge Implementation

### Overview
Implemented a comprehensive role-based access control system with premium badge support. Users can now have different roles (User, Trusted User, Moderator, Representative, Business Owner, Admin) and premium members can toggle the visibility of their premium badge.

### Backend Changes

#### 1. User Model (`auth-service/backend/app/models/user.py`)
- Added `UserRole` enum with 6 roles:
  - `USER` - Default role for all new users
  - `TRUSTED_USER` - Verified/trusted community members
  - `MODERATOR` - Content moderators
  - `REPRESENTATIVE` - Official representatives
  - `BUSINESS_OWNER` - Business accounts
  - `ADMIN` - System administrators
- Added `role` field to `UserBase`, `UserInDB`, and `UserResponse` (defaults to `USER`)
- Added `show_premium_badge` field (defaults to `True`) - allows premium users to hide their badge

#### 2. User Service (`auth-service/backend/app/services/user_service.py`)
- Updated `create_user()` to handle role and `show_premium_badge` fields
- Updated `get_user_by_email()` and `get_user_by_id()` to return role and `show_premium_badge`
- All new users default to `USER` role with `show_premium_badge = True`

#### 3. Authentication Middleware (`auth-service/backend/app/middleware/auth.py`)
- Added `require_role()` function - checks if user has one of the allowed roles
- Added `require_moderator()` function - requires MODERATOR or ADMIN role
- Added `require_admin()` function - requires ADMIN role only
- These can be used as FastAPI dependencies to protect routes

#### 4. Auth Router (`auth-service/backend/app/routers/auth.py`)
- Updated all `UserResponse` returns to include `role` and `show_premium_badge`
- Added `PATCH /auth/me/preferences` endpoint:
  - Allows users to update preferences like `show_premium_badge`
  - Requires authentication
  - Returns updated user information

### Frontend Changes

#### 1. User Types (`auth-service/frontend/src/types/auth.ts`)
- Added `UserRole` enum matching backend roles
- Updated `User` interface to include:
  - `role?: UserRole`
  - `show_premium_badge?: boolean`

#### 2. User Badge Component (`auth-service/frontend/src/components/UserBadge.tsx`)
- New component that displays user name with:
  - Premium badge (⭐) - purple star if `is_premium = true` AND `show_premium_badge = true`
  - Role badge emoji:
    - `TRUSTED_USER`: ✓ (green)
    - `MODERATOR`: 🛡️ (blue)
    - `REPRESENTATIVE`: 🏛️ (purple)
    - `BUSINESS_OWNER`: 🏢 (orange)
    - `ADMIN`: 👑 (red)
- Configurable size (small, medium, large)
- Can show/hide role badge

#### 3. Role Guard Hook (`auth-service/frontend/src/hooks/useRoleGuard.ts`)
- New hook providing role checking utilities:
  - `hasRole(role)` - check if user has specific role
  - `hasAnyRole(roles)` - check if user has any of the roles
  - `isModerator()` - check if user is moderator or admin
  - `isAdmin()` - check if user is admin
  - `isBusinessOwner()` - check if user is business owner
  - `isRepresentative()` - check if user is representative
  - `isTrusted()` - check if user is trusted or higher
  - `currentRole` - get current user's role

#### 4. Settings Page (`auth-service/frontend/src/pages/Settings.tsx`)
- New page for user preferences
- Premium badge toggle:
  - Only visible to premium users
  - Toggle to show/hide premium badge
  - Updates immediately via API
  - Shows success/error messages
- Account information display:
  - Current role
  - Premium status
  - Email and username

#### 5. Navbar Updates (`auth-service/frontend/src/components/Navbar.tsx`)
- Replaced plain username display with `UserBadge` component
- Now shows premium badge and role badge in navbar
- Badges are always visible (except premium badge can be toggled in settings)

#### 6. API Service (`auth-service/frontend/src/services/api.ts`)
- Added `updatePreferences()` method:
  - `PATCH /auth/me/preferences`
  - Updates user preferences like `show_premium_badge`
  - Returns updated user object

#### 7. App Routes (`auth-service/frontend/src/App.tsx`)
- Added `/settings` route (protected, requires login)

### Role System Details

#### Role Hierarchy
```
User < Trusted User < Representative < Business Owner < Moderator < Admin
```

#### Role Permissions (Planned)
- **User**: Create content, edit own content, view all public content
- **Trusted User**: All user permissions + auto-approved content, higher visibility
- **Representative**: All trusted permissions + official announcements, special categories
- **Business Owner**: All representative permissions + promoted listings, business analytics
- **Moderator**: All business owner permissions + moderate content, edit/delete others' content
- **Admin**: Full system access, user management, system configuration

#### Premium Badge
- **Visual**: Purple star (⭐) next to username
- **Visibility**: Can be toggled in Settings page
- **Behavior**: 
  - Only shown if `is_premium = true` AND `show_premium_badge = true`
  - Premium features remain active even if badge is hidden
  - Setting is per-user preference stored in database

### Usage Examples

#### Backend - Protecting Routes
```python
from app.middleware.auth import require_moderator, require_admin

@router.delete("/content/{id}")
async def delete_content(
    id: str,
    current_user: UserInDB = Depends(require_moderator)
):
    # Only moderators and admins can access this
    pass

@router.post("/admin/users/{id}/promote")
async def promote_user(
    id: str,
    current_user: UserInDB = Depends(require_admin)
):
    # Only admins can access this
    pass
```

#### Frontend - Checking Roles
```typescript
import { useRoleGuard } from '../hooks/useRoleGuard';

const { isModerator, isAdmin, hasRole } = useRoleGuard();

if (isModerator()) {
  // Show moderation UI
}

if (hasRole(UserRole.BUSINESS_OWNER)) {
  // Show business features
}
```

#### Frontend - Displaying User Badge
```typescript
import { UserBadge } from '../components/UserBadge';

<UserBadge 
  user={user} 
  showRole={true} 
  size="medium" 
/>
```

### Database Migration Notes

**Existing Users:**
- Existing users will have `role = "user"` (default)
- Existing users will have `show_premium_badge = true` (default)
- No migration needed - defaults are applied on read

**New Users:**
- All new users automatically get `role = "user"`
- All new users automatically get `show_premium_badge = true`

### Future Enhancements

1. **Role Management UI**: Admin interface to promote/demote users
2. **Role-Based Permissions**: Granular permission system per role
3. **Role Badge Customization**: Allow users to customize role badge display
4. **Audit Logging**: Track role changes and who made them
5. **Auto-Promotion**: Automatic promotion to Trusted User based on activity
6. **Business Profiles**: Separate business profile pages for Business Owner role
7. **Moderation Interface**: UI for moderators to review and manage content

### API Endpoints

#### Update User Preferences
```
PATCH /auth/me/preferences
Authorization: Bearer <token>
Body: {
  "show_premium_badge": true/false
}
Response: UserResponse (with updated preferences)
```

### Testing Checklist

- [x] User model includes role and show_premium_badge fields
- [x] New users default to USER role
- [x] Premium badge displays correctly when enabled
- [x] Premium badge can be hidden via settings
- [x] Role badges display correctly for each role
- [x] Settings page updates preferences successfully
- [x] API endpoint for preferences works correctly
- [x] Role guard hooks work correctly
- [x] Navbar displays UserBadge component

### Breaking Changes

**None** - This is a backward-compatible addition. Existing users will work with default values.

### Related Files

**Backend:**
- `auth-service/backend/app/models/user.py`
- `auth-service/backend/app/services/user_service.py`
- `auth-service/backend/app/middleware/auth.py`
- `auth-service/backend/app/routers/auth.py`

**Frontend:**
- `auth-service/frontend/src/types/auth.ts`
- `auth-service/frontend/src/components/UserBadge.tsx`
- `auth-service/frontend/src/hooks/useRoleGuard.ts`
- `auth-service/frontend/src/pages/Settings.tsx`
- `auth-service/frontend/src/components/Navbar.tsx`
- `auth-service/frontend/src/services/api.ts`
- `auth-service/frontend/src/App.tsx`

---

## User Profile Page and Helpdesk UI Updates

### Overview
Created a comprehensive user profile page with contribution statistics and premium management, plus updated the helpdesk (helpboard) UI with modern, card-based design.

### Backend Changes

#### 1. Auth Router - User Stats Endpoint (`auth-service/backend/app/routers/auth.py`)
- Added `GET /auth/me/stats` endpoint:
  - Returns user contribution statistics
  - Counts alerts, requests, responses, and reminders created by user
  - Returns total contributions count
  - Requires authentication

#### 2. Auth Router - Premium Management (`auth-service/backend/app/routers/auth.py`)
- Added `POST /auth/me/premium/upgrade` endpoint:
  - Upgrades user to premium status
  - Sets `is_premium = true` in database
  - Returns updated user information
  - Requires authentication
  - Prevents duplicate upgrades

- Added `POST /auth/me/premium/cancel` endpoint:
  - Cancels premium subscription
  - Sets `is_premium = false` in database
  - Returns updated user information
  - Requires authentication
  - Prevents cancellation if not premium

### Frontend Changes

#### 1. Profile Page (`auth-service/frontend/src/pages/Profile.tsx`)
- New comprehensive user profile page with:
  - **User Information Section:**
    - User badge with premium and role indicators
    - Email, username, role, and member since date
    - Link to settings page
  
  - **Contributions Section:**
    - Statistics cards showing:
      - Alerts created (🚨)
      - Requests created (📣)
      - Responses created (💬)
      - Reminders created (📋)
      - Total contributions (📊)
    - Visual cards with icons and counts
    - Loading states and error handling
  
  - **Premium Status Section:**
    - **For Premium Users:**
      - Active premium badge display
      - Description of premium features
      - Cancel premium button with confirmation
    - **For Non-Premium Users:**
      - Upgrade to premium section
      - List of premium features
      - Upgrade button
    - Success/error messages for actions

#### 2. API Service Updates (`auth-service/frontend/src/services/api.ts`)
- Added `getUserStats()` method:
  - Fetches user contribution statistics
  - Returns counts for alerts, requests, responses, reminders, and total
  
- Added `upgradeToPremium()` method:
  - Upgrades user to premium
  - Returns updated user object
  
- Added `cancelPremium()` method:
  - Cancels premium subscription
  - Returns updated user object

#### 3. Helpdesk UI Updates

##### Requests Page (`auth-service/frontend/src/pages/RequestsPage.tsx`)
- **Modern Card-Based Design:**
  - Grid layout for requests (responsive)
  - Individual request cards with:
    - Title and description
    - Status and urgency badges (color-coded)
    - Trade needed and budget information
    - Creation date
    - Response form integrated in each card
  
  - **Improved Layout:**
    - Header with title and subtitle
    - Create section with highlighted background
    - Loading and empty states
    - Better spacing and typography
  
  - **Status Badges:**
    - Color-coded status badges (Open: green, Closed: gray, Pending: yellow, Accepted: blue)
    - Urgency badges (High: red, Medium: yellow, Low: green)

##### Responses Page (`auth-service/frontend/src/pages/ResponsesPage.tsx`)
- **Enhanced Display:**
  - Statistics bar showing:
    - Total responses
    - Pending responses count
    - Accepted responses count
  
  - **Response Cards:**
    - Individual cards for each response
    - Request ID display
    - Status badges (color-coded)
    - Response message
    - Responder ID and date
    - Better visual hierarchy
  
  - **Status Colors:**
    - Accepted: green
    - Rejected: red
    - Pending: yellow
    - Completed: blue

##### Users Page (`auth-service/frontend/src/pages/UsersPage.tsx`)
- **Professional Layout:**
  - Header with title and subtitle
  - Create profile section
  - Search section with improved input
  - Error handling for location services
  
  - **User Cards:**
    - Grid layout for helper profiles
    - Availability badges (color-coded)
    - Trade information with experience years
    - Rate information (if available)
    - Service radius display
  
  - **Search Improvements:**
    - Better search input styling
    - Enter key support
    - Loading states
    - Error messages

#### 4. Navigation Updates (`auth-service/frontend/src/components/Navbar.tsx`)
- Added "Profile" link to navbar (visible when authenticated)
- Links to `/profile` page

#### 5. App Routes (`auth-service/frontend/src/App.tsx`)
- Added `/profile` route (protected, requires login)

### Features

#### User Profile Page
- **Contribution Statistics:**
  - Real-time counts of user contributions
  - Visual cards with icons
  - Total contributions summary
  
- **Premium Management:**
  - One-click upgrade to premium
  - Cancel premium with confirmation
  - Clear premium feature descriptions
  - Status indicators

#### Helpdesk UI Improvements
- **Modern Design:**
  - Card-based layouts
  - Color-coded badges
  - Better spacing and typography
  - Responsive grid layouts
  
- **Enhanced UX:**
  - Loading states
  - Empty states with helpful messages
  - Error handling
  - Better visual hierarchy
  
- **Status Indicators:**
  - Color-coded status badges
  - Urgency indicators
  - Availability badges

### API Endpoints

#### Get User Statistics
```
GET /auth/me/stats
Authorization: Bearer <token>
Response: {
  "alerts": number,
  "requests": number,
  "responses": number,
  "reminders": number,
  "total": number
}
```

#### Upgrade to Premium
```
POST /auth/me/premium/upgrade
Authorization: Bearer <token>
Response: UserResponse (with is_premium = true)
```

#### Cancel Premium
```
POST /auth/me/premium/cancel
Authorization: Bearer <token>
Response: UserResponse (with is_premium = false)
```

### Usage Examples

#### Accessing Profile Page
Navigate to `/profile` (requires login) to view:
- Your contribution statistics
- Premium status and management
- Account information

#### Upgrading to Premium
1. Go to Profile page
2. Click "Upgrade to Premium" button
3. Premium status is updated immediately
4. Premium badge appears in navbar

#### Cancelling Premium
1. Go to Profile page
2. Click "Cancel Premium" button
3. Confirm cancellation
4. Premium status is removed

### UI Improvements Summary

**Before:**
- Simple list-based layouts
- Basic styling
- Limited visual feedback
- No statistics display

**After:**
- Modern card-based designs
- Color-coded badges and indicators
- Comprehensive statistics
- Better user experience
- Professional appearance

### Related Files

**Backend:**
- `auth-service/backend/app/routers/auth.py`

**Frontend:**
- `auth-service/frontend/src/pages/Profile.tsx`
- `auth-service/frontend/src/pages/RequestsPage.tsx`
- `auth-service/frontend/src/pages/ResponsesPage.tsx`
- `auth-service/frontend/src/pages/UsersPage.tsx`
- `auth-service/frontend/src/services/api.ts`
- `auth-service/frontend/src/components/Navbar.tsx`
- `auth-service/frontend/src/App.tsx`

