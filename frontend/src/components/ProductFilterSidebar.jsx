import { useEffect, useState } from "react";
import { ProductService } from "../service/product";
import LoadingSpinner from "./LoadingSpinner";

export default function ProductFilterSidebar({ filter, dispatch }) {
  const [allowedCategories, setAllowedCategories] = useState(
    filter.allowedCategories ? filter.allowedCategories : [],
  );
  const [sort, setSort] = useState(filter.sort ? filter.sort : "default");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const response = await ProductService.getCategories();
      if (response.success) {
        const categories = response.data.categories;
        setCategories(categories);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const handleCategorySelection = (cat) => {
    if (!allowedCategories.includes(cat))
      setAllowedCategories((prev) => [...prev, cat]);
    else {
      const newArr = [...allowedCategories.filter((item) => item !== cat)];
      setAllowedCategories(newArr);
    }
  };

  const handleReset = () => {
    setAllowedCategories([]);
    setSort("default");
    const { allowedCategories, sort, ...rest } = filter;
    dispatch({
      type: "filter/set",
      payload: { ...rest, sort: "default" },
    });
  };

  const handleApply = () => {
    if (allowedCategories.length > 0) {
      dispatch({
        type: "filter/set",
        payload: {
          ...filter,
          allowedCategories: allowedCategories,
          sort: sort,
        },
      });
    } else {
      const { allowedCategories, ...rest } = filter;
      dispatch({
        type: "filter/set",
        payload: { ...rest, sort: sort },
      });
    }
  };

  useEffect(() => {
    console.log("[ProductFilterSidebar]", filter);
  }, [filter]);

  return (
    <aside className="bg-[#0f2038] light:bg-white border border-white/10 light:border-slate-200 rounded-xl p-4 text-gray-100 light:text-slate-900 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white light:text-slate-900">
          Refine
        </h2>
        <span className="text-xs text-gray-400 light:text-slate-500">
          Filters
        </span>
      </div>

      {/* Categories */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-200 light:text-slate-700 uppercase tracking-wide">
          Department
        </h3>

        <div className="mt-3 space-y-2">
          {loading && <LoadingSpinner />}

          {!loading &&
            categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={allowedCategories.includes(cat)}
                  onChange={() => handleCategorySelection(cat)}
                  className="
                    h-4 w-4 rounded-sm
                    bg-[#0b172a] border border-white/30
                    text-blue-500
                    focus:ring-2 focus:ring-blue-500/40
                    light:bg-slate-100 light:border-slate-300
                  "
                />

                <span className="text-sm text-gray-200 light:text-slate-700 group-hover:text-white light:group-hover:text-slate-900 transition">
                  {cat}
                </span>
              </label>
            ))}
        </div>
      </div>

      {/* Sorting */}
      <div className="mt-6 border-t border-white/10 light:border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-gray-200 light:text-slate-700 uppercase tracking-wide">
          Sort by price
        </h3>

        <div className="grid grid-cols-1 gap-2 mt-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="priceSort"
              value="ascending"
              checked={sort === "ascending"}
              className="peer hidden"
              onChange={(e) => setSort(e.target.value)}
            />
            <div
              className="py-2 px-3 rounded-lg border border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-100
                     peer-checked:bg-blue-500/20 peer-checked:border-blue-400
                     hover:border-blue-400/50 transition text-sm"
            >
              Low → High
            </div>
          </label>

          <label className="cursor-pointer">
            <input
              type="radio"
              name="priceSort"
              checked={sort === "descending"}
              className="peer hidden"
              value="descending"
              onChange={(e) => setSort(e.target.value)}
            />
            <div
              className="py-2 px-3 rounded-lg border border-white/10 light:border-slate-200 bg-[#0b172a] light:bg-slate-100
                     peer-checked:bg-blue-500/20 peer-checked:border-blue-400
                     hover:border-blue-400/50 transition text-sm"
            >
              High → Low
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-5 border-t border-white/10 light:border-slate-200 mt-6">
        <button
          className="flex-grow py-2 bg-[#0b172a] light:bg-slate-100 text-gray-200 light:text-slate-700 rounded-lg border border-white/10 light:border-slate-200 hover:border-white/20 light:hover:border-slate-300 transition"
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          className="flex-grow py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={handleApply}
        >
          Apply
        </button>
      </div>
    </aside>
  );
}
