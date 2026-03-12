import { useContext, useEffect } from "react";
import { toast } from "react-toastify";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import LoadingSpinner from "../components/LoadingSpinner";
import { Navbar } from "../components/Navbar";
import { cartContext } from "../context/CartContext";

export function Cart() {
  const { cart, loading, error, setError } = useContext(cartContext);
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  return (
    <div className="h-[100dvh] bg-gray-900 light:bg-slate-50 text-white light:text-slate-900 flex flex-col overflow-hidden">
      <Navbar />

      <div className="mt-16 h-[calc(100dvh-4rem)] overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 relative">
          {loading ? (
            <LoadingSpinner />
          ) : !cart || Object.keys(cart).length === 0 ? (
            <span className="text-gray-300 light:text-slate-600">
              Cart is Empty
            </span>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Cart Items */}
                <div className="order-2 lg:order-1 flex-1 max-w-3xl space-y-4 custom-scrollbar max-h-none overflow-visible pr-0 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-3">
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
                <div className="order-1 lg:order-2 w-full lg:w-80 lg:sticky lg:top-28 self-start">
                  <CartSummary />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
