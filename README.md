# صلة (Sila) — Social Media Frontend

*Connections that never end*

React 19 + Vite frontend for the Social-Media-App backend, matching the folder/component
conventions of your `freshCart` project (Tailwind v4, Context API, `@tanstack/react-query`,
Formik + Yup, `react-hot-toast`).

## Getting started

```bash
npm install
npm run dev
```

`.env` already has the API base URL and your Firebase config from the demo you sent:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_...
```

If you ever swap Firebase projects, update `.env` **and** the hardcoded copy in
`public/firebase-messaging-sw.js` — service workers can't read Vite env vars at runtime.

## What's new in this pass

- **Branding**: logo + "صلة" wordmark (Reem Kufi) in the top header (left) with Logout
  (right); same wordmark + slogan on Login/Register; an animated infinity mark + slogan
  as the loading state everywhere (`Loader.jsx`).
- **Auth flow unchanged**: Signup → confirm-email OTP → Login → Feed, as confirmed.
- **Profile**: `GET /user/:userId` now powers viewing anyone's profile. Buttons:
  - **Follow / Following** — from `GET /follow/status/:followingId`.
  - **Add friend / Requested / Accept+Decline / Friends ✓** — from
    `GET /friend-request/:friendId/status`, using whatever `status` value comes back
    (`none` / `pending_sent` / `pending_received` / `friends` assumed — see below).
  - **Message** — appears once you're friends, opens `/chats/user/:id`.
  - **⋮ menu → Block** — `POST /block/:blockedId`.
- **Notifications**: mapped by `type` (`LIKE`, `COMMENT`, `REPLY`, `TAG`, `MENTION`,
  `POST`, `FOLLOW`, `FRIEND_REQUEST`, `REPOST`, `GROUP_ADD`, `NEW_LOGIN`) to an icon +
  friendly sentence in `src/utils/constants.js`.
- **Real-time chat** (`socket.io-client`): connects on login with the JWT in the
  handshake `auth`. One-to-one at `/chats/user/:userId` (`GET /user/:userId/chat` for
  history, `sendMessage`/`newMessage`), groups at `/chats/group/:id`
  (`join_room`, `sendGroupMessage`), both sharing a message bubble with a **⋮ menu**:
  React / Reply / Edit / Delete.
- **FCM push notifications**: `Login.jsx` registers the service worker, asks for
  notification permission, gets an FCM token, and sends it as `fcm` in the login body
  — all best-effort, so login still works if the browser/permission doesn't cooperate.
  Foreground pushes toast + refresh the notifications list; background pushes are
  handled by `public/firebase-messaging-sw.js`.

## Assumptions to verify against your live backend

1. **Friend status values** — `checkFriendRequestStatus` is assumed to return
   `{ status: "none" | "pending_sent" | "pending_received" | "friends", requestId }`.
   If your backend uses different strings, update the `friendStatus === "..."` checks
   in `Profile.jsx`.
2. **Follow status shape** — assumed `{ isFollowing: boolean }` (a few fallback field
   names are already tried in `Profile.jsx`).
3. **Chat message edit/delete/react — client emit names.** The docs you sent only
   document the *broadcast* events (`message_edited`, `message_deleted`), not what the
   frontend should emit to trigger them. `MessageBubble`'s menu currently emits
   `editMessage` / `deleteMessage` / `reactMessage` as best guesses — grep for
   "ASSUMPTION" in `ChatDirect.jsx` and `ChatGroup.jsx` and swap in the real event
   names once you confirm them. Message-level **reactions aren't documented at all**
   (only post reactions are), so `reactMessage` is a placeholder — it'll just fail
   silently (or hit `custom_error`) until the backend supports it.
4. **"Reply" is client-side only** — there's no `replyTo` field in the `sendMessage` /
   `sendGroupMessage` payloads, so replying just prefixes the outgoing message with a
   quoted snippet of the original (`↩ original text\nyour reply`). If the backend adds
   real reply support, swap this for a proper `replyTo: messageId` field.
5. **Chat/group message history shape** — assumed `GET /user/:userId/chat` and
   `GET /user/chat/group/:groupId` return the conversation with a `messages` array
   already populated. Adjust the `useEffect` that seeds `messages` in `ChatDirect.jsx`
   / `ChatGroup.jsx` if the real shape differs.
6. **Reaction values (1–6)** and **gender (1/2)** — same assumption as before, in
   `src/utils/constants.js`.
7. **Presence** — the docs only expose `user_offline` (a broadcast when someone's last
   tab disconnects), no explicit "online" event, so there's no real online/offline
   indicator yet — just a best-effort set of user IDs we've seen go offline
   (`UserContext.offlineUserIds`), nothing more.

## Not implemented (out of scope for this pass)

- Google sign-up/login (`/auth/signup/gmail`, `/auth/login/gmail`) — no UI wired in;
  ask if you want a "Continue with Google" button.
- Admin endpoints (`/user/all`, `/user/active`, `/user/deleted`,
  `/user/destroy/:userId/permanent`) — this is a user-facing app, not an admin panel.
