import { createContext, useEffect } from "react";
import { useState } from "react";

export const authContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [name, setName] = useState(localStorage.getItem("name"));

  const loggedIn = !!(token && userID && name);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userID");
    localStorage.removeItem("name");
    setToken(null);
    setUserID(null);
    setName(null);
  };

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
        logout: logout,
      }}
    >
      {children}
    </authContext.Provider>
  );
}
