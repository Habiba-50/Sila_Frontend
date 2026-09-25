import { Link } from "react-router-dom";

export default function Notfound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <h1 className="font-display text-5xl font-semibold mb-3">Lost the thread</h1>
      <p className="text-ink-soft mb-6">
        This page doesn't exist, or it moved somewhere we didn't follow.
      </p>
      <Link
        to="/"
        className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold text-sm"
      >
        Back to your feed
      </Link>
    </div>
  );
}
