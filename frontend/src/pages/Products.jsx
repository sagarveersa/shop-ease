import { useContext, useEffect, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import ProductFilterSidebar from "../components/ProductFilterSidebar";
import SearchBar from "../components/SearchBar";
import { cartContext } from "../context/CartContext";
import { ProductService } from "../service/product";

const initialState = {
  products: [],
  filter: {},
  loading: true,
  productsError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "filter/set":
      return { ...state, filter: action.payload };
    case "filter/mergeQuery": {
      const queryParam = action.payload ?? "";
      const prevQuery = state.filter.query ?? "";
      if (prevQuery === queryParam) return state;
      if (queryParam) {
        return { ...state, filter: { ...state.filter, query: queryParam } };
      }
      const rest = { ...state.filter };
      delete rest.query;
      return { ...state, filter: rest };
    }
    case "loading":
      return { ...state, loading: true };
    case "success":
      return {
        ...state,
        loading: false,
        products: action.payload,
        productsError: null,
      };
    case "error":
      return { ...state, loading: false, productsError: action.payload };
    case "error/clear":
      return { ...state, productsError: null };
    default:
      return state;
  }
}

export function Products() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchParams] = useSearchParams();
  const { error, setError } = useContext(cartContext);
  const { products, filter, loading, productsError } = state;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const queryParam = searchParams.get("q") ?? "";
    dispatch({ type: "filter/mergeQuery", payload: queryParam });
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      dispatch({ type: "loading" });
      const response = await ProductService.getProducts(filter);
      if (!response.success) {
        dispatch({ type: "error", payload: response.data.error });
        return;
      }

      dispatch({ type: "success", payload: response.data.products });
    };

    fetchProducts();
  }, [filter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    if (productsError) {
      toast.error(productsError);
      dispatch({ type: "error/clear" });
    }
  }, [productsError]);

  const selectedSortLabel =
    filter.sort === "ascending"
      ? "Price: Low to High"
      : filter.sort === "descending"
        ? "Price: High to Low"
        : "Featured";

  return (
    <div className="bg-[#0b172a] light:bg-slate-50 h-[100dvh] flex flex-col overflow-hidden text-white light:text-slate-900">
      <SearchBar />
      <div className="mt-16 h-[calc(100dvh-4rem)] overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="text-xs text-gray-400 light:text-slate-500">
            Store / Products{" "}
            {filter.query && (
              <>
                / <span className="text-gray-200 light:text-slate-700">{filter.query}</span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto h-fit">
            <ProductFilterSidebar
              filter={filter}
              dispatch={dispatch}
            />
          </div>

          {/* Products area */}
          <main className="relative">
            <div className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-300 light:text-slate-600">
                {products.length} results
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden text-xs px-3 py-1.5 rounded-md border border-white/10 light:border-slate-200 text-gray-200 light:text-slate-700 hover:border-white/20 light:hover:border-slate-300 transition"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  Filters
                </button>
                <div className="text-xs text-gray-400 light:text-slate-500">
                  Sort: {selectedSortLabel}
                </div>
              </div>
            </div>

            {loading && !productsError && (
              <div className="relative sm:absolute sm:inset-0 min-h-[40vh] sm:min-h-0 flex justify-center items-center">
                <LoadingSpinner />
              </div>
            )}

            {!loading && !productsError && products.length === 0 && (
              <div className="text-gray-400 light:text-slate-600 text-center py-10 bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl">
                No products found
              </div>
            )}

            {!loading && !productsError && (
              <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  return <ProductCard key={product.id} product={product} />;
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl bg-[#0b172a] light:bg-white border-t border-white/10 light:border-slate-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300 light:text-slate-700">Filters</div>
              <button
                className="text-xs text-gray-400 light:text-slate-500 hover:text-gray-200 light:hover:text-slate-700"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Close
              </button>
            </div>
            <ProductFilterSidebar filter={filter} dispatch={dispatch} />
          </div>
        </div>
      )}
    </div>
  );
}
