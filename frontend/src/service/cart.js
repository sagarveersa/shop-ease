import { api } from "./api";


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

export const CartService = {
  updateCart: async (productId, qty) => {
    try {
      const response = await api.post("cart/", {
        productId: productId,
        quantity: qty,
      });
      return { success: true, data: { ...response.data } };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return {
        success: false,
        data: {
          error: extractErrorMessage(error, "Unable to update cart."),
        },
      };
    }
  },

  getCart: async () => {
    try {
      const response = await api.get("cart/");

      const cart = {};

      for (const item of response.data) {
        // if (Object.hasOwn(cart, item.id)) {
        //   cart[item.id].qty += item.quantity;
        // } else {
        // };

        // the id of the cart item is same of productId - this is intentionally different from the backend
        cart[item.product.id] = {
          id: item.id,
          product: { ...item.product, price: parseFloat(item.product.price) },
          qty: item.quantity,
        };
      }

      console.log(cart);

      return { success: true, data: { items: cart } };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return { success: false, data: {} };
    }
  },
};
