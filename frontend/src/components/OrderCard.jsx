import { useState } from "react";

function statusStyle(status) {
  switch (status) {
    case "delivered":
      return "text-green-400";
    case "pending":
      return "text-yellow-400";
    case "cancelled":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export default function OrderCard({ order }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="
        bg-[#162338]
        border border-white/10
        rounded-xl
        px-5 py-4
        hover:border-blue-500/40
        transition-all duration-200
      "
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-white font-medium">Order #{order.id}</p>

          <p className="text-xs text-gray-400 mt-1">
            {new Date(order.createdAt).toLocaleDateString()} •{" "}
            {order.items.length} items
          </p>
        </div>

        <div className="text-right">
          <p className="text-blue-400 font-semibold">${order.totalAmount}</p>

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
            "
          />
        ))}

        {order.items.length > 4 && (
          <div className="text-xs text-gray-400 ml-2">
            +{order.items.length - 4} more
          </div>
        )}
      </div>

      {/* ACTION */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="
          mt-3 text-sm text-blue-400
          hover:text-blue-300
          transition-colors
        "
      >
        {open ? "Hide details" : "View details →"}
      </button>

      {/* EXPANDABLE DETAILS */}
      {open && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm text-gray-300"
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
