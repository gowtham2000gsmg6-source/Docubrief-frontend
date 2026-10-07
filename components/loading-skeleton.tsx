export function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading documents">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="skeleton h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}
