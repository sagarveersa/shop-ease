import { createContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export const authContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [name, setName] = useState(localStorage.getItem("name"));
  const [loggedIn, setLoggedIn] = useState(false);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userID");
    localStorage.removeItem("name");
    setLoggedIn(false);
  };

  useEffect(() => {
    if (!token || !userID || !name) setLoggedIn(false);
    else setLoggedIn(true);
  }, [token, userID, name]);

  return (
    <authContext.Provider
      value={{
        token,
        userID,
        name,
        loggedIn,
        setToken,
        setUserID,
        setName,
        setLoggedIn,
        logout: logout,
      }}
    >
      {children}
    </authContext.Provider>
  );
}
