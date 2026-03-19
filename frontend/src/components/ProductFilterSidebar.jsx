import { X } from "lucide-react";
import { useEffect, useReducer } from "react";
import { ProductService } from "../service/product";
import LoadingSpinner from "./LoadingSpinner";

const initialState = {
  categories: [],
  loading: true,
  error: null,
};

function sidebarReducer(state, action) {
  switch (action.type) {
    case "sidebar/request":
      return { ...state, loading: true, error: null };
    case "sidebar/success":
      return { categories: action.payload, loading: false, error: null };
    case "sidebar/failure":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function ProductFilterSidebar({ filter, dispatch }) {
  const [state, sidebarDispatch] = useReducer(sidebarReducer, initialState);
  const selectedCategories = filter.allowedCategories || [];
  const selectedSort = filter.sort || null;
  const hasActiveFilters = Boolean(selectedCategories.length || selectedSort);

  useEffect(() => {
    const fetchCategories = async () => {
      sidebarDispatch({ type: "sidebar/request" });
      const response = await ProductService.getCategories();
      if (response.success) {
        sidebarDispatch({
          type: "sidebar/success",
          payload: response.data.categories,
        });
        return;
      }
      sidebarDispatch({
        type: "sidebar/failure",
        payload: "Unable to load categories",
      });
    };

    fetchCategories();
  }, []);

  const handleCategorySelection = (cat) => {
    const nextCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter((item) => item !== cat)
      : [...selectedCategories, cat];
    const nextFilter = { ...filter };

    if (nextCategories.length) {
      nextFilter.allowedCategories = nextCategories;
    } else {
      delete nextFilter.allowedCategories;
    }

    dispatch({
      type: "filter/set",
      payload: nextFilter,
    });
  };

  const handleSortSelection = (sort) => {
    const nextSort = selectedSort === sort ? null : sort;
    const nextFilter = { ...filter };

    if (nextSort) {
      nextFilter.sort = nextSort;
    } else {
      delete nextFilter.sort;
    }

    dispatch({
      type: "filter/set",
      payload: nextFilter,
    });
  };

  const clearFilters = () => {
    const nextFilter = { ...filter };
    delete nextFilter.allowedCategories;
    delete nextFilter.sort;
    dispatch({
      type: "filter/set",
      payload: nextFilter,
    });
  };

  return (
    <aside className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-4 text-gray-100 light:text-slate-900 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white light:text-slate-900">
          Refine
        </h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20 light:border-amber-300 light:bg-amber-50 light:text-amber-700 light:hover:bg-amber-100"
          >
            Clear filters
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="text-xs text-gray-400 light:text-slate-500">
            Filters
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-200 light:text-slate-700 uppercase tracking-wide">
          Department
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {state.loading && <LoadingSpinner />}

          {!state.loading &&
            state.categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleCategorySelection(cat)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-blue-400/70 bg-blue-500/20 text-blue-100 light:border-blue-300 light:bg-blue-50 light:text-blue-700"
                      : "border-white/10 bg-[#0b172a] text-gray-200 hover:border-blue-400/40 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700 light:hover:border-blue-300 light:hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}

          {!state.loading && !state.categories.length ? (
            <div className="text-sm text-gray-400 light:text-slate-500">
              No categories found
            </div>
          ) : null}

          {state.error ? (
            <div className="text-sm text-red-300 light:text-red-600">
              {state.error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 light:border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-gray-200 light:text-slate-700 uppercase tracking-wide">
          Sort by price
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Low to High", value: "ascending" },
            { label: "High to Low", value: "descending" },
          ].map((option) => {
            const isSelected = selectedSort === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => handleSortSelection(option.value)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  isSelected
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700"
                    : "border-white/10 bg-[#0b172a] text-gray-200 hover:border-emerald-400/40 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700 light:hover:border-emerald-300 light:hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
