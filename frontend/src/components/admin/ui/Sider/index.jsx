import { NavLink } from "react-router-dom";
import { Users, BarChart3, LayoutGrid, CalendarClock, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/admin/users", icon: <Users />, label: "Quản lý người dùng" },
  { path: "/admin/statistics", icon: <BarChart3 />, label: "Thống kê" },
];

function Sider() {
  return (
    <aside className="fixed top-0 left-0 z-20 flex h-screen w-[260px] flex-col overflow-y-auto bg-[linear-gradient(180deg,#0a1628_0%,#0d2137_40%,#0f2b4a_100%)]">
      <div className="flex items-center gap-3 px-6 pt-7 pb-8">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#0087f1,#00c6ff)] text-xl text-white">
          N
        </div>
        <span className="text-xl font-bold tracking-[-0.3px] text-white">
          Hr-agent
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3.5 rounded-[10px] px-4 py-3 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white/90",
                isActive &&
                  "bg-primary/20 text-white shadow-[inset_3px_0_0_0_#0087f1]",
              )
            }
          >
            <span className="flex w-6 shrink-0 items-center justify-center text-xl">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sider;
