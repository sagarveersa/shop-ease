import { ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { authContext } from "../context/AuthContext";

export function Navbar() {
  const location = useLocation();
  const { loggedIn, name, logout } = useContext(authContext);

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

              {/* User Section */}
              {loggedIn ? (
                <div className="flex items-center gap-3">
                  {/* Avatar Button */}
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition">
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
                  </button>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-lg
                     hover:bg-red-500 hover:text-white transition"
                  >
                    Logout
                  </button>
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
