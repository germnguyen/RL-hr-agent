import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  BarChart3,
  Network,
  Upload,
  Users,
  Briefcase,
  LogOut,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import authService from "../../../services/client/authService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/dashboard", icon: <LayoutGrid />, label: "Tổng quan" },
  { path: "/reports", icon: <BarChart3 />, label: "Báo cáo & Thống kê" },
  {
    path: "/recruitment",
    icon: <Network />,
    label: "Quy trình tuyển dụng",
  },
  { path: "/upload-cv", icon: <Upload />, label: "Upload CV" },
  { path: "/candidates", icon: <Users />, label: "Quản lý ứng viên" },
  { path: "/jobs", icon: <Briefcase />, label: "Danh sách công việc" },
];

function ClientSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onClose,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [user] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const getInitial = () => {
    if (!user?.fullName) return "U";
    return user.fullName.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Đăng xuất thành công!");
      navigate("/");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const ctrlBtnCls =
    "size-[30px] shrink-0 rounded-[9px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.05)] text-[18px] text-[rgba(226,232,240,0.7)] transition-colors hover:border-[rgba(96,165,250,0.45)] hover:bg-[rgba(37,99,235,0.28)] hover:text-white focus-visible:ring-[#60a5fa]/50";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[100] flex w-[272px] flex-col overflow-x-hidden overflow-y-auto border-r border-[rgba(148,163,184,0.12)] bg-[radial-gradient(120%_70%_at_12%_0%,rgba(37,99,235,0.22),transparent_55%),linear-gradient(180deg,#060d1d_0%,#0a1327_55%,#090f1f_100%)] transition-[width,transform] duration-300 [scrollbar-color:rgba(148,163,184,0.25)_transparent] [scrollbar-width:thin]",
        collapsed && "w-[88px]",
        "max-lg:w-[280px] max-lg:-translate-x-full max-lg:shadow-[24px_0_60px_-30px_rgba(2,8,23,0.8)]",
        mobileOpen && "max-lg:translate-x-0",
      )}
    >
      {/* Head */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 pt-6 pb-[22px]",
          collapsed &&
            "flex-col gap-3.5 px-0 pt-[22px] pb-[18px] max-lg:flex-row max-lg:items-center max-lg:gap-2.5 max-lg:px-5 max-lg:pt-6 max-lg:pb-[22px]",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            collapsed && "justify-center max-lg:justify-start",
          )}
        >
          <div
            aria-hidden="true"
            className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#38bdf8_0%,#0087f1_55%,#2563eb_100%)] text-[20px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(56,189,248,0.75),inset_0_1px_0_rgba(255,255,255,0.35)]"
          >
            N
          </div>
          <span
            className={cn(
              "whitespace-nowrap text-[19px] font-extrabold tracking-[-0.02em] text-[#f8fafc]",
              collapsed && "hidden max-lg:flex",
            )}
          >
            Hr-agent
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            ctrlBtnCls,
            "ml-auto max-lg:hidden",
            collapsed && "ml-0",
          )}
          onClick={onToggleCollapse}
          aria-label={
            collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"
          }
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? (
            <ChevronRight className="size-[18px]" />
          ) : (
            <ChevronLeft className="size-[18px]" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(ctrlBtnCls, "hidden max-lg:ml-auto max-lg:flex")}
          onClick={onClose}
          aria-label="Đóng menu"
          title="Đóng menu"
        >
          <X className="size-[18px]" />
        </Button>
      </div>

      {/* Section label */}
      <span
        className={cn(
          "mb-2.5 px-6 text-[10px] font-bold tracking-[0.14em] whitespace-nowrap text-[rgba(148,163,184,0.62)] uppercase",
          collapsed && "hidden max-lg:flex",
        )}
      >
        Không gian làm việc
      </span>

      {/* Menu */}
      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 px-3 pb-4">
        {menuItems.map((item) => {
          const isActiveItem = pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              data-label={item.label}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-[13px] rounded-xl border border-transparent px-3.5 py-[11px] text-[13.5px] font-medium whitespace-nowrap text-[rgba(203,213,225,0.72)] no-underline transition-[background,color,border-color,transform] duration-[180ms] hover:bg-[rgba(255,255,255,0.055)] hover:border-[rgba(148,163,184,0.12)] hover:text-[#f1f5f9] hover:translate-x-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60a5fa]",
                  collapsed &&
                    "justify-center gap-0 px-3 py-3 hover:translate-x-0 max-lg:justify-start max-lg:px-3.5 max-lg:py-[11px] max-lg:gap-[13px]",
                  isActive &&
                    "border-[rgba(96,165,250,0.28)] bg-[linear-gradient(90deg,rgba(37,99,235,0.32)_0%,rgba(37,99,235,0.12)_70%,rgba(37,99,235,0.04)_100%)] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_26px_-18px_rgba(37,99,235,0.9)] before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-[3px] before:bg-[linear-gradient(180deg,#7dd3fc,#2563eb)] before:content-['']",
                )
              }
            >
              <span
                className={cn(
                  "flex w-[22px] shrink-0 items-center justify-center text-[rgba(148,163,184,0.8)] transition-colors group-hover:text-[#93c5fd]",
                  collapsed && "w-6",
                  isActiveItem && "text-[#7dd3fc]",
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "overflow-hidden text-ellipsis",
                  collapsed && "hidden max-lg:flex",
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "mx-3 my-3 flex flex-col gap-2.5 rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[rgba(255,255,255,0.035)] p-3.5",
          collapsed && "p-2.5 max-lg:p-3.5",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-[11px] rounded-[10px] p-1",
            collapsed && "justify-center p-0 max-lg:justify-start max-lg:p-1",
          )}
        >
          <span className="relative shrink-0">
            <Avatar className="size-[38px] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
              <AvatarFallback className="bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-sm font-bold text-white">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden="true"
              className="absolute -right-px -bottom-px size-2.5 rounded-full border-2 border-[#0a1327] bg-[#34d399]"
            />
          </span>
          <div
            className={cn(
              "flex min-w-0 flex-col gap-px",
              collapsed && "hidden max-lg:flex",
            )}
          >
            <span className="overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap text-[#f1f5f9]">
              {user?.fullName || "Người dùng"}
            </span>
            <span className="text-[11px] text-[rgba(148,163,184,0.7)]">
              Ứng viên
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-[38px] w-full justify-center gap-2 rounded-[10px] border border-[rgba(248,113,113,0.22)] bg-[rgba(239,68,68,0.1)] text-[13px] font-semibold text-[#fca5a5] transition-colors hover:border-[rgba(248,113,113,0.4)] hover:bg-[rgba(239,68,68,0.18)] hover:text-[#fecaca] focus-visible:ring-red-400/50",
            collapsed &&
              "mx-auto size-[38px] gap-0 p-0 max-lg:mx-0 max-lg:w-full max-lg:gap-2 max-lg:px-3",
          )}
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <LogOut className="size-[17px]" aria-hidden="true" />
          <span
            className={cn(collapsed && "hidden max-lg:flex")}
          >
            Đăng xuất
          </span>
        </Button>
      </div>
    </aside>
  );
}

export default ClientSidebar;
