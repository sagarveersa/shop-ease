import { useContext } from "react";
import { cartContext } from "../context/CartContext";
import { Trash } from "lucide-react";

export default function CartItem({ product, qty }) {
  const { addToCart, removeFromCart } = useContext(cartContext);
  if (!product) {
    return <div>Error receiving product as prop</div>;
  }
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-4 max-w-3xl flex gap-6">
      {/* Left Column: Image + Controls */}
      <div className="flex flex-col items-center gap-3 w-40">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="rounded-xl w-32 h-32 object-cover"
        />

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => removeFromCart(product)}
            className="bg-blue-600 w-8 h-8 flex items-center justify-center rounded-md text-white hover:bg-blue-700 transition"
          >
            {qty > 1 ? "−" : <Trash />}
          </button>

          <span className="w-8 text-center font-semibold text-white border border-blue-600 rounded-md py-1">
            {qty}
          </span>

          <button
            onClick={() => addToCart(product)}
            className="bg-blue-600 w-8 h-8 flex items-center justify-center rounded-md text-white hover:bg-blue-700 transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Right Column: Product Info */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>

        <p className="text-gray-400 text-sm mt-1">{product.category}</p>

        <p className="text-gray-200 font-bold text-lg mt-2">
          ${product.price.toFixed(2)}
        </p>

        <p className="text-gray-300 text-sm mt-3 leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
}
