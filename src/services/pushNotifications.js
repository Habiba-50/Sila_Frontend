import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance, isMessagingSupported } from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Best-effort: returns null on anything that goes wrong (unsupported browser,
// permission denied, no service worker, etc.) so callers can log in either way.
export async function getFcmToken() {
  try {
    if (!(await isMessagingSupported())) return null;
    if (!("serviceWorker" in navigator)) return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessagingInstance();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (error) {
    console.warn("Couldn't get an FCM token:", error);
    return null;
  }
}

// Foreground push messages (the app is open in an active tab). Call once,
// e.g. from App.jsx, and it wires up react-hot-toast for you.
export async function listenForegroundMessages(onNotification) {
  try {
    if (!(await isMessagingSupported())) return () => {};
    const messaging = getMessagingInstance();
    return onMessage(messaging, (payload) => onNotification?.(payload));
  } catch {
    return () => {};
  }
}
