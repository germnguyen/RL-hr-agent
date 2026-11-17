import { useState } from "react";
import { Outlet } from "react-router-dom";
import ClientSidebar from "../../components/clients/siderbar";
import ClientHeader from "../../components/clients/header";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "client-sidebar-collapsed";

function LayoutClientDefault() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fc] font-sans">
      <ClientSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col bg-[radial-gradient(75%_45%_at_100%_0%,rgba(59,130,246,0.07),transparent_55%),radial-gradient(60%_40%_at_0%_100%,rgba(56,189,248,0.05),transparent_60%),#f6f8fc] transition-[margin-left] duration-300 max-lg:ml-0",
          collapsed ? "lg:ml-[88px]" : "lg:ml-[272px]",
        )}
      >
        <ClientHeader
          onOpenSidebar={() => setMobileOpen(true)}
          onToggleSidebar={toggleCollapsed}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden px-5 sm:px-6 md:px-7 pb-8 pt-5 max-md:px-3.5 max-md:pb-6 max-md:pt-3.5">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[90] cursor-pointer border-0 bg-slate-950/50 backdrop-blur-[2px] transition-[opacity,visibility] duration-200 lg:hidden",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-label="Đóng menu điều hướng"
        tabIndex={mobileOpen ? 0 : -1}
      />
    </div>
  );
}

export default LayoutClientDefault;
