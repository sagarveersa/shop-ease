import { api } from "./api";

// TODO
// change quantity to qty

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
        return { status: "aborted", data: {} };
      }

      return { status: "error", data: {} };
    }
  },

  createOrder: async ({ signal, form, items }) => {
    try {
      let shippingAddress = "";
      for (const field in form) {
        shippingAddress += " " + form[field];
      }
      console.log(items);

      const mappedItems = [];
      for (const item of items) {
        mappedItems.push({ product_id: item.product.id, quantity: item.qty });
      }

      const payload = { shippingAddress: shippingAddress, items: mappedItems };
      console.log("Payload", payload);

      const response = await api.post("orders/", payload, {
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
};
