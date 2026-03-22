import { useState } from "react";

function statusStyle(status) {
  switch (status) {
    case "delivered":
      return "text-green-400 light:text-green-600";
    case "pending":
      return "text-yellow-400 light:text-yellow-600";
    case "cancelled":
      return "text-red-400 light:text-red-600";
    default:
      return "text-gray-400 light:text-slate-500";
  }
}

function canCancel(status) {
  return status !== "delivered" && status !== "cancelled" && status !== "shipped";
}

export default function OrderCard({ order, onCancel, isCancelling }) {
  const [open, setOpen] = useState(false);

  let totalItems = 0;
  for (const item of order.items) {
    totalItems = totalItems + item.quantity;
  }

  return (
    <div
      className="
        bg-[#162338]
        light:bg-white
        border border-white/10
        light:border-slate-200
        rounded-xl
        px-5 py-4
        hover:border-blue-500/40
        transition-all duration-200
      "
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-white light:text-slate-900 font-medium">
            Order #{order.id}
          </p>

          <p className="text-xs text-gray-400 light:text-slate-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString()} • {totalItems}{" "}
            items
          </p>
        </div>

        <div className="text-right">
          <p className="text-blue-400 light:text-blue-600 font-semibold">
            ${order.totalAmount}
          </p>

          <p
            className={`text-xs font-medium mt-1 ${statusStyle(order.status)}`}
          >
            {order.status}
          </p>
        </div>
      </div>

      {/* PRODUCT PREVIEW STRIP */}
      <div className="flex items-center gap-2 mt-4 overflow-hidden">
        {order.items.slice(0, 4).map((item) => (
          <img
            key={item.id}
            src={item.imageUrl}
            alt=""
            className="
              w-10 h-10 rounded-md object-cover
              border border-white/10
              light:border-slate-200
            "
          />
        ))}

        {order.items.length > 4 && (
          <div className="text-xs text-gray-400 light:text-slate-500 ml-2">
            +{order.items.length - 4} more
          </div>
        )}
      </div>

      {/* ACTION */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setOpen((p) => !p)}
          className="
            text-sm text-blue-400
            hover:text-blue-300
            light:text-blue-600
            light:hover:text-blue-500
            transition-colors
          "
        >
          {open ? "Hide details" : "View details →"}
        </button>

        {canCancel(order.status) && (
          <button
            onClick={() => onCancel?.(order.id)}
            disabled={isCancelling}
            className="
              inline-flex items-center rounded-full
              border border-red-500/40
              bg-red-500/10
              px-3 py-1.5
              text-sm font-medium text-red-200
              hover:bg-red-500/20
              light:border-red-300
              light:bg-red-50
              light:text-red-700
              light:hover:bg-red-100
              transition
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {isCancelling ? "Cancelling..." : "Cancel order"}
          </button>
        )}
      </div>

      {/* EXPANDABLE DETAILS */}
      {open && (
        <div className="mt-4 pt-4 border-t border-white/10 light:border-slate-200 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm text-gray-300 light:text-slate-600"
            >
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>${item.subtotal}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
