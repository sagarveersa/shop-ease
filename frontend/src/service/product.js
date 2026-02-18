import { baseApi } from "./api";

export const ProductService = {
  getProducts: async (filter) => {
    const params = {};
    if (filter.query) {
      params.search = filter.query;
    }
    if (filter.allowedCategories) {
      params.category = filter.allowedCategories;
    }
    if (filter.sort) {
      params.ordering = filter.sort === "ascending" ? "price" : "-price";
    }

    // make fetch request
    try {
      const response = await baseApi.get(`products/`, {
        params: params,
        paramsSerializer: (params) => {
          // convert category[] to repeated query params
          const parts = [];
          for (const key in params) {
            if (!params.hasOwnProperty(key)) continue;
            const value = params[key];
            if (Array.isArray(value)) {
              parts.push(
                `${encodeURIComponent(key)}=${value.map((v) => encodeURIComponent(v)).join(",")}`,
              );
            } else {
              parts.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
              );
            }
          }
          return parts.join("&");
        },
      });

      // convert price to float
      for (const product of response.data) {
        product.price = parseFloat(product.price);
      }

      return { success: true, data: { products: response.data } };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return { success: false, data: {} };
    }
  },

  getCategories: async () => {
    try {
      const response = await baseApi.get(`categories/`);
      const categories = [];
      for (const item of response.data) {
        categories.push(item.name);
      }

      return { success: true, data: { categories: categories } };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return { success: false, data: {} };
    }
  },

  getProductDetails: async (productID) => {
    try {
      const response = await baseApi.get(`products/${productID}/`);
      return {
        success: true,
        data: { ...response.data, price: parseFloat(response.data.price) },
      };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return { success: false, data: {} };
    }
  },
};
