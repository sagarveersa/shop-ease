import { useState, useRef, useEffect, useContext } from "react";
import { User, LogOut, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DropdownItem from "./DropdownItem";
import { authContext } from "../context/AuthContext";

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const { name, logout } = useContext(authContext);
  const ref = useRef(null);
  const navigate = useNavigate();

  /* Close when clicking outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Avatar Button */}
      <div
        onClick={() => setOpen((p) => !p)}
        className="
          flex items-center gap-2 px-3 py-2
          rounded-full
          bg-gray-800 hover:bg-gray-700
          transition
        "
      >
        <div className="relative">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>

          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-gray-900 rounded-full" />
        </div>

        <span className="hidden md:inline text-sm font-medium text-gray-100">
          {name}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-3 w-56
            bg-[#162338]
            border border-white/10
            rounded-xl
            shadow-xl
            overflow-hidden
            animate-in fade-in zoom-in-95
          "
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-gray-400">signed in</p>
          </div>

          {/* Actions */}
          <div className="py-2">
            <DropdownItem
              icon={<User size={16} />}
              label="Profile"
              onClick={() => navigate("/profile")}
            />

            <DropdownItem
              icon={<Package size={16} />}
              label="My Orders"
              onClick={() => navigate("/orders")}
            />

            <div className="border-t border-white/10 my-2" />

            <DropdownItem
              icon={<LogOut size={16} />}
              label="Logout"
              danger
              onClick={() => {
                logout();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
