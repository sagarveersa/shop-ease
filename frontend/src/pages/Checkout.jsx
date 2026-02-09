import { useContext } from "react";
import { Navbar } from "../components/Navbar";
import { checkoutContext } from "../context/CheckoutContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function Checkout() {
  const { checkoutProducts, setCheckoutProducts } = useContext(checkoutContext);

  if (!checkoutProducts || !setCheckoutProducts) {
    return <Navigate to="/login" />;
  }

  // compute total price
  let subtotal = 0;
  for (const product of checkoutProducts) {
    subtotal += product.price * product.qty;
  }
  const tax = 0;
  const total = subtotal + tax;

  return (
    <div>
      <Navbar />
      <div className="h-[100dvh] bg-gray-900 text-gray-100 mt-16 pt-3 px-4 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <h1 className="text-2xl sm:text-2xl font-bold text-white mb-4">
          Checkout
        </h1>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                />
                <input
                  type="text"
                  placeholder="City"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <aside className="bg-gray-800 rounded-xl p-6 h-fit flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 flex-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-700 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
              Place Order
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              By placing your order, you agree to our terms and conditions.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
