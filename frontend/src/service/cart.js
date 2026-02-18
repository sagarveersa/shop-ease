import { api } from "./api";

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
      return { success: false, data: {} };
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
