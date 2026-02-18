export default function DropdownItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2 text-sm
        transition-colors
        ${
          danger
            ? "text-red-400 hover:bg-red-500/10"
            : "text-gray-300 hover:bg-white/5"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
