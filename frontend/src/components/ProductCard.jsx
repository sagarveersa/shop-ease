import { useContext } from "react";
import { Link } from "react-router-dom";
import { authContext } from "../context/AuthContext";
import { cartContext } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { loggedIn } = useContext(authContext);
  const { cart, addToCart } = useContext(cartContext);
  const inCart = loggedIn && cart && product && cart[product.id];
  const categoryLabel = Array.isArray(product.categories)
    ? product.categories.join(", ")
    : product.category || "Uncategorized";

  return (
    // <Link to={`/product/${product.id}`} className="group">
    <div className="h-full flex flex-col bg-transparent group">
      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="relative w-full aspect-square bg-gray-100 light:bg-slate-100 rounded-md overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="mt-3 flex flex-col flex-1">
        {/* Name */}
        <h3 className="text-sm font-medium text-gray-100 light:text-slate-900 line-clamp-2 group-hover:text-blue-400 transition">
          {product.name}
        </h3>

        {/* Category */}
        <p className="text-xs text-gray-400 light:text-slate-500 mt-1">
          {categoryLabel}
        </p>

        {/* Price */}
        <p className="text-lg font-bold text-white light:text-slate-900 mt-1">
          ${product.price.toFixed(2)}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions (subtle, non-boxy) */}
        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          {loggedIn && !inCart && (
            <button
              onClick={() => {
                addToCart(product);
              }}
              className="flex-1 text-xs py-2 bg-yellow-400 text-gray-900 rounded-md hover:bg-yellow-500 transition"
            >
              Add to Cart
            </button>
          )}

          {loggedIn && inCart && (
            <button
              disabled
              className="flex-1 text-xs py-2 bg-gray-300 light:bg-slate-200 text-gray-600 light:text-slate-500 rounded-md cursor-not-allowed"
            >
              In Cart
            </button>
          )}

          {!loggedIn && (
            <button
              disabled
              className="flex-1 text-xs py-2 bg-gray-300 light:bg-slate-200 text-gray-600 light:text-slate-500 rounded-md cursor-not-allowed"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
