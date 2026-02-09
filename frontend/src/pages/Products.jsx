import SearchBar from "../components/SearchBar";
import ProductFilterSidebar from "../components/ProductFilterSidebar";
import { ProductService } from "../service/product.service";
import { useContext, useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { cartContext } from "../context/CartContext";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

export function Products() {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParmas] = useSearchParams();
  const [filter, setFilter] = useState({});
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const { error, setError } = useContext(cartContext);

  useEffect(() => {
    setFilter((prev) => {
      const q = searchParams.get("q");
      if (q) {
        return { ...prev, query: q };
      }

      return prev;
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const response = await ProductService.getProducts(filter);
      setLoading(false);
      if (!response.success) {
        setProductsError(response.data.error);
        return;
      }

      setProducts(response.data.products);
      setProductsError(null);
    };

    fetchProducts();
  }, [filter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (productsError) {
      toast.error(productsError);
      setProductsError(null);
    }
  }, [productsError]);

  return (
    <div>
      <SearchBar />
      <div className="bg-gray-950 min-h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-700 bg-gray-800 p-6">
          <ProductFilterSidebar filter={filter} setFilter={setFilter} />
        </div>

        {/* Products area */}
        <main className="flex-1 ml-72 mt-16 h-[calc(100vh-4rem)] overflow-y-auto p-6 bg-gray-900 relative">
          {loading && !productsError && (
            <div className="absolute inset-0 flex justify-center items-center">
              <LoadingSpinner />
            </div>
          )}

          {!loading && !productsError && products.length === 0 && (
            <div className="text-gray-400 text-center py-10">
              No products found
            </div>
          )}

          {!loading && !productsError && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                return <ProductCard key={product.id} product={product} />;
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
