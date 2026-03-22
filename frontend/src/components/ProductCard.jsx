import { useContext } from "react";
import { Trash } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { authContext } from "../context/AuthContext";
import { cartContext } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { loggedIn } = useContext(authContext);
  const { cart, addToCart, removeFromCart } = useContext(cartContext);
  const location = useLocation();
  const cartItem = loggedIn && cart && product ? cart[product.id] : null;
  const inCart = !!cartItem;
  const availableStock = product?.stock ?? 0;
  const isInStock = product?.isInStock ?? availableStock > 0;
  const canIncreaseQuantity = !cartItem || cartItem.qty < availableStock;
  const categoryLabel = Array.isArray(product.categories)
    ? product.categories.join(", ")
    : product.category || "Uncategorized";

  return (
    // <Link to={`/product/${product.id}`} className="group">
    <div className="h-full flex flex-col bg-transparent group">
      <Link
        to={`/product/${product.id}`}
        state={{ from: `${location.pathname}${location.search}` }}
      >
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

        <div className="mt-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isInStock
                ? "bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700"
                : "bg-red-500/15 text-red-300 light:bg-red-50 light:text-red-600"
            }`}
          >
            {isInStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions (subtle, non-boxy) */}
        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          {loggedIn && !inCart && (
            <button
              onClick={() => {
                addToCart(product);
              }}
              disabled={!isInStock}
              className="flex-1 text-xs py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-lg disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500"
            >
              {isInStock ? "Add to Cart" : "Out of Stock"}
            </button>
          )}

          {loggedIn && inCart && (
            <div className="flex flex-1 items-center justify-center gap-2">
              <button
                onClick={() => removeFromCart(product)}
                className="bg-blue-600 w-8 h-8 flex items-center justify-center rounded-md text-white hover:bg-blue-700 transition"
              >
                {cartItem.qty > 1 ? "−" : <Trash size={16} />}
              </button>

              <span className="w-8 text-center font-semibold text-white light:text-slate-900 border border-blue-600 rounded-md py-1">
                {cartItem.qty}
              </span>

              <button
                onClick={() => addToCart(product)}
                disabled={!canIncreaseQuantity}
                className="bg-blue-600 w-8 h-8 flex items-center justify-center rounded-md text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500"
              >
                +
              </button>
            </div>
          )}

          {!loggedIn && (
            <button
              disabled
              className={`flex-1 text-xs py-2 rounded-md cursor-not-allowed ${
                isInStock
                  ? "bg-gray-300 light:bg-slate-200 text-gray-600 light:text-slate-500"
                  : "bg-red-500/15 light:bg-red-50 text-red-300 light:text-red-600"
              }`}
            >
              {isInStock ? "Add to Cart" : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
