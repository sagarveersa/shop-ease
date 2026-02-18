import { useEffect, useReducer } from "react";
import OrderCard from "../components/OrderCard";
import OrdersSkeleton from "../components/OrdersSkeleton";
import { OrderService } from "../service/order";
import { Navbar } from "../components/Navbar";

const initialState = {
  orders: [],
  status: "loading",
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "orders/loading":
      return { ...state, status: "loading" };

    case "orders/success":
      return {
        ...state,
        status: "success",
        orders: action.payload,
      };

    case "orders/error":
      return {
        ...state,
        status: "error",
        error: action.error,
      };

    default:
      return state;
  }
}

export default function Orders() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrders() {
      dispatch({ type: "orders/loading" });

      try {
        const res = await OrderService.getOrders({
          signal: controller.signal,
        });

        dispatch({
          type: "orders/success",
          payload: res.data.orders,
        });
      } catch (err) {
        if (err.name === "CanceledError") return;

        dispatch({
          type: "orders/error",
          error: "Failed to load orders",
        });
      }
    }

    fetchOrders();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b172a] px-4 py-10 text-white">
      <Navbar />
      <div className="mt-16">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-10">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-gray-400 mt-1">Track and manage your purchases</p>
        </div>

        {/* Scrollable content */}
        <div className="h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Loading */}
            {state.status === "loading" && <OrdersSkeleton />}

            {/* Error */}
            {state.status === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
                {state.error}
              </div>
            )}

            {/* Empty */}
            {state.status === "success" && state.orders.length === 0 && (
              <div className="bg-[#162338] border border-white/10 rounded-xl p-10 text-center text-gray-300">
                <p className="text-lg font-semibold">No orders yet 🛒</p>
                <p className="text-gray-400 mt-2">
                  Your placed orders will appear here.
                </p>
              </div>
            )}

            {/* Orders */}
            {state.orders.map((order) => (
              <div
                key={order.id}
                //     className="
                //   bg-[#162338]
                //   border border-white/10
                //   rounded-2xl
                //   p-6
                //   shadow-lg
                //   hover:border-blue-500/40
                //   transition-all duration-300
                // "
              >
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
