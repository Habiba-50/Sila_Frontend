// Any full-page loading state uses this: an animated infinity mark plus the
// brand slogan underneath, per the brand spec.
export default function Loader({ full = true }) {
  return (
    <div
      className={
        full
          ? "flex flex-col items-center justify-center min-h-[60vh] gap-4"
          : "flex flex-col items-center justify-center py-8 gap-3"
      }
    >
      <svg width="56" height="32" viewBox="0 0 56 32" fill="none">
        <path
          d="M14 4c-6.6 0-12 5.4-12 12s5.4 12 12 12c4.2 0 7.6-2 10-5.2 2.4-3.2 3.7-6.8 4-6.8.3 0 1.6 3.6 4 6.8 2.4 3.2 5.8 5.2 10 5.2 6.6 0 12-5.4 12-12S48.6 4 42 4c-4.2 0-7.6 2-10 5.2C29.6 12.4 28.3 16 28 16c-.3 0-1.6-3.6-4-6.8C21.6 6 18.2 4 14 4Z"
          stroke="#2F6F5E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80 40"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="240" dur="2.2s" repeatCount="indefinite" />
        </path>
      </svg>
      <p className="font-brand text-sm text-ink-soft tracking-wide">Connections that never end</p>
    </div>
  );
}
