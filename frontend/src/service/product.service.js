import { verifyToken } from "../utils/jwt";
import { cartsDB, categoriesDB, productsDB } from "./db";

const carts = cartsDB || {};
const categories = categoriesDB || [];
const products = productsDB || [];

export const ProductService = {
  getProducts: async (filter) => {
    if (!filter) return products;
    let filtered = products.filter((product) => {
      if (
        filter.query &&
        !product.description.toLowerCase().includes(filter.query) &&
        !product.name.toLowerCase().includes(filter.query) &&
        !product.category.toLowerCase().includes(filter.query)
      ) {
        return false;
      }
      if (
        filter.allowedCategories &&
        !filter.allowedCategories.includes(product.category)
      ) {
        return false;
      }
      if (
        (filter.priceRangeMin || filter.priceRangeMin === 0) &&
        filter.priceRangeMax &&
        (product.price < filter.priceRangeMin ||
          product.price > filter.priceRangeMax)
      ) {
        return false;
      }

      return true;
    });

    const sorted = filtered.sort((a, b) => {
      if (filter.sort === "ascending") return a.price - b.price;
      else if (filter.sort === "descending") return b.price - a.price;
      else return 0;
    });

    return new Promise((resolve, reject) => {
      setTimeout(
        () => resolve({ success: true, data: { products: sorted } }),
        500,
      );
    });
  },
  getCategories: async () => {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => resolve({ success: true, data: { categories: categories } }),
        500,
      );
    });
  },

  getProductDetails: async (productID) => {
    let foundProduct = null;
    for (const product of products) {
      if (product.id === productID) {
        foundProduct = product;
        break;
      }
    }
    if (!foundProduct)
      return {
        success: false,
        data: { error: "Product not found" },
      };

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve({ success: true, data: foundProduct }), 500);
    });
  },

  updateCart: async (token, productID, qty) => {
    const payload = await verifyToken(token);
    let response;
    if (!payload)
      response = { success: false, data: { error: "Invalid token" } };
    else {
      const userID = payload.id;
      if (!carts[userID]) {
        carts[userID] = {};
        carts[userID][productID] = qty;
      } else {
        carts[userID][productID] = qty;
      }

      response = { success: true, data: {} };
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(response), 500);
    });
  },

  getCart: async (token) => {
    const payload = await verifyToken(token);
    let response;

    if (!payload)
      response = { success: false, data: { error: "Invalid token" } };
    else {
      const userID = payload.id;
      const cart = carts[userID];
      if (!cart) response = { success: true, data: { items: {} } };
      else {
        let cartItems = {};
        for (const productID in cart) {
          const details = products.find(
            (product) => String(product.id) === String(productID),
          );
          if (!details) continue;
          cartItems[productID] = { ...details, qty: cart[productID] };
        }
        response = { success: true, data: { items: cartItems } };
      }
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(response);
      }, 500);
    });
  },
};
