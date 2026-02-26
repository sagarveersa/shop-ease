import { createContext } from "react";
import { useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const authContext = createContext();

function parseStoredIsStaff(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return false;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [name, setName] = useState(localStorage.getItem("name"));
  const [isStaff, setIsStaff] = useState(
    parseStoredIsStaff(localStorage.getItem("isStaff")),
  );

  const loggedIn = !!(token && userID && name);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userID");
    localStorage.removeItem("name");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isStaff");
    setToken(null);
    setUserID(null);
    setName(null);
    setIsStaff(false);
  };

  return (
    <authContext.Provider
      value={{
        token,
        userID,
        name,
        loggedIn,
        isStaff,
        setToken,
        setUserID,
        setName,
        setIsStaff,
        logout: logout,
      }}
    >
      {children}
    </authContext.Provider>
  );
}
