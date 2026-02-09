import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-950 h-[100dvh] flex flex-col overflow-hidden text-white">
      <Navbar />

      <main className="pt-16 flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center space-y-8">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Shop Smarter.
            <span className="block text-blue-500 mt-2">
              Discover Products You’ll Love
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-gray-400 text-lg md:text-xl">
            Browse curated categories, manage your cart effortlessly, and enjoy
            a seamless shopping experience.
          </p>

          {/* Button */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/products")}
              className="
                px-8 py-4 rounded-xl
                bg-blue-600 text-white font-semibold text-lg
                hover:bg-blue-700 active:scale-[0.97]
                transition
              "
            >
              Browse Products
            </button>
          </div>
        </div>
      </main>

      {/* Footer hint */}
      <footer className="text-center text-gray-500 text-sm pb-6">
        © {new Date().getFullYear()} ShopEase. All rights reserved.
      </footer>
    </div>
  );
}
