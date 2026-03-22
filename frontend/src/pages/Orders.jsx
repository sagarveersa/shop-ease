import { useEffect, useMemo, useReducer, useState } from "react";
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
        orders: Array.isArray(action.payload) ? action.payload : [],
      };

    case "orders/update":
      return {
        ...state,
        orders: (state.orders ?? []).map((order) =>
          order.id === action.payload.id ? action.payload : order
        ),
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
  const [activeFilter, setActiveFilter] = useState("pending");
  const [cancellingIds, setCancellingIds] = useState(() => new Set());

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrders() {
      dispatch({ type: "orders/loading" });

      try {
        const res = await OrderService.getOrders({
          signal: controller.signal,
        });

        if (res.status === "aborted") {
          return;
        }

        if (res.status !== "success") {
          dispatch({
            type: "orders/error",
            error: "Failed to load orders",
          });
          return;
        }

        dispatch({
          type: "orders/success",
          payload: res.data?.orders ?? [],
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

  const filteredOrders = useMemo(() => {
    const orders = state.orders ?? [];

    if (activeFilter === "delivered") {
      return orders.filter((order) => order.status === "delivered");
    }

    if (activeFilter === "cancelled") {
      return orders.filter((order) => order.status === "cancelled");
    }

    return orders.filter(
      (order) => order.status !== "delivered" && order.status !== "cancelled"
    );
  }, [activeFilter, state.orders]);

  async function handleCancel(orderId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    setCancellingIds((prev) => new Set(prev).add(orderId));

    try {
      const res = await OrderService.cancelOrder({ orderId });

      if (res.status !== "success") {
        dispatch({
          type: "orders/error",
          error: "Failed to cancel order",
        });
        return;
      }

      dispatch({
        type: "orders/update",
        payload: res.data,
      });
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#0b172a] light:bg-slate-50 px-4 py-10 text-white light:text-slate-900">
      <Navbar />
      <div className="mt-16">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-10">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-gray-400 light:text-slate-600 mt-1">
            Track and manage your purchases
          </p>
        </div>

        {/* Scrollable content */}
        <div className="h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex gap-3">
              {[
                { key: "pending", label: "Pending" },
                { key: "delivered", label: "Delivered" },
                { key: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    activeFilter === tab.key
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-200 light:bg-blue-50 light:border-blue-200 light:text-blue-700"
                      : "border-white/10 text-gray-300 hover:text-white light:border-slate-200 light:text-slate-600 light:hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {state.status === "loading" && <OrdersSkeleton />}

            {/* Error */}
            {state.status === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 light:bg-red-50 light:border-red-200 light:text-red-600 p-4 rounded-xl">
                {state.error}
              </div>
            )}

            {/* Empty */}
            {state.status === "success" &&
              (state.orders?.length ?? 0) === 0 && (
              <div className="bg-[#162338] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-10 text-center text-gray-300 light:text-slate-600">
                <p className="text-lg font-semibold">No orders yet 🛒</p>
                <p className="text-gray-400 light:text-slate-500 mt-2">
                  Your placed orders will appear here.
                </p>
              </div>
            )}

            {state.status === "success" &&
              (state.orders?.length ?? 0) > 0 &&
              filteredOrders.length === 0 && (
                <div className="bg-[#162338] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-10 text-center text-gray-300 light:text-slate-600">
                  <p className="text-lg font-semibold">
                    No {activeFilter} orders
                  </p>
                  <p className="text-gray-400 light:text-slate-500 mt-2">
                    Try another filter to view your orders.
                  </p>
                </div>
              )}

            {/* Orders */}
            {filteredOrders.map((order) => (
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
                <OrderCard
                  order={order}
                  onCancel={handleCancel}
                  isCancelling={cancellingIds.has(order.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
