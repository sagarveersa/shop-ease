import { ArrowLeft, Trash } from "lucide-react";
import { useContext, useEffect, useMemo, useReducer } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { Navbar } from "../components/Navbar";
import { authContext } from "../context/AuthContext";
import { cartContext } from "../context/CartContext";
import { ProductService } from "../service/product";
import { ReviewService } from "../service/review";
import { trackEvent } from "../utils/analytics";

const initialState = {
  product: null,
  loading: true,
  error: null,
  reviews: [],
  reviewsLoading: true,
  reviewsError: null,
  reviewForm: {
    rating: 5,
    comment: "",
  },
  reviewSubmitStatus: "idle",
  reviewSubmitError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "product/request":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "product/success":
      return {
        ...state,
        product: action.payload,
        loading: false,
        error: null,
      };
    case "product/error":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "product/clearError":
      return {
        ...state,
        error: null,
      };
    case "reviews/request":
      return {
        ...state,
        reviewsLoading: true,
        reviewsError: null,
      };
    case "reviews/success":
      return {
        ...state,
        reviews: action.payload,
        reviewsLoading: false,
        reviewsError: null,
      };
    case "reviews/error":
      return {
        ...state,
        reviewsLoading: false,
        reviewsError: action.payload,
      };
    case "reviews/clearError":
      return {
        ...state,
        reviewsError: null,
      };
    case "review/setField":
      return {
        ...state,
        reviewForm: {
          ...state.reviewForm,
          [action.field]: action.value,
        },
      };
    case "review/submit":
      return {
        ...state,
        reviewSubmitStatus: "loading",
        reviewSubmitError: null,
      };
    case "review/submitSuccess":
      return {
        ...state,
        reviewForm: {
          rating: 5,
          comment: "",
        },
        reviewSubmitStatus: "success",
        reviewSubmitError: null,
      };
    case "review/submitError":
      return {
        ...state,
        reviewSubmitStatus: "error",
        reviewSubmitError: action.payload,
      };
    case "review/submitIdle":
      return {
        ...state,
        reviewSubmitStatus: "idle",
        reviewSubmitError: null,
      };
    default:
      return state;
  }
}

function renderStars(rating, sizeClass = "w-5 h-5") {
  const roundedRating = Math.round(rating);
  return Array.from({ length: 5 }).map((_, i) => (
    <svg
      key={i}
      className={`${sizeClass} ${i < roundedRating ? "fill-current text-yellow-400" : "text-gray-600 light:text-slate-300"}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <path d="M10 15l-5.878 3.09L5.5 11.545 1 7.91l6.061-.88L10 2l2.939 5.03L19 7.91l-4.5 3.636 1.378 6.545z" />
    </svg>
  ));
}

export default function Product() {
  const { cart, addToCart, removeFromCart } = useContext(cartContext);
  const { loggedIn, name } = useContext(authContext);
  const { id } = useParams();
  const location = useLocation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const browsePath = useMemo(
    () => location.state?.from || "/products",
    [location.state],
  );
  const { product, loading, reviews, reviewsLoading, reviewForm, reviewSubmitStatus } = state;

  const cartItem = loggedIn && cart && product ? cart[product.id] : null;
  const inCart = !!cartItem;
  const averageRating = product?.avgRating ?? 0;
  const totalRatings = product?.ratingCount ?? 0;
  const availableStock = product?.stock ?? 0;
  const isInStock = product?.isInStock ?? availableStock > 0;
  const canIncreaseCartQuantity = !cartItem || cartItem.qty < availableStock;

  const loadProductDetails = async ({ showLoader = true, trackView = true } = {}) => {
    if (showLoader) {
      dispatch({ type: "product/request" });
    }

    const response = await ProductService.getProductDetails(id);

    if (!response.success) {
      dispatch({
        type: "product/error",
        payload: "Unable to load product details.",
      });
      return null;
    }

    dispatch({ type: "product/success", payload: response.data });

    if (trackView) {
      trackEvent("View Product", {
        product_id: response.data.id,
        product_name: response.data.name,
        price: response.data.price,
      });
    }

    return response.data;
  };

  const loadReviews = async ({ showLoader = true } = {}) => {
    if (showLoader) {
      dispatch({ type: "reviews/request" });
    }

    const response = await ReviewService.getProductReviews({ productId: id });
    if (!response.success) {
      dispatch({
        type: "reviews/error",
        payload: response.data.error,
      });
      return;
    }

    dispatch({ type: "reviews/success", payload: response.data.reviews });
  };

  useEffect(() => {
    loadProductDetails();
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      dispatch({ type: "product/clearError" });
    }
  }, [state.error]);

  useEffect(() => {
    if (state.reviewsError) {
      toast.error(state.reviewsError);
      dispatch({ type: "reviews/clearError" });
    }
  }, [state.reviewsError]);

  useEffect(() => {
    if (state.reviewSubmitStatus === "success") {
      toast.success("Review published successfully.");
      dispatch({ type: "review/submitIdle" });
    }

    if (state.reviewSubmitStatus === "error" && state.reviewSubmitError) {
      toast.error(state.reviewSubmitError);
      dispatch({ type: "review/submitIdle" });
    }
  }, [state.reviewSubmitStatus, state.reviewSubmitError]);

  const checkout = () => {
    if (!product) return;
    trackEvent("Begin Checkout", {
      source: "buy_now",
      total_items: 1,
      total_price: product.price,
      items: [
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
        },
      ],
    });
    navigate(`/checkout?source=buy_now&productId=${product.id}&quantity=1`, {
      state: { product },
    });
  };

  const handleReviewFieldChange = (field, value) => {
    dispatch({
      type: "review/setField",
      field,
      value,
    });
  };

  const handleReviewSubmit = async () => {
    if (!product || !loggedIn) {
      return;
    }

    dispatch({ type: "review/submit" });
    const response = await ReviewService.createReview({
      productId: product.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    });

    if (!response.success) {
      dispatch({
        type: "review/submitError",
        payload: response.data.error,
      });
      return;
    }

    dispatch({ type: "review/submitSuccess" });
    await Promise.all([
      loadProductDetails({ showLoader: false, trackView: false }),
      loadReviews({ showLoader: false }),
    ]);
  };

  if (loading) {
    return (
      <div className="bg-[#0b172a] light:bg-slate-50 h-[100dvh] text-white light:text-slate-900">
        <Navbar />
        <div className="w-full p-6 mt-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b172a] light:bg-slate-50 h-[100dvh] text-white light:text-slate-900">
      <Navbar />
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
        <div className="w-full p-6">
          {product ? (
            <div className="max-w-6xl mx-auto">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate(browsePath)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 light:border-slate-200 bg-[#0f2038] light:bg-white px-4 py-2 text-sm font-medium text-gray-200 light:text-slate-700 transition hover:border-blue-400/50 hover:text-white light:hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Browse
                </button>

                <div className="text-xs text-gray-400 light:text-slate-500">
                  Store / Products /{" "}
                  <span className="text-gray-200 light:text-slate-700">
                    {product.name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr_0.8fr] gap-6">
                {/* Image Panel */}
                <div className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-5 lg:sticky lg:top-24 h-fit">
                  <div className="bg-[#0b172a] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-lg p-4 flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="max-h-[420px] w-auto object-contain"
                    />
                  </div>
                  <div className="mt-4 text-xs text-gray-400 light:text-slate-500">
                    Roll over image to zoom in
                  </div>
                </div>

                {/* Main Details */}
                <div className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-6">
                  <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                    {product.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                    <div className="flex items-center">
                      {renderStars(averageRating)}
                    </div>
                    <span className="font-medium text-gray-200 light:text-slate-800">
                      {averageRating.toFixed(1)} / 5
                    </span>
                    <span className="text-gray-400 light:text-slate-600">
                      {totalRatings} ratings
                    </span>
                    <span className="text-gray-500 light:text-slate-400">|</span>
                    <span className={isInStock ? "text-green-400" : "text-red-400"}>
                      {isInStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-white/10 light:border-slate-200 pt-4">
                    <p className="text-sm text-gray-400 light:text-slate-600">Price</p>
                    <p className="text-3xl font-bold text-blue-300 light:text-blue-600">
                      ${product.price}
                    </p>
                    <p className="text-xs text-gray-500 light:text-slate-500 mt-1">
                      Inclusive of all taxes
                    </p>
                  </div>

                  <div className="mt-5 text-gray-300 light:text-slate-600 leading-relaxed">
                    {product.description}
                  </div>

                  {product.features && product.features.length > 0 && (
                    <div className="mt-6">
                      <h2 className="font-semibold text-lg text-gray-200 light:text-slate-800">
                        About this item
                      </h2>
                      <ul className="mt-3 text-sm text-gray-300 light:text-slate-600 space-y-2">
                        {product.features.map((feature, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-green-400 mt-[2px]">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-gray-300 light:text-slate-600">
                    <div className="bg-[#0b172a] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-lg p-3">
                      Free shipping on orders over $50
                    </div>
                    <div className="bg-[#0b172a] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-lg p-3">
                      30-day hassle-free returns
                    </div>
                    <div className="bg-[#0b172a] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-lg p-3">
                      Ships within 24–48 hours
                    </div>
                    <div className="bg-[#0b172a] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-lg p-3">
                      1-year limited warranty included
                    </div>
                  </div>
                </div>

                {/* Buy Box */}
                <div className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-5 h-fit">
                  <div className="text-2xl font-semibold text-blue-300 light:text-blue-600">
                    ${product.price}
                  </div>
                  <div className="text-xs text-gray-400 light:text-slate-600 mt-1">
                    FREE delivery{" "}
                    <span className="text-gray-200 light:text-slate-700">
                      Tomorrow
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 light:text-slate-500">
                    Order within 5 hrs 12 mins
                  </div>

                  <div
                    className={`mt-4 text-sm font-medium ${
                      isInStock ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isInStock ? "In stock" : "Out of stock"}
                  </div>

                  <div className="mt-4 space-y-3">
                    {loggedIn && !inCart && (
                      <button
                        className="w-full bg-blue-600 px-4 py-3 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500 light:disabled:hover:bg-slate-300"
                        onClick={() => addToCart(product)}
                        disabled={!isInStock}
                      >
                        {isInStock ? "Add to Cart" : "Out of Stock"}
                      </button>
                    )}
                    {loggedIn && inCart && (
                      <div className="flex items-center justify-center gap-3 rounded-lg border border-blue-500/40 bg-[#0b172a] light:bg-slate-100 px-4 py-3">
                        <button
                          onClick={() => removeFromCart(product)}
                          className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-md text-white hover:bg-blue-700 transition"
                        >
                          {cartItem.qty > 1 ? "−" : <Trash size={16} />}
                        </button>

                        <span className="w-10 text-center font-semibold text-white light:text-slate-900 border border-blue-600 rounded-md py-1.5">
                          {cartItem.qty}
                        </span>

                        <button
                          onClick={() => addToCart(product)}
                          disabled={!canIncreaseCartQuantity}
                          className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-md text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500"
                        >
                          +
                        </button>
                      </div>
                    )}
                    {!loggedIn && (
                      <button
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition shadow-lg disabled:cursor-not-allowed ${
                          isInStock
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-500 text-gray-300 light:bg-slate-300 light:text-slate-500"
                        }`}
                        disabled
                      >
                        {isInStock ? "Add to Cart" : "Out of Stock"}
                      </button>
                    )}
                    <button
                      className="w-full bg-green-600 px-4 py-3 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500 light:disabled:hover:bg-slate-300"
                      onClick={checkout}
                      disabled={!isInStock}
                    >
                      Buy Now
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-400 light:text-slate-500">
                    🔒 Secure checkout • SSL encrypted payments
                  </div>

                  <div className="mt-4 border-t border-white/10 light:border-slate-200 pt-4 text-xs text-gray-400 light:text-slate-500 space-y-1">
                    <div>Ships from ShopEase</div>
                    <div>Sold by ShopEase</div>
                    <div>30-day returns</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
                <section className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-white light:text-slate-900">
                        Customer Reviews
                      </h2>
                      <p className="mt-1 text-sm text-gray-400 light:text-slate-500">
                        See what other shoppers think before you buy.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-100 px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {renderStars(averageRating, "w-4 h-4")}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-white light:text-slate-900">
                        {averageRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400 light:text-slate-500">
                        {totalRatings} total ratings
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {reviewsLoading ? (
                      <div className="flex justify-center py-10">
                        <LoadingSpinner />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-100 px-4 py-8 text-center text-sm text-gray-400 light:text-slate-500">
                        No reviews yet. Be the first to rate this product.
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <article
                          key={review.id}
                          className="rounded-xl border border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-medium text-white light:text-slate-900">
                                {review.userName}
                              </h3>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex items-center">
                                  {renderStars(review.rating, "w-4 h-4")}
                                </div>
                                <span className="text-xs text-gray-400 light:text-slate-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 light:border-amber-300 light:bg-amber-50 light:text-amber-700">
                              {review.rating}/5
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-gray-300 light:text-slate-600">
                            {review.comment || "No written review provided."}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <aside className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-6 h-fit xl:sticky xl:top-24">
                  <h2 className="text-2xl font-semibold text-white light:text-slate-900">
                    Write a Review
                  </h2>
                  <p className="mt-2 text-sm text-gray-400 light:text-slate-500">
                    Share your experience and rate this product for other buyers.
                  </p>

                  {!loggedIn ? (
                    <div className="mt-5 rounded-xl border border-dashed border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-100 px-4 py-6 text-sm text-gray-400 light:text-slate-500">
                      Sign in to publish a rating and review.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 light:text-slate-700">
                          Your Rating
                        </label>
                        <div className="mt-3 flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((ratingValue) => {
                            const selected = ratingValue <= reviewForm.rating;
                            return (
                              <button
                                key={ratingValue}
                                type="button"
                                onClick={() =>
                                  handleReviewFieldChange("rating", ratingValue)
                                }
                                className={`rounded-lg border px-3 py-2 transition ${
                                  selected
                                    ? "border-amber-400/60 bg-amber-400/15 text-amber-300 light:border-amber-300 light:bg-amber-50 light:text-amber-700"
                                    : "border-white/10 bg-[#0b172a] text-gray-300 hover:border-amber-400/40 light:border-slate-200 light:bg-slate-100 light:text-slate-600 light:hover:border-amber-300"
                                }`}
                              >
                                {ratingValue}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="review-comment"
                          className="block text-sm font-medium text-gray-200 light:text-slate-700"
                        >
                          Your Review
                        </label>
                        <textarea
                          id="review-comment"
                          rows="5"
                          value={reviewForm.comment}
                          onChange={(e) =>
                            handleReviewFieldChange("comment", e.target.value)
                          }
                          placeholder={`What stood out to you about ${product.name}?`}
                          className="mt-3 w-full rounded-xl border border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-50 px-4 py-3 text-sm text-white light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div className="rounded-xl border border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-100 px-4 py-3 text-sm text-gray-300 light:text-slate-600">
                        Posting as{" "}
                        <span className="font-medium text-white light:text-slate-900">
                          {name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleReviewSubmit}
                        disabled={reviewSubmitStatus === "loading"}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {reviewSubmitStatus === "loading"
                          ? "Publishing..."
                          : "Publish Review"}
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-gray-300 light:text-slate-600">
              <div>Product not found.</div>
              <button
                type="button"
                onClick={() => navigate(browsePath)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 light:border-slate-200 bg-[#0f2038] light:bg-white px-4 py-2 text-sm font-medium text-gray-200 light:text-slate-700 transition hover:border-blue-400/50 hover:text-white light:hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Browse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
