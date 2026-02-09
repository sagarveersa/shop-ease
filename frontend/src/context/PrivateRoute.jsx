import { useContext, useEffect } from "react";
import { authContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { loggedIn } = useContext(authContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
    }
  }, [loggedIn]);

  return <>{children}</>;
}
