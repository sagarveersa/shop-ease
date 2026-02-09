import { useEffect, useState } from "react";
import { ProductService } from "../service/product.service";
import LoadingSpinner from "./LoadingSpinner";

export default function ProductFilterSidebar({ filter, setFilter }) {
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
  };

  const handleApply = () => {
    if (allowedCategories.length > 0) {
      setFilter((prev) => ({
        ...prev,
        allowedCategories: allowedCategories,
        sort: sort,
      }));
    } else {
      setFilter((prev) => ({ ...prev, sort: sort }));
    }
  };

  return (
    <aside className="bg-gray-800 p-4 space-y-6 text-gray-100 overflow-y-auto rounded-xl shadow-lg">
      {/* Title */}
      <h2 className="text-xl font-semibold text-white">Filters</h2>

      {/* Categories */}
      <div>
        <h3 className="font-medium mb-3 text-gray-200">Categories</h3>

        <div className="space-y-2">
          {loading && <LoadingSpinner />}

          {!loading &&
            categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-3 cursor-pointer group"
              >
                {/* Custom Checkbox */}
                <input
                  type="checkbox"
                  checked={allowedCategories.includes(cat)}
                  onChange={() => handleCategorySelection(cat)}
                  className="peer hidden"
                />

                <div
                  className="h-5 w-5 rounded-md border border-gray-500 bg-gray-700 
                            peer-checked:bg-blue-600 peer-checked:border-blue-500
                            flex items-center justify-center transition"
                >
                  <svg
                    className="hidden peer-checked:block h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <span className="text-sm text-gray-200 group-hover:text-white transition">
                  {cat}
                </span>
              </label>
            ))}
        </div>
      </div>

      {/* Sorting */}
      <div>
        <h3 className="font-medium mb-3 text-gray-200">Sort by Price</h3>

        <div className="grid grid-cols-2 gap-2">
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
              className="py-2 text-center rounded-lg border border-gray-600 bg-gray-700
                     peer-checked:bg-blue-600 peer-checked:border-blue-500
                     hover:bg-gray-600 transition text-sm"
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
              className="py-2 text-center rounded-lg border border-gray-600 bg-gray-700
                     peer-checked:bg-blue-600 peer-checked:border-blue-500
                     hover:bg-gray-600 transition text-sm"
            >
              High → Low
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          className="flex-grow py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition"
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
