import { useContext } from "react";
import { cartContext } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { checkoutContext } from "../context/CheckoutContext";

export default function CartSummary() {
  const { cart, totalItems, totalPrice } = useContext(cartContext);
  const { setCheckoutItems } = useContext(checkoutContext);

  const checkout = () => {
    // convert cart from an object with productId as keys to a list of products
    const productsList = [];
    for (const [productId, value] of Object.entries(cart)) {
      productsList.push({ product: value.product, qty: value.qty });
    }
    setCheckoutItems(productsList);
    navigate("/checkout");
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg w-80 p-6">
      <h1 className="text-xl font-bold text-white mb-6">Order Summary</h1>

      <div className="space-y-4">
        <div className="flex justify-between text-gray-300">
          <span>Total Items</span>
          <span className="font-semibold text-white">{totalItems}</span>
        </div>

        <div className="flex justify-between text-gray-300">
          <span>Total Price</span>
          <span className="font-semibold text-white">
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-gray-700 pt-4 flex justify-between text-lg font-bold text-white">
          <span>Grand Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/checkout">
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
      </Link>
    </div>
  );
}
