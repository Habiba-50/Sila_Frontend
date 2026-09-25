import { Outlet } from "react-router-dom";
import BrandMark from "../BrandMark/BrandMark";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark size={52} nameClass="text-3xl" stacked />
          <p className="text-ink-soft text-sm mt-2.5 font-brand">Connections that never end</p>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-7 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
