import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { authContext } from "./AuthContext";

export default function StaffRoute({ children }) {
  const { loggedIn, isStaff } = useContext(authContext);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
}
