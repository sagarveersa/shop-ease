import { useContext, useState } from "react";
import { Moon, Search, ShoppingBag, ShoppingCart, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import UserDropdown from "./UserDropdown";

export default function SearchBar() {
  const { loggedIn, isStaff } = useContext(authContext);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchClick = () => {
    if (query === "") {
      navigate("/products");
    } else {
      navigate(`/products?q=${query}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (query === "") {
      return;
    } else {
      navigate(`/products?q=${query}`);
    }
  };

  return (
    <nav className="bg-gray-900 light:bg-white h-16 flex items-center px-4 border-b border-gray-800 light:border-slate-200 fixed top-0 left-0 w-full z-50">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 text-white light:text-slate-900 font-semibold text-lg hover:text-blue-400 transition"
      >
        <ShoppingBag className="h-6 w-6" />
        <span>ShopEase</span>
      </Link>

      {/* Search */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="flex items-center bg-gray-800 light:bg-slate-100 border border-gray-700 light:border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="flex-grow bg-transparent text-sm text-gray-100 light:text-slate-900 placeholder-gray-400 light:placeholder-slate-500 outline-none"
          />
          <button
            onClick={handleSearchClick}
            className="text-gray-400 light:text-slate-500 hover:text-white light:hover:text-slate-800 transition"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 text-white light:text-slate-900">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          className="h-9 w-9 rounded-lg border border-white/10 light:border-slate-200 flex items-center justify-center text-white light:text-slate-900 hover:bg-white/5 light:hover:bg-slate-100 transition"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {/* Cart */}
        <Link to="/cart" className="relative hover:text-blue-400 transition">
          <ShoppingCart className="w-6 h-6" />
        </Link>

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
    </nav>
  );
}
