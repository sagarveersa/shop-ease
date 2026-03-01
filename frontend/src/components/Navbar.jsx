import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { authContext } from "../context/AuthContext";
import UserDropdown from "./UserDropdown";

export function Navbar() {
  const location = useLocation();
  const { loggedIn, isStaff } = useContext(authContext);

  return (
    <nav className="bg-gray-900 h-16 fixed top-0 left-0 w-full z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-white font-semibold text-lg hover:text-blue-400 transition"
          >
            <ShoppingBag className="h-6 w-6" />
            <span>ShopEase</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Right Actions */}
            <div className="flex items-center gap-4 text-white">
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
