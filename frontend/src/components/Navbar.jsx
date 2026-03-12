import { Moon, ShoppingBag, ShoppingCart, Sun } from "lucide-react";
import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { authContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import UserDropdown from "./UserDropdown";

export function Navbar() {
  const location = useLocation();
  const { loggedIn, isStaff } = useContext(authContext);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav className="bg-gray-900 light:bg-white h-16 fixed top-0 left-0 w-full z-50 border-b border-gray-800 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-white light:text-slate-900 font-semibold text-lg hover:text-blue-400 transition"
          >
            <ShoppingBag className="h-6 w-6" />
            <span>ShopEase</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Right Actions */}
            <div className="flex items-center gap-4 text-white light:text-slate-900">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                className="h-9 w-9 rounded-lg border border-white/10 light:border-slate-200 flex items-center justify-center text-white light:text-slate-900 hover:bg-white/5 light:hover:bg-slate-100 transition"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              {/* Cart */}
              <Link
                to="/cart"
                className="relative hover:text-blue-400 transition"
              >
                <ShoppingCart className="w-6 h-6" />
              </Link>

              {/* Explore Products */}
              {location.pathname !== "/" && (
                <Link
                  to="/products"
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg 
                     bg-blue-600 text-white text-sm font-medium
                     hover:bg-blue-700 transition"
                >
                  Browse Products
                </Link>
              )}

              {loggedIn && isStaff ? (
                <Link
                  to="/staff"
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg 
                     bg-emerald-600 text-white text-sm font-medium
                     hover:bg-emerald-700 transition"
                >
                  Staff Dashboard
                </Link>
              ) : null}

              {/* User Section */}
              {loggedIn ? (
                <div className="ml-2 flex items-center">
                  <UserDropdown />
                </div>
              ) : (
                <Link to="/login">
                  <button className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition">
                    Login
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
