// Service workers can't read Vite's import.meta.env, so this config is
// duplicated here on purpose. Keep it in sync with the VITE_FIREBASE_*
// values in .env if you ever change Firebase projects.
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCf4DSyktBV8Q6RH05e48Xfpo3QOMxqTnM",
  authDomain: "c45-route-74549.firebaseapp.com",
  projectId: "c45-route-74549",
  storageBucket: "c45-route-74549.firebasestorage.app",
  messagingSenderId: "492755608402",
  appId: "1:492755608402:web:e5a4c3083f4c2f2404d08b",
  measurementId: "G-P1YG226VTG",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.data?.title || "Sila", {
    body: payload.data?.body || "You have a new notification",
  });
});
