import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import Loader from "../Loader/Loader";

export default function ProtectedRoute({ children }) {
  const { token, loadingUser } = useContext(UserContext);

  if (loadingUser) return <Loader />;
  if (!token) return <Navigate to="/login" replace />;

  return children;
}
