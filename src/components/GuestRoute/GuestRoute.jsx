import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

// Keeps a logged-in user out of /login, /signup, etc.
export default function GuestRoute({ children }) {
  const { token, loadingUser } = useContext(UserContext);
  if (loadingUser) return null;
  if (token) return <Navigate to="/" replace />;
  return children;
}
