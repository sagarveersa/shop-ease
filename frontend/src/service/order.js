import { api } from "./api";

// TODO
// change quantity to qty

function extractErrorMessage(error, fallbackMessage) {
  const data = error?.response?.data;
  if (typeof data === "string" && data) {
    return data;
  }

  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return fallbackMessage;
}

export const OrderService = {
  getOrders: async ({ signal }) => {
    try {
      console.log("Fetching orders");
      const response = await api.get("orders/", { signal: signal });

      for (const order of response.data) {
        // parse numbers
        order.totalAmount = parseFloat(order.totalAmount);

        for (const item of order.items) {
          item.productPrice = parseFloat(item.productPrice);
          item.subtotal = parseFloat(item.subtotal);
        }
      }
      console.log(response.data);

      return { status: "success", data: { orders: response.data } };
    } catch (error) {
      console.log(`[Service] ${error}`);
      if (error.name === "CanceledError") {
        return { status: "aborted", data: { orders: [] } };
      }

      return { status: "error", data: { orders: [] } };
    }
  },

  cancelOrder: async ({ orderId, signal }) => {
    try {
      const response = await api.post(`orders/${orderId}/cancel/`, null, {
        signal: signal,
      });

      return { status: "success", data: response.data };
    } catch (error) {
      console.log(`[Service] ${error}`);
      if (error.name === "CanceledError") {
        return { status: "aborted", data: {} };
      }

      return { status: "error", data: {} };
    }
  },

  checkout: async ({ signal, form, source, productId, quantity }) => {
    try {
      let shippingAddress = "";
      for (const field in form) {
        shippingAddress += " " + form[field];
      }

      const payload = {
        source,
        shippingAddress: shippingAddress.trim(),
      };

      if (source === "buy_now") {
        payload.productId = productId;
        payload.quantity = quantity;
      }

      console.log("Payload", payload);

      const response = await api.post("checkout/", payload, {
        signal: signal,
      });

      return { status: "success", data: response.data };
    } catch (error) {
      console.log(`[Service] ${error}`);
      if (error.name === "CanceledError") {
        return { status: "aborted", data: {} };
      }

      return {
        status: "error",
        data: {
          error: extractErrorMessage(error, "Unable to complete checkout."),
        },
      };
    }
  },
};
