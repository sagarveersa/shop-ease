import { useContext, useEffect, useState } from "react";
import CartItem from "../components/CartItem";
import { cartContext } from "../context/CartContext";
import CartSummary from "../components/CartSummary";
import { Navbar } from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

export function Cart() {
  const { cart, loading, error, setError } = useContext(cartContext);
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mt-16 mx-auto px-6 py-4 relative">
        {loading ? (
          <LoadingSpinner />
        ) : !cart || Object.keys(cart).length === 0 ? (
          <span>Cart is Empty</span>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Cart Items */}
              <div className="flex-1 max-w-3xl max-h-[70vh] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                {cart &&
                  Object.entries(cart).map(([productID, value]) => (
                    <CartItem
                      key={productID}
                      product={value.product}
                      qty={value.qty}
                    />
                  ))}
              </div>

              {/* Summary */}
              <div className="w-full lg:w-80 sticky top-28 self-start">
                <CartSummary />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
