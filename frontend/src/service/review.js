import { api, baseApi } from "./api";


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

export const ReviewService = {
  getProductReviews: async ({ productId, signal }) => {
    try {
      const response = await baseApi.get("reviews/", {
        params: { product_id: productId },
        signal,
      });

      return { success: true, data: { reviews: response.data } };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return {
        success: false,
        data: {
          error: "Unable to load reviews.",
        },
      };
    }
  },

  createReview: async ({ productId, rating, comment, signal }) => {
    try {
      const response = await api.post(
        "reviews/",
        {
          productId,
          rating,
          comment,
        },
        { signal },
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.log(`[Service] ${error}`);
      return {
        success: false,
        data: {
          error: extractErrorMessage(error, "Unable to publish review."),
        },
      };
    }
  },
};
