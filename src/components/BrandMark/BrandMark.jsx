import logo from "../../assets/logo.jpg";

// The wordmark + tile used on the top header and the auth screens.
// `size` controls the logo tile; pass `withName={false}` to show just the tile.
export default function BrandMark({
  size = 34,
  withName = true,
  nameClass = "text-xl",
  stacked = false,
}) {
  return (
    <div
      className={
        stacked
          ? "flex flex-col items-center gap-2.5"
          : "flex items-center gap-2.5"
      }
    >
      <img
        src={logo}
        alt="Sila"
        style={{ width: size, height: size }}
        className="rounded-[9px] object-cover flex-shrink-0"
      />
      {withName && (
        <span className={`font-brand font-semibold text-ink ${nameClass}`}>
          صلة
        </span>
      )}
    </div>
  );
}
