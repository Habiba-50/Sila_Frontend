import { Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Navbar from "../Navbar/Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[1180px] mx-auto px-3 sm:px-5 py-4 sm:py-7 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 sm:gap-7">
        <Navbar />
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
