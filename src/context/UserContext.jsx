import { createContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import * as userService from "../services/userService";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

export const UserContext = createContext(null);

export default function UserContextProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("userToken") || null);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  // Best-effort presence: the docs only expose a `user_offline` broadcast
  // (no explicit "online" event), so this starts empty and only ever
  // records who we've *seen* go offline since the app opened.
  const [offlineUserIds, setOfflineUserIds] = useState(() => new Set());

  async function fetchProfile() {
    try {
      const { data } = await userService.getProfile();
      setUserData(data?.data ?? data?.user ?? data);
    } catch (error) {
      // token expired / invalid -> force logout
      logout();
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchProfile();
      connectSocket(token);
    } else {
      setLoadingUser(false);
      disconnectSocket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleOffline({ user }) {
      setOfflineUserIds((prev) => new Set(prev).add(user));
    }
    socket.on("user_offline", handleOffline);
    return () => socket.off("user_offline", handleOffline);
  }, [token]);

  function loginSuccess(newToken) {
    localStorage.setItem("userToken", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("userToken");
    setToken(null);
    setUserData(null);
    disconnectSocket();
    authService.logout().catch(() => {});
  }

  return (
    <UserContext.Provider
      value={{
        token,
        userData,
        setUserData,
        loadingUser,
        loginSuccess,
        logout,
        refreshProfile: fetchProfile,
        offlineUserIds,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
