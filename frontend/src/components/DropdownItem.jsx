export default function DropdownItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2 text-sm
        transition-colors
        ${
          danger
            ? "text-red-400 light:text-red-600 hover:bg-red-500/10 light:hover:bg-red-50"
            : "text-gray-300 light:text-slate-700 hover:bg-white/5 light:hover:bg-slate-100"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
