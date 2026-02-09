export default function LoadingSpinner({
  size = "w-12 h-12",
  color = "border-blue-500",
}) {
  return (
    <div className="flex justify-center items-center py-6">
      <div
        className={`${size} border-4 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin ${color}`}
      ></div>
    </div>
  );
}
