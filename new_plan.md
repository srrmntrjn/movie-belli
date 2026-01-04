# Movie Belli - Social Features Implementation Plan

## Overview

Building social features for Movie Belli to enable users to discover, follow, and share movie ratings with each other. Implementing features in priority order as specified.

## Current State

**✅ Completed:**
- Infrastructure setup (Next.js, Prisma, Supabase, Vercel)
- Google OAuth authentication
- Movie search with TMDB API integration
- Basic rating system (bad/ok/great categories)
- Database schema with User, Rating, Activity, Friendship models

**📍 Current Database Schema:**
- User model: has username (optional), name, email, image, bio
- Rating model: userId, tmdbId, rating (Float), timestamps
- Activity model: tracks RATED_MOVIE, REVIEWED_MOVIE, etc.
- Friendship model: exists but designed for mutual friendships (PENDING/ACCEPTED status)

## Feature Requirements (Priority Order)

1. **My Reviews Page** - View all movies user has rated
2. **User Search** - Search for other users by username/name
3. **Follow System** - Follow/unfollow other users
4. **Activity Feed** - Dashboard showing top 10 recent reviews from followed users
5. **Following List** - View all users being followed
6. **User Profile** - View any user's profile with their rated movies

## Key Design Decisions

### 1. Follow System Architecture
**Decision:** Create new `Follow` model (one-directional) instead of using `Friendship` model.

**Rationale:**
- Twitter-like UX where follows don't require acceptance
- Simpler queries (no bidirectional relationship checks)
- Clearer separation of concerns
- Allows keeping Friendship for future mutual friend features

### 2. Username Handling
**Decision:** Username remains OPTIONAL but encouraged.

**Implementation:**
- Profile URLs work as `/users/[identifier]` where identifier can be username OR ID
- Users can set username later for cleaner URLs
- Search works on both username and name fields

### 3. Profile Visibility
**Decision:** Public profiles by default, authentication required to follow/interact.

**Benefits:**
- Encourages discovery and sharing
- SEO-friendly user profiles
- Still protects write actions behind auth

---

## Implementation Plan

### Phase 1: Database Schema Changes

**File:** `prisma/schema.prisma`

#### Add Follow Model

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   // User who follows
  followingId String   // User being followed
  createdAt   DateTime @default(now())

  follower  User @relation("UserFollows", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

#### Update User Model

```prisma
// Add to User model relations:
following  Follow[] @relation("UserFollows")
followers  Follow[] @relation("UserFollowers")
```

#### Migration Commands

```bash
npx prisma migrate dev --name add-follow-model
npx prisma generate
```

---

### Phase 2: Feature 1 - My Reviews Page

**Priority:** 1
**Time Estimate:** 3-4 hours

#### 2.1 Create API Route

**File:** `src/app/api/users/me/reviews/route.ts`

**Functionality:**
- GET endpoint requiring authentication
- Query current user's ratings from Rating model
- For each rating, fetch movie data from TMDB API
- Return combined data: `{ rating, movie, createdAt }`

**Key Code Pattern:**
```typescript
const session = await auth();
if (!session?.user?.id) return 401;

const ratings = await prisma.rating.findMany({
  where: { userId: session.user.id },
  orderBy: { createdAt: 'desc' }
});

// Fetch TMDB data for each rating
const moviesWithRatings = await Promise.all(
  ratings.map(async (rating) => {
    const movie = await tmdb.getMovie(rating.tmdbId);
    return { rating: rating.rating, movie, createdAt: rating.createdAt };
  })
);
```

#### 2.2 Create MovieRatingCard Component

**File:** `src/components/movie/MovieRatingCard.tsx`

**Features:**
- Extends existing MovieCard pattern
- Displays movie poster, title, year
- Shows user's rating with color coding (bad=red, ok=yellow, great=green)
- Shows rating date
- Click to view movie details (reuse MovieDetailModal)

**Props:**
```typescript
interface MovieRatingCardProps {
  movie: Movie;
  rating: number;
  createdAt: Date;
  showReviewer?: boolean; // For feed display
  reviewer?: { name: string; username?: string; image?: string };
}
```

#### 2.3 Create My Reviews Page

**File:** `src/app/my-reviews/page.tsx`

**Features:**
- Client component (interactive)
- Fetch from `/api/users/me/reviews`
- Grid layout using MovieRatingCard
- Sort options: date, rating, title
- Loading skeleton states
- Empty state: "You haven't rated any movies yet"

**Layout:**
- Header: "My Reviews" + count
- Grid: 2-3-4-5 columns (responsive)
- Each card links to movie details

#### 2.4 Add Navigation

**File:** `src/app/dashboard/page.tsx`

Update Quick Actions section to include "My Reviews" link.

---

### Phase 3: Feature 2 - User Search

**Priority:** 2
**Time Estimate:** 3-4 hours

#### 3.1 Create UserCard Component

**File:** `src/components/user/UserCard.tsx`

**Features:**
- Display user avatar (Next.js Image)
- Display name and @username
- Optional bio snippet
- Follow button (placeholder for now)
- Link to user profile

**Props:**
```typescript
interface UserCardProps {
  user: {
    id: string;
    name: string;
    username?: string;
    image?: string;
    bio?: string;
  };
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowToggle?: (userId: string) => void;
}
```

#### 3.2 Create User Search API

**File:** `src/app/api/users/search/route.ts`

**Functionality:**
- GET endpoint with `?q=query` parameter
- Requires authentication
- Search User model by username and name (case-insensitive)
- Exclude current user from results
- Return max 20 results

**Query Pattern:**
```typescript
const users = await prisma.user.findMany({
  where: {
    AND: [
      { id: { not: session.user.id } }, // Exclude self
      {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      }
    ]
  },
  take: 20,
  select: { id: true, name: true, username: true, image: true, bio: true }
});
```

#### 3.3 Add Search to Dashboard

**File:** `src/app/dashboard/page.tsx`

**Features:**
- Search input with Search icon
- Debouncing (500ms) before API call
- Display UserCard list below input
- Loading state while searching
- Empty state: "No users found"

**Alternative:** Create separate `/users/search` page if dashboard gets crowded.

---

### Phase 4: Feature 3 - Follow System

**Priority:** 3
**Time Estimate:** 4-5 hours

#### 4.1 Create Follow API

**File:** `src/app/api/follows/route.ts`

**POST - Follow User:**
- Body: `{ userId: string }`
- Validate user exists
- Prevent self-following
- Create Follow record
- Create ADDED_FRIEND activity
- Return success

**DELETE - Unfollow User:**
- Body: `{ userId: string }`
- Delete Follow record
- Return success

**Key Validations:**
```typescript
// Prevent self-follow
if (userId === session.user.id) {
  return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
}

// Check if user exists
const userExists = await prisma.user.findUnique({ where: { id: userId } });
if (!userExists) {
  return NextResponse.json({ error: "User not found" }, { status: 404 });
}

// Create follow
await prisma.follow.create({
  data: {
    followerId: session.user.id,
    followingId: userId
  }
});
```

#### 4.2 Create FollowButton Component

**File:** `src/components/user/FollowButton.tsx`

**Features:**
- Self-contained follow/unfollow logic
- Calls `/api/follows` POST/DELETE
- Optimistic UI updates
- Loading state during API call
- Error handling with toast/alert

**Props:**
```typescript
interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}
```

**UI States:**
- Following: "Following" button (secondary style)
- Not following: "Follow" button (primary style)
- Loading: Disabled with spinner

#### 4.3 Integrate FollowButton

**Files to Update:**
- `src/components/user/UserCard.tsx` - Add FollowButton when `showFollowButton=true`
- User search results - Pass current follow status to UserCard

#### 4.4 Add Follow Status Check API

**File:** `src/app/api/users/[identifier]/following/route.ts`

**Purpose:** Check if current user follows target user
**Returns:** `{ isFollowing: boolean }`

---

### Phase 5: Feature 4 - Activity Feed

**Priority:** 4
**Time Estimate:** 4-5 hours

#### 5.1 Create Feed API

**File:** `src/app/api/feed/route.ts`

**Functionality:**
- GET endpoint requiring authentication
- Query Activity where userId IN (followed user IDs)
- Filter by type: RATED_MOVIE, REVIEWED_MOVIE
- Join with User for reviewer info
- Order by createdAt DESC, limit 10
- Fetch TMDB data for each movie
- Return: `{ activity, user, movie }[]`

**Query Pattern:**
```typescript
// Get followed user IDs
const follows = await prisma.follow.findMany({
  where: { followerId: session.user.id },
  select: { followingId: true }
});
const followedIds = follows.map(f => f.followingId);

// Get recent activities
const activities = await prisma.activity.findMany({
  where: {
    userId: { in: followedIds },
    type: { in: ['RATED_MOVIE', 'REVIEWED_MOVIE'] }
  },
  include: { user: { select: { id, name, username, image } } },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

#### 5.2 Create ActivityFeedItem Component

**File:** `src/components/feed/ActivityFeedItem.tsx`

**Features:**
- Display user avatar + name + "@username"
- Show action: "rated [movie]" or "reviewed [movie]"
- Display movie poster thumbnail
- Show rating with color coding
- Format timestamp: "2 hours ago" (use date-fns)
- Click user → go to profile
- Click movie → open MovieDetailModal

**Layout:**
```
[Avatar] [Name] rated [Movie Poster]
         @username        [Title]
         2 hours ago      ⭐ 5.0
```

#### 5.3 Add Feed to Dashboard

**File:** `src/app/dashboard/page.tsx`

**Features:**
- New section: "Recent Activity from People You Follow"
- Fetch from `/api/feed`
- Display ActivityFeedItem list
- Loading skeleton (10 items)
- Empty state: "Follow users to see their activity here" + link to search

**Position:** Between Quick Actions and Infrastructure Status sections.

---

### Phase 6: Feature 5 - Following List

**Priority:** 5
**Time Estimate:** 2-3 hours

#### 6.1 Create Following API

**File:** `src/app/api/users/me/following/route.ts`

**Functionality:**
- GET endpoint requiring authentication
- Query Follow where followerId = current user
- Join with User to get following users' data
- Return user list with follow dates

**Query:**
```typescript
const following = await prisma.follow.findMany({
  where: { followerId: session.user.id },
  include: {
    following: {
      select: { id, name, username, image, bio }
    }
  },
  orderBy: { createdAt: 'desc' }
});

return following.map(f => ({
  ...f.following,
  followedAt: f.createdAt
}));
```

#### 6.2 Create Following Page

**File:** `src/app/following/page.tsx`

**Features:**
- Client component
- Fetch from `/api/users/me/following`
- Display count: "Following X users"
- List of UserCard with unfollow button
- Loading states
- Empty state: "You're not following anyone yet"

**Layout:**
- Header with count
- Grid/list of UserCard components
- Each card shows follow date: "Following since [date]"

#### 6.3 Add Navigation

**File:** `src/app/dashboard/page.tsx`

Add "Following" link to Quick Actions or header navigation.

---

### Phase 7: Feature 6 - User Profile Page

**Priority:** 6
**Time Estimate:** 5-6 hours

#### 7.1 Create User Profile API

**File:** `src/app/api/users/[identifier]/route.ts`

**Functionality:**
- GET endpoint (public - no auth required for viewing)
- Support both username and ID lookup
- Query user data
- Query user's ratings/reviews
- Fetch TMDB data for movies
- Calculate stats: review count, followers count, following count

**Query Pattern:**
```typescript
// Try username first, fallback to ID
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { username: identifier },
      { id: identifier }
    ]
  },
  include: {
    ratings: { orderBy: { createdAt: 'desc' } },
    _count: { select: { followers: true, following: true } }
  }
});

// Fetch TMDB data for user's ratings
const movies = await Promise.all(
  user.ratings.map(r => tmdb.getMovie(r.tmdbId))
);
```

#### 7.2 Create User Profile Page

**File:** `src/app/users/[identifier]/page.tsx`

**Type:** Server component with client interactions

**Features:**

**Header Section:**
- User avatar (large)
- Name and @username
- Bio
- Stats row: X Reviews | X Followers | X Following
- FollowButton (if viewing other user's profile)
- "Edit Profile" button (if viewing own profile - future)

**Reviews Section:**
- Grid of MovieRatingCard showing user's rated movies
- Same layout as My Reviews page
- Sort options
- Pagination if > 50 reviews

**Empty State:**
- If user has no reviews: "No reviews yet"

**Layout Pattern:**
```
┌──────────────────────────────────────┐
│  [Avatar]  Name                      │
│           @username                  │
│           Bio text here              │
│  X Reviews | X Followers | X Following
│  [Follow Button]                     │
├──────────────────────────────────────┤
│  Reviews:                            │
│  [Movie] [Movie] [Movie]             │
│  [Movie] [Movie] [Movie]             │
└──────────────────────────────────────┘
```

#### 7.3 Update Links Throughout App

**Files to Update:**
- `src/components/user/UserCard.tsx` - Link to `/users/[username|id]`
- `src/components/feed/ActivityFeedItem.tsx` - Link user to profile
- `src/app/dashboard/page.tsx` - Add link to own profile

---

## Reusable Components Summary

### 1. UserCard
**File:** `src/components/user/UserCard.tsx`
**Purpose:** Display user with optional follow button
**Used In:** Search, Following list, Feed

### 2. MovieRatingCard
**File:** `src/components/movie/MovieRatingCard.tsx`
**Purpose:** Display movie with rating overlay
**Used In:** My Reviews, User Profile, Feed

### 3. ActivityFeedItem
**File:** `src/components/feed/ActivityFeedItem.tsx`
**Purpose:** Display activity with user and movie
**Used In:** Dashboard feed

### 4. FollowButton
**File:** `src/components/user/FollowButton.tsx`
**Purpose:** Self-contained follow/unfollow logic
**Used In:** UserCard, Profile header

### 5. EmptyState
**File:** `src/components/ui/EmptyState.tsx`
**Purpose:** Generic empty state with icon, title, description, CTA
**Used In:** All pages with empty states

---

## Technical Patterns

### Authentication Pattern
```typescript
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Database Query Pattern
```typescript
import { prisma } from "@/lib/prisma";

const data = await prisma.model.findMany({
  where: { /* conditions */ },
  include: { /* relations */ },
  orderBy: { /* ordering */ }
});
```

### TMDB Integration Pattern
```typescript
import { tmdb } from "@/lib/tmdb";

const movie = await tmdb.getMovie(tmdbId);
const posterUrl = tmdb.getPosterUrl(movie.poster_path);
```

### Error Handling Pattern
```typescript
try {
  // Operation
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json(
    { error: "User-friendly message" },
    { status: 500 }
  );
}
```

### Loading State Pattern
```typescript
const [loading, setLoading] = useState(false);

// In component JSX:
{loading ? (
  <Loader2 className="h-5 w-5 animate-spin" />
) : (
  // Content
)}
```

---

## File Structure Overview

```
src/
├── app/
│   ├── api/
│   │   ├── feed/
│   │   │   └── route.ts                    ⭐ NEW - Activity feed
│   │   ├── follows/
│   │   │   └── route.ts                    ⭐ NEW - Follow/unfollow
│   │   └── users/
│   │       ├── search/
│   │       │   └── route.ts                ⭐ NEW - User search
│   │       ├── me/
│   │       │   ├── reviews/
│   │       │   │   └── route.ts            ⭐ NEW - My reviews
│   │       │   └── following/
│   │       │       └── route.ts            ⭐ NEW - Following list
│   │       └── [identifier]/
│   │           ├── route.ts                ⭐ NEW - User profile data
│   │           └── following/
│   │               └── route.ts            ⭐ NEW - Follow status check
│   ├── my-reviews/
│   │   └── page.tsx                        ⭐ NEW - My reviews page
│   ├── following/
│   │   └── page.tsx                        ⭐ NEW - Following list page
│   ├── users/
│   │   └── [identifier]/
│   │       └── page.tsx                    ⭐ NEW - User profile page
│   └── dashboard/
│       └── page.tsx                        🔧 UPDATE - Add feed section
├── components/
│   ├── user/
│   │   ├── UserCard.tsx                    ⭐ NEW
│   │   └── FollowButton.tsx                ⭐ NEW
│   ├── movie/
│   │   └── MovieRatingCard.tsx             ⭐ NEW
│   ├── feed/
│   │   └── ActivityFeedItem.tsx            ⭐ NEW
│   └── ui/
│       └── EmptyState.tsx                  ⭐ NEW
└── lib/
    └── utils/
        └── date.ts                         ⭐ NEW - Date formatting
```

**Legend:**
- ⭐ NEW - File to create
- 🔧 UPDATE - File to modify

---

## Implementation Checklist

### Database
- [ ] Add Follow model to schema
- [ ] Update User model with relations
- [ ] Run migration
- [ ] Generate Prisma client

### Feature 1: My Reviews
- [ ] Create `/api/users/me/reviews` route
- [ ] Create MovieRatingCard component
- [ ] Create `/my-reviews` page
- [ ] Add navigation link

### Feature 2: User Search
- [ ] Create UserCard component
- [ ] Create `/api/users/search` route
- [ ] Add search section to dashboard
- [ ] Test search functionality

### Feature 3: Follow System
- [ ] Create `/api/follows` route (POST/DELETE)
- [ ] Create FollowButton component
- [ ] Integrate FollowButton into UserCard
- [ ] Create follow status check API
- [ ] Test follow/unfollow flow

### Feature 4: Activity Feed
- [ ] Create `/api/feed` route
- [ ] Create ActivityFeedItem component
- [ ] Add feed section to dashboard
- [ ] Test feed with followed users
- [ ] Add empty state

### Feature 5: Following List
- [ ] Create `/api/users/me/following` route
- [ ] Create `/following` page
- [ ] Add navigation link
- [ ] Test unfollow from list

### Feature 6: User Profile
- [ ] Create `/api/users/[identifier]` route
- [ ] Create `/users/[identifier]` page
- [ ] Add profile header with stats
- [ ] Add reviews grid
- [ ] Update links throughout app
- [ ] Test both username and ID lookup

### Polish
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Test responsive design
- [ ] Add empty states everywhere
- [ ] Test all flows end-to-end

---

## Critical Files Reference

**Schema:** `/Users/sriramnatarajan/Projects/movie-belli/prisma/schema.prisma`
**Auth:** `/Users/sriramnatarajan/Projects/movie-belli/src/lib/auth.ts`
**Prisma:** `/Users/sriramnatarajan/Projects/movie-belli/src/lib/prisma.ts`
**TMDB:** `/Users/sriramnatarajan/Projects/movie-belli/src/lib/tmdb.ts`
**Example API:** `/Users/sriramnatarajan/Projects/movie-belli/src/app/api/movies/rate/route.ts`
**Example Component:** `/Users/sriramnatarajan/Projects/movie-belli/src/components/movie/MovieCard.tsx`
**Dashboard:** `/Users/sriramnatarajan/Projects/movie-belli/src/app/dashboard/page.tsx`

---

## Next Steps After Implementation

1. **Performance Optimization**
   - Add pagination to reviews (10-20 per page)
   - Implement virtual scrolling for long lists
   - Add caching layer (Redis/Upstash)

2. **Enhanced Features**
   - Review text field
   - Review likes/comments
   - Notifications for new followers
   - Movie recommendations based on followed users

3. **Analytics**
   - Track popular movies
   - Track user engagement
   - Feed optimization based on user behavior

4. **Testing**
   - Unit tests for API routes
   - E2E tests for critical flows
   - Load testing for feed queries
