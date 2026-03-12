import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { Navbar } from "../components/Navbar";
import { authContext } from "../context/AuthContext";
import { cartContext } from "../context/CartContext";
import { checkoutContext } from "../context/CheckoutContext";
import { ProductService } from "../service/product";
import { trackEvent } from "../utils/analytics";

export default function Product() {
  const { cart, addToCart } = useContext(cartContext);
  const { loggedIn } = useContext(authContext);
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setCheckoutItems } = useContext(checkoutContext);
  const navigate = useNavigate();

  const inCart = loggedIn && cart && product && cart[product.id];

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      const response = await ProductService.getProductDetails(id);
      setLoading(false);

      if (!response.success) {
        setError(response.data.error);
      } else {
        console.log("Product", response.data);
        setProduct(response.data);
        setError(null);

        console.log("tracking view product");
        trackEvent("View Product", {
          product_id: response.data.id,
          product_name: response.data.name,
          price: response.data.price,
        });
      }
    };

    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const checkout = () => {
    if (!product) return;
    setCheckoutItems([{ product: product, qty: 1 }]);
    navigate("/checkout");
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
              <div className="text-xs text-gray-400 light:text-slate-500 mb-4">
                Store / Products /{" "}
                <span className="text-gray-200 light:text-slate-700">
                  {product.name}
                </span>
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
                    <div className="flex items-center text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < product.rating ? "fill-current" : "text-gray-600 light:text-slate-300"}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09L5.5 11.545 1 7.91l6.061-.88L10 2l2.939 5.03L19 7.91l-4.5 3.636 1.378 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-400 light:text-slate-600">
                      {product.reviews ?? 0} ratings
                    </span>
                    <span className="text-gray-500 light:text-slate-400">|</span>
                    <span className="text-green-400">In Stock</span>
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

                  <div className="mt-4 text-sm text-green-400">In stock</div>

                  <div className="mt-4 space-y-3">
                    {loggedIn && !inCart && (
                      <button
                        className="w-full bg-blue-600 px-4 py-3 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>
                    )}
                    {loggedIn && inCart && (
                      <button
                        className="w-full bg-blue-600 px-4 py-3 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500 light:disabled:hover:bg-slate-300"
                        disabled
                      >
                        In Cart
                      </button>
                    )}
                    {!loggedIn && (
                      <button
                        className="w-full bg-blue-600 px-4 py-3 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-500 disabled:text-gray-300 light:disabled:bg-slate-300 light:disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500 light:disabled:hover:bg-slate-300"
                        disabled
                      >
                        Add to Cart
                      </button>
                    )}
                    <button
                      className="w-full bg-green-600 px-4 py-3 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
                      onClick={checkout}
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
            </div>
          ) : (
            <div className="text-gray-300 light:text-slate-600">
              Product not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
