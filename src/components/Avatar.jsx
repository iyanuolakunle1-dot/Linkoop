export default function Avatar({ name = "?", color = "#6366F1", size = 10, status, className = "" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const px = size * 4;

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: px, height: px }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold"
        style={{ backgroundColor: color, fontSize: px / 2.4 }}
      >
        {initials}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900 ${
            status === "online"
              ? "bg-emerald-500"
              : status === "away"
              ? "bg-amber-500"
              : "bg-gray-400"
          }`}
          style={{ width: px / 3.2, height: px / 3.2 }}
        />
      )}
    </div>
  );
}