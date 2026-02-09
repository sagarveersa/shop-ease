import { useNavigate, useParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { useContext, useEffect, useState } from "react";
import { ProductService } from "../service/product.service";
import { cartContext } from "../context/CartContext";
import { authContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { Navbar } from "../components/Navbar";
import { checkoutContext } from "../context/CheckoutContext";
import { toast } from "react-toastify";

export default function Product() {
  const { cart, addToCart } = useContext(cartContext);
  const { loggedIn } = useContext(authContext);
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCart, setInCart] = useState(false);
  const { setCheckoutProducts } = useContext(checkoutContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn && cart && product && cart[product.id]) {
      setInCart(true);
    } else {
      setInCart(false);
    }
  }, [cart, product]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      const response = await ProductService.getProductDetails(id);
      setLoading(false);

      if (!response.success) {
        setError(response.data.error);
      } else {
        setProduct(response.data);
        setError(null);
      }
    };

    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (!error) {
      toast.error(error);
    }
  }, [error]);

  const checkout = () => {
    if (!product) return;
    setCheckoutProducts([{ ...product, qty: 1 }]);
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="bg-gray-900 h-[100dvh] text-white">
        <SearchBar />
        <div className="w-full p-6 mt-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 h-[100dvh] text-white">
      <Navbar />
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full p-6">
          <div className="flex flex-col md:flex-row bg-gray-800 rounded-xl shadow-2xl w-full h-full">
            {/* Product Image */}
            <div className="bg-gray-800 rounded-xl p-6 flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-[360px] w-auto object-contain rounded-lg"
              />
            </div>

            {/* Product Details */}
            <div className="md:w-1/2 w-full p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h1 className="text-4xl font-extrabold mb-4">{product.name}</h1>

                {/* Rating & Stock */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-6 h-6 ${i < product.rating ? "fill-current" : "text-gray-600"}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09L5.5 11.545 1 7.91l6.061-.88L10 2l2.939 5.03L19 7.91l-4.5 3.636 1.378 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-3 text-gray-400">
                    ({product.reviews} reviews)
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-md mb-6">
                  {product.description}
                </p>

                {/* Features / Highlights */}
                {product.features && product.features.length > 0 && (
                  <div className="mb-6">
                    <h2 className="font-semibold text-xl mb-2 text-gray-200">
                      Features:
                    </h2>
                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <h2 className="text-3xl font-bold mb-6">${product.price}</h2>
              </div>

              {/* Additional Static Details */}
              <div className="mb-6 space-y-4 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">✓</span>
                  <span>Free shipping on orders over $50</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">✓</span>
                  <span>30-day hassle-free returns</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">✓</span>
                  <span>1-year limited warranty included</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">✓</span>
                  <span>Ships within 24–48 hours</span>
                </div>
              </div>

              {/* Trust & Payment Info */}
              <div className="mb-4 text-xs text-gray-400">
                <p>🔒 Secure checkout • SSL encrypted payments</p>
                <p className="mt-1">
                  Accepted payments: Visa, Mastercard, PayPal, Apple Pay
                </p>
              </div>

              {/* Customer Confidence */}
              <div className="mt-4 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
                <p className="font-semibold text-gray-200 mb-1">
                  Why customers love this product
                </p>
                <p>
                  Built with premium materials, tested for durability, and
                  trusted by thousands of customers worldwide.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                {loggedIn && !inCart && (
                  <button
                    className="bg-blue-600 p-4 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                )}
                {loggedIn && inCart && (
                  <button
                    className="bg-blue-600 p-4 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500"
                    disabled
                  >
                    In Cart
                  </button>
                )}
                {!loggedIn && (
                  <button
                    className="bg-blue-600 p-4 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500"
                    disabled
                  >
                    Add to Cart
                  </button>
                )}
                <button
                  className="bg-green-600 p-4 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
                  onClick={checkout}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
