# Sila — Frontend

*Connections that never end.*

The React frontend for the Sila social media platform: feed, profiles, follow/friend requests, comments and reactions, bookmarks, real-time one-to-one and group chat, and push notifications.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO--client-4-010101?logo=socket.io&logoColor=white)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Routes](#routes)
7. [Data Layer](#data-layer)
8. [Real-Time Chat](#real-time-chat)
9. [Push Notifications](#push-notifications)
10. [Theming](#theming)
11. [Known Issues](#known-issues)
12. [Roadmap](#roadmap)

---

## Features

- **Auth:** email/password signup with OTP email confirmation, login, Google sign-in, forgot/reset password.
- **Feed:** create posts with up to 2 images, reactions (like, love, laugh, wow, sad, angry), comments with replies and @mentions, bookmarks.
- **Social graph:** follow/unfollow, friend requests (send, accept, decline, cancel, unfriend), block/unblock, user search.
- **Profile:** view your own or another user's profile, edit profile photo, cover photo and bio.
- **Notifications:** in-app list with unread badge that clears automatically when the page is opened; push notifications via Firebase Cloud Messaging.
- **Messaging:** one-to-one and group chat over Socket.IO — send, edit, delete and reply to messages, create/manage groups.

## Tech Stack & Dependencies

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI |
| `react-router-dom` | Routing, including protected/guest route guards |
| `@tanstack/react-query` | Server-state fetching, caching and mutations |
| `axios` | HTTP client (`src/services/apiClient.js`) |
| `socket.io-client` | Real-time chat |
| `firebase` | Cloud Messaging (push notifications) |
| `formik` + `yup` | Forms and validation |
| `react-hot-toast` | Toast notifications |
| `react-spinners` / `react-loader-spinner` | Loading states |
| `react-slick` + `slick-carousel` | Carousels |
| `tailwindcss` + `@tailwindcss/vite` | Styling (v4, CSS-first `@theme` config) |

Dev tooling: **Vite** (using the `rolldown-vite` build, see `package.json` `overrides`) and **ESLint**.

## Project Structure

```text
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Routes, QueryClientProvider, Firebase foreground listener
├── App.css                  # Tailwind v4 @theme tokens (colors, fonts)
├── index.css                # Global styles
├── context/
│   └── UserContext.jsx      # Auth state, token storage, session restore
├── services/                # One file per backend resource; all HTTP calls live here
├── Hooks/                   # Shared React Query hooks (posts, chats, followers, unread count)
├── utils/
│   ├── api.js                # Response-shape helpers (extractList, extractItem, getId, ensureArray)
│   └── constants.js          # Enums, notification/reaction mappings, initials()
└── components/
    ├── Login, Register, ForgotPassword, ResetPassword, VerifyEmail, VerifyResetOtp
    ├── Home, CreatePost, PostCard, PostDetails, Comments, ReactionButton, MentionInput
    ├── Profile, SearchUsers, FriendRequests, BlockedUsers
    ├── Chats, ChatDirect, ChatGroup, Chat/ (MessageBubble, ChatComposer)
    ├── Notifications, Bookmarks
    ├── Navbar, Header, Layout, AuthLayout, BrandMark, Avatar, Loader, Notfound
    └── ProtectedRoute, GuestRoute
```

Each `services/*.js` file wraps the matching backend module (e.g. `friendRequestService.js` ↔ the backend's `friend-request` routes) so the request shape for one REST resource lives in one place.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- The backend running and reachable (see its own README)
- A Firebase project with Cloud Messaging enabled, if you want push notifications
- A Google OAuth web client ID, if you want "Sign in with Google"

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

Create `.env` in the project root — see [Environment Variables](#environment-variables).

### 3. Run

```bash
npm run dev       # start the dev server
npm run build      # production build
npm run preview    # preview the production build locally
npm run lint        # ESLint
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL of the backend API (e.g. `http://localhost:3000`) |
| `VITE_FIREBASE_API_KEY` | For push | Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | For push | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | For push | Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | For push | Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | For push | Firebase config |
| `VITE_FIREBASE_APP_ID` | For push | Firebase config |
| `VITE_FIREBASE_MEASUREMENT_ID` | For push | Firebase config |
| `VITE_FIREBASE_VAPID_KEY` | For push | Web push certificate key |
| `VITE_GOOGLE_CLIENT_ID` | For Google sign-in | Must also be added to that OAuth client's authorized JavaScript origins |

> **If you change the Firebase project**, update `.env` **and** the hardcoded copy of the same config in `public/firebase-messaging-sw.js` — a service worker can't read Vite env vars at runtime, so the two have to be kept in sync by hand.

Never commit real values — keep `.env` out of version control.

## Routes

| Path | Component | Access |
|---|---|---|
| `/login`, `/signup`, `/forgot-password`, `/verify-reset-otp`, `/reset-password`, `/verify-email` | Auth pages | Guests only (redirects away if already logged in) |
| `/` | Home (feed) | Protected |
| `/search` | SearchUsers | Protected |
| `/notifications` | Notifications | Protected |
| `/post/:id` | PostDetails | Protected |
| `/bookmarks` | Bookmarks | Protected |
| `/blocked` | BlockedUsers | Protected |
| `/friend-requests` | FriendRequests | Protected |
| `/profile`, `/profile/:id` | Profile | Protected |
| `/chats` | Chats (inbox) | Protected |
| `/chats/user/:userId` | ChatDirect | Protected |
| `/chats/group/:id` | ChatGroup | Protected |
| `*` | Notfound | — |

"Protected" routes require a valid session (`ProtectedRoute`); auth pages are wrapped in `GuestRoute` so a logged-in user is bounced back to `/`.

## Data Layer

- **React Query** owns all server state; each `Hooks/*` and component defines its own `queryKey` and calls `queryClient.invalidateQueries([...])` after a mutation that should refresh it.
- **Response shape:** the backend wraps everything as `{ message, status, data }`, and list endpoints nest paginated results one level deeper (`data.docs`). `src/utils/api.js` centralizes unwrapping this safely:
  - `extractList(payload, keys)` — pulls an array out from under several possible key names.
  - `extractItem(payload)` — pulls a single object out of the envelope.
  - `getId(obj)` — reads an id off a document regardless of whether it's `_id` or `id`.
- **Auth:** `UserContext` holds the token (persisted to `localStorage`) and the current user, fetched via `userService.getProfile()` on load. The access token is attached to every request by an axios interceptor in `apiClient.js`, sent **raw, without a `Bearer` prefix** (that's what the backend expects).

## Real-Time Chat

`services/socket.js` opens a single Socket.IO connection authenticated with the access token, created once after login and reused by `ChatDirect` and `ChatGroup`.

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `sendMessage` | `{ sendTo, content }` |
| Client → Server | `sendGroupMessage` | `{ groupId, content }` |
| Client → Server | `join_room` | `{ roomId }` |
| Client → Server | `editMessage` | `{ chatId, messageId, content }` |
| Client → Server | `deleteMessage` | `{ chatId, messageId }` |
| Server → Client | `newMessage` | A message from someone else |
| Server → Client | `successMessage` | Delivery confirmation to the sender |
| Server → Client | `message_edited` | `{ chatId, messageId, content }` |
| Server → Client | `message_deleted` | `{ chatId, messageId }` |
| Server → Client | `custom_error` | `{ message, statusCode }` |

New messages are added to the UI optimistically (with a temporary `local-<timestamp>` id) before the server confirms them; edit/delete are blocked on messages that haven't been confirmed yet, since the server doesn't know their real id.

## Push Notifications

`services/pushNotifications.js` registers the Firebase service worker (`public/firebase-messaging-sw.js`) and requests a device token, which is sent to the backend on login so it can target this device. `App.jsx` also listens for **foreground** messages while the tab is open and shows them as a toast, in addition to invalidating the notifications and unread-count queries so the badge updates immediately.

## Theming

Tailwind v4's CSS-first `@theme` block in `src/App.css` defines the design tokens used throughout:

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#2F6F5E` | Brand green |
| `--color-primary-soft` | `#E4EFEC` | Soft backgrounds, highlights |
| `--color-bg` | `#EEF1EF` | Page background |
| `--color-panel` | `#FFFFFF` | Cards, modals |
| `--color-ink` / `--color-ink-soft` / `--color-ink-faint` | `#182420` / `#57655F` / `#8A968F` | Text, by emphasis |
| `--color-border` | `#D7DEDA` | Borders, dividers |
| `--color-like` | `#DD5B45` | Destructive actions, like/react |
| `--color-gold` | `#C98A2B` | Accents |

---

## Known Issues

Found while integrating against the live backend. Fix status as of this write-up:

- **Group chat — new messages never get their real id (open).** The backend's `successMessage` event for `sendGroupMessage` doesn't include a `messageId`, so a message you just sent keeps its temporary `local-<timestamp>` id until the chat is reloaded from the server — which is also why edit/delete are disabled on a message you just sent in the same session.
- **Accept / Reject / Cancel friend request can fail (open).** The status endpoint the UI uses to decide which button to show never returns the underlying `FriendRequest` document's real id, so those three actions fall back to an id that isn't always correct. Unfriend happens to use the right id by coincidence.
- **`reactMessage` isn't implemented on the backend yet.** The chat UI has a reaction affordance on message bubbles, but there's no backend support for message-level reactions (only post/comment reactions exist).
- **`GET /user/:userId` profile data can be stale after editing.** Profile edits invalidate the current user's own cached profile, but a page that's viewing *that* user via `/profile/:id` (opened from somewhere else) doesn't automatically refetch.

## Roadmap

- Real `messageId` on group `successMessage` so edit/delete work on just-sent messages without a reload
- Message-level reactions end-to-end (needs backend support first)
- Proper friend-request id round-trip (status endpoint returning the request id directly)
- Typing indicators and read receipts
- Automated tests