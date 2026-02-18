import { useContext, useEffect, useReducer } from "react";
import { Navbar } from "../components/Navbar";
import { checkoutContext } from "../context/CheckoutContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { OrderService } from "../service/order";
import CheckoutOverlay from "../components/CheckoutOverlay";

const initialState = {
  form: {
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    phone: "",
  },
  status: "idle", // idle | success |loading | error
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "checkout/setField": {
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
      };
    }

    case "checkout/placeOrder": {
      return {
        ...state,
        status: "loading",
        error: null,
      };
    }

    case "checkout/success": {
      return {
        ...state,
        status: "success",
        error: null,
      };
    }

    case "checkout/error": {
      return {
        ...state,
        status: "error",
        error: action.error,
      };
    }

    case "checkout/reset": {
      return initialState;
    }

    default:
      return state;
  }
}

export default function Checkout() {
  const { checkoutItems, setCheckoutItems } = useContext(checkoutContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  if (!checkoutItems || !setCheckoutItems) {
    return <Navigate to="/login" />;
  }

  // compute total price
  // these are derived values they are not stored as state variables because they don't change the component
  // instead they some other state variable changes the component and these values.
  let subtotal = 0;
  for (const item of checkoutItems) {
    subtotal += item.product.price * item.qty;
  }

  const tax = 0;
  const total = subtotal + tax;

  useEffect(() => {
    if (state.status === "error") {
      toast.error(state.error);
      return;
      // dispatch({ type: "checkout/reset" });
    }

    if (state.status === "success") {
      const timer = setTimeout(() => {
        navigate("/orders");
        dispatch({ type: "checkout/success" });
      }, 2000);
      return () => clearTimeout(timer);
      // dispatch({ type: "checkout/reset" });
    }
  }, [state.status]);

  const handleFieldUpdate = (field, value) => {
    dispatch({ type: "checkout/setField", field: field, value: value });
  };

  const handlePlaceOrder = async () => {
    // validate
    console.log(state.form);
    for (const field in state.form) {
      if (!state.form[field]) {
        dispatch({ type: "checkout/error", error: `${field} can't be empty` });
        return;
      }
    }

    // submit form
    dispatch({ type: "checkout/placeOrder" });
    const response = await OrderService.createOrder({
      form: state.form,
      items: checkoutItems,
    });

    console.log(response);

    switch (response.status) {
      case "success": {
        dispatch({ type: "checkout/success" });
        break;
      }

      case "error": {
        dispatch({ type: "checkout/error", error: "Error placing order" });
        break;
      }

      // aborted would not change the state because a request would only get aborted when another request is in process
    }
  };

  return (
    <div>
      <Navbar />
      <CheckoutOverlay status={state.status} />

      <div className="min-h-[100dvh] bg-gray-900 text-gray-100 mt-16 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ================= SHIPPING SECTION ================= */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="input"
                    value={state.form.firstName}
                    onChange={(e) =>
                      handleFieldUpdate("firstName", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Last Name"
                    className="input"
                    value={state.form.lastName}
                    onChange={(e) =>
                      handleFieldUpdate("lastName", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Address"
                    className="input md:col-span-2"
                    value={state.form.address}
                    onChange={(e) =>
                      handleFieldUpdate("address", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="City"
                    className="input"
                    value={state.form.city}
                    onChange={(e) => handleFieldUpdate("city", e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Postal Code"
                    className="input"
                    value={state.form.postalCode}
                    onChange={(e) =>
                      handleFieldUpdate("postalCode", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="State / Province"
                    className="input"
                    value={state.form.province}
                    onChange={(e) =>
                      handleFieldUpdate("province", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="input"
                    value={state.form.phone}
                    onChange={(e) => handleFieldUpdate("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ================= ORDER SUMMARY ================= */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="bg-gray-800 rounded-2xl p-6 shadow-lg flex flex-col">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 flex-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-700 pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="mt-8 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200"
                  onClick={() => handlePlaceOrder()}
                >
                  Place Order
                </button>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  Your shipping details will be used to deliver your order.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* reusable input styling */}
      <style>{`
        .input {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          background: #1f2937;
          border: 1px solid #374151;
          color: #f3f4f6;
          outline: none;
          transition: all 0.2s ease;
        }

        .input::placeholder {
          color: #9ca3af;
        }

        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.35);
        }
      `}</style>
    </div>
  );
}
