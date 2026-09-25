import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "react-hot-toast";
import "./App.css";

import UserContextProvider from "./context/UserContext";
import { listenForegroundMessages } from "./services/pushNotifications";

import Layout from "./components/Layout/Layout";
import AuthLayout from "./components/AuthLayout/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import GuestRoute from "./components/GuestRoute/GuestRoute";
import Notfound from "./components/Notfound/Notfound";

import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import VerifyEmail from "./components/VerifyEmail/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import VerifyResetOtp from "./components/VerifyResetOtp/VerifyResetOtp";
import ResetPassword from "./components/ResetPassword/ResetPassword";

import Home from "./components/Home/Home";
import Profile from "./components/Profile/Profile";
import SearchUsers from "./components/SearchUsers/SearchUsers";
import Notifications from "./components/Notifications/Notifications";
import Bookmarks from "./components/Bookmarks/Bookmarks";
import BlockedUsers from "./components/BlockedUsers/BlockedUsers";
import FriendRequests from "./components/FriendRequests/FriendRequests";
import Chats from "./components/Chats/Chats";
import ChatDirect from "./components/ChatDirect/ChatDirect";
import ChatGroup from "./components/ChatGroup/ChatGroup";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "search", element: <SearchUsers /> },
      { path: "notifications", element: <Notifications /> },
      { path: "bookmarks", element: <Bookmarks /> },
      { path: "blocked", element: <BlockedUsers /> },
      { path: "friend-requests", element: <FriendRequests /> },
      { path: "profile", element: <Profile /> },
      { path: "profile/:id", element: <Profile /> },
      { path: "chats", element: <Chats /> },
      { path: "chats/user/:userId", element: <ChatDirect /> },
      { path: "chats/group/:id", element: <ChatGroup /> },
      { path: "*", element: <Notfound /> },
    ],
  },
  {
    path: "/",
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Register /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "verify-reset-otp", element: <VerifyResetOtp /> },
      { path: "reset-password", element: <ResetPassword /> },
    ],
  },
]);

export default function App() {
  useEffect(() => {
    let unsubscribe = () => {};
    listenForegroundMessages((payload) => {
      toast(payload?.notification?.title || payload?.data?.title || "New notification");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    }).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContextProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </UserContextProvider>
    </QueryClientProvider>
  );
}
