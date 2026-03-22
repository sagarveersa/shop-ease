import { useContext, useEffect, useMemo, useReducer } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import CheckoutOverlay from "../components/CheckoutOverlay";
import LoadingSpinner from "../components/LoadingSpinner";
import { Navbar } from "../components/Navbar";
import { cartContext } from "../context/CartContext";
import { OrderService } from "../service/order";
import { ProductService } from "../service/product";
import { trackEvent } from "../utils/analytics";

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
  buyNowProduct: null,
  buyNowLoading: false,
  buyNowError: null,
};

function initializeState({ source, productId, quantity, locationProduct }) {
  if (source !== "buy_now") {
    return initialState;
  }

  if (!productId || !quantity) {
    return {
      ...initialState,
      buyNowError: "Invalid buy now request.",
    };
  }

  if (locationProduct?.id === productId) {
    return {
      ...initialState,
      buyNowProduct: locationProduct,
    };
  }

  return {
    ...initialState,
    buyNowLoading: true,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "checkout/setField": {
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
      };
    }

    case "checkout/placeOrder": {
      console.log("tracking place order");
      trackEvent("Place Order Attempt");
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

    case "checkout/idle": {
      return {
        ...state,
        status: "idle",
        error: null,
      };
    }

    case "checkout/reset": {
      return initialState;
    }

    case "checkout/buyNowLoading": {
      return {
        ...state,
        buyNowLoading: true,
        buyNowError: null,
      };
    }

    case "checkout/buyNowSuccess": {
      return {
        ...state,
        buyNowProduct: action.product,
        buyNowLoading: false,
        buyNowError: null,
      };
    }

    case "checkout/buyNowError": {
      return {
        ...state,
        buyNowProduct: null,
        buyNowLoading: false,
        buyNowError: action.error,
      };
    }

    case "checkout/buyNowReset": {
      return {
        ...state,
        buyNowProduct: null,
        buyNowLoading: false,
        buyNowError: null,
      };
    }

    default:
      return state;
    }
}

export default function Checkout() {
  const { cart, loading: cartLoading, clearCart } = useContext(cartContext);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const source = searchParams.get("source");
  const productId = searchParams.get("productId");
  const quantityParam = Number.parseInt(searchParams.get("quantity") ?? "1", 10);
  const quantity = Number.isInteger(quantityParam) && quantityParam > 0 ? quantityParam : null;
  const locationProduct = location.state?.product;
  const [state, dispatch] = useReducer(
    reducer,
    {
      source,
      productId,
      quantity,
      locationProduct,
    },
    initializeState,
  );

  useEffect(() => {
    if (source !== "buy_now") {
      dispatch({ type: "checkout/buyNowReset" });
      return;
    }

    if (!productId || !quantity) {
      dispatch({
        type: "checkout/buyNowError",
        error: "Invalid buy now request.",
      });
      return;
    }

    if (locationProduct?.id === productId) {
      dispatch({
        type: "checkout/buyNowSuccess",
        product: locationProduct,
      });
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      dispatch({ type: "checkout/buyNowLoading" });
      const response = await ProductService.getProductDetails(productId);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        dispatch({
          type: "checkout/buyNowError",
          error: "Unable to load product for checkout.",
        });
      } else {
        dispatch({
          type: "checkout/buyNowSuccess",
          product: response.data,
        });
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [source, productId, quantity, locationProduct]);

  const checkoutItems = useMemo(() => {
    if (source === "cart") {
      if (!cart) return [];

      return Object.values(cart).map((value) => ({
        product: value.product,
        qty: value.qty,
      }));
    }

    if (source === "buy_now" && state.buyNowProduct && quantity) {
      return [{ product: state.buyNowProduct, qty: quantity }];
    }

    return [];
  }, [source, cart, state.buyNowProduct, quantity]);

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
  const totalQuantity = checkoutItems.reduce((sum, item) => sum + item.qty, 0);

  const tax = 0;
  const total = subtotal + tax;

  useEffect(() => {
    if (checkoutItems.length === 0) {
      return;
    }

    trackEvent("View Checkout", {
      source,
      total_items: totalQuantity,
      total_price: total,
      products: checkoutItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.qty,
      })),
    });
  }, [checkoutItems, source, total, totalQuantity]);

  useEffect(() => {
    if (state.status === "error") {
      toast.error(state.error);
      dispatch({ type: "checkout/idle" });
      return;
    }

    if (state.status === "success") {
      navigate("/orders");
    }
  }, [state.status, navigate, state.error]);

  useEffect(() => {
    if (state.buyNowError) {
      toast.error(state.buyNowError);
    }
  }, [state.buyNowError]);

  const handleFieldUpdate = (field, value) => {
    dispatch({ type: "checkout/setField", field: field, value: value });
  };

  if (source !== "cart" && source !== "buy_now") {
    return <Navigate to="/products" />;
  }

  if (source === "cart" && cartLoading) {
    return (
      <div className="bg-gray-900 light:bg-slate-50 text-gray-100 light:text-slate-900 min-h-[100dvh]">
        <Navbar />
        <div className="w-full p-6 mt-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (source === "buy_now" && state.buyNowLoading) {
    return (
      <div className="bg-gray-900 light:bg-slate-50 text-gray-100 light:text-slate-900 min-h-[100dvh]">
        <Navbar />
        <div className="w-full p-6 mt-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (source === "cart" && checkoutItems.length === 0) {
    return <Navigate to="/cart" />;
  }

  if (source === "buy_now" && checkoutItems.length === 0) {
    return <Navigate to="/products" />;
  }

  const handlePlaceOrder = async () => {
    for (const field in state.form) {
      if (!state.form[field]) {
        dispatch({ type: "checkout/error", error: `${field} can't be empty` });
        return;
      }
    }

    dispatch({ type: "checkout/placeOrder" });
    const response = await OrderService.checkout({
      form: state.form,
      source,
      productId,
      quantity,
    });

    switch (response.status) {
      case "success": {
        if (source === "cart" && clearCart) {
          clearCart();
        }
        dispatch({ type: "checkout/success" });
        break;
      }

      case "error": {
        trackEvent("Order Placement Failed", {
          source,
          items_count: totalQuantity,
        });
        dispatch({ type: "checkout/error", error: "Error placing order" });
        break;
      }

      default:
        break;
    }
  };

  return (
    <div className="bg-gray-900 light:bg-slate-50 text-gray-100 light:text-slate-900">
      <Navbar />
      <CheckoutOverlay status={state.status} />

      <div className="checkout-scroll mt-16 h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto pb-12">
            {/* Page Heading */}
            <h1 className="text-3xl font-bold text-white light:text-slate-900 mb-8">
              Checkout
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ================= SHIPPING SECTION ================= */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 light:bg-white border border-gray-700 light:border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6">
                    Shipping Address
                  </h2>

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
                      onChange={(e) =>
                        handleFieldUpdate("phone", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ================= ORDER SUMMARY ================= */}
              <aside className="lg:sticky lg:top-24 h-fit">
                <div className="bg-gray-800 light:bg-white border border-gray-700 light:border-slate-200 rounded-2xl p-6 shadow-lg flex flex-col">
                  <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                  <div className="space-y-4 flex-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300 light:text-slate-600">
                        Subtotal
                      </span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-300 light:text-slate-600">
                        Shipping
                      </span>
                      <span className="text-green-400">Free</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-300 light:text-slate-600">
                        Tax
                      </span>
                      <span>${tax.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-gray-700 light:border-slate-200 pt-4 flex justify-between font-bold text-lg">
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

                  <p className="text-xs text-gray-400 light:text-slate-500 mt-4 text-center">
                    Your shipping details will be used to deliver your order.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* reusable input styling */}
      <style>{`
        .checkout-scroll {
          -webkit-overflow-scrolling: touch;
        }

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

        .light .input {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }

        .input::placeholder {
          color: #9ca3af;
        }

        .light .input::placeholder {
          color: #64748b;
        }

        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.35);
        }
      `}</style>
    </div>
  );
}
