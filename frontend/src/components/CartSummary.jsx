import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { cartContext } from "../context/CartContext";
import { trackEvent } from "../utils/analytics";

export default function CartSummary() {
  const { cart, totalItems, totalPrice } = useContext(cartContext);
  const navigate = useNavigate();

  const checkout = () => {
    const productsList = Object.values(cart).map((value) => ({
      product: value.product,
      qty: value.qty,
    }));

    trackEvent("Begin Checkout", {
      source: "cart",
      total_items: totalItems,
      total_price: totalPrice,
      items: productsList.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.qty,
      })),
    });

    navigate("/checkout?source=cart");
  };

  return (
    <div className="bg-gray-800 light:bg-white border border-gray-700 light:border-slate-200 rounded-2xl shadow-lg w-80 p-6">
      <h1 className="text-xl font-bold text-white light:text-slate-900 mb-6">
        Order Summary
      </h1>

      <div className="space-y-4">
        <div className="flex justify-between text-gray-300 light:text-slate-600">
          <span>Total Items</span>
          <span className="font-semibold text-white light:text-slate-900">
            {totalItems}
          </span>
        </div>

        <div className="flex justify-between text-gray-300 light:text-slate-600">
          <span>Total Price</span>
          <span className="font-semibold text-white light:text-slate-900">
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-gray-700 light:border-slate-200 pt-4 flex justify-between text-lg font-bold text-white light:text-slate-900">
          <span>Grand Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <button
        className="
      mt-6 w-full py-3 rounded-xl
      bg-blue-600 text-white font-semibold
      hover:bg-blue-700 active:scale-[0.98]
      transition
    "
        onClick={checkout}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
