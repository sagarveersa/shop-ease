import { useContext, useEffect, useState } from "react";
import { cartContext } from "../context/CartContext";
import { authContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const { loggedIn } = useContext(authContext);
  const { cart, addToCart } = useContext(cartContext);
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    if (loggedIn && cart && cart[product.id]) {
      setInCart(true);
    } else {
      setInCart(false);
    }
  }, [cart]);

  return (
    // <Link to={`/product/${product.id}`} className="group">
    <div className="h-full flex flex-col bg-transparent group">
      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="relative w-full aspect-square bg-gray-100 rounded-md overflow-hidden">
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
        <h3 className="text-sm font-medium text-gray-100 line-clamp-2 group-hover:text-blue-400 transition">
          {product.name}
        </h3>

        {/* Category */}
        <p className="text-xs text-gray-400 mt-1">{product.category}</p>

        {/* Price */}
        <p className="text-lg font-bold text-white mt-1">
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
              className="flex-1 text-xs py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
            >
              In Cart
            </button>
          )}

          {!loggedIn && (
            <button
              disabled
              className="flex-1 text-xs py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
