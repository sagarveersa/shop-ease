export default function OrdersSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
        >
          <div className="h-4 bg-gray-200 w-1/3 mb-3 rounded" />
          <div className="h-3 bg-gray-200 w-1/2 mb-4 rounded" />
          <div className="h-6 bg-gray-200 w-full rounded" />
        </div>
      ))}
    </>
  );
}
