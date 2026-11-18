import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, ChevronDown, LogOut, Menu } from "lucide-react";
import { toast } from "react-toastify";
import authService from "../../../services/client/authService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_TITLES = [
  { prefix: "/dashboard", title: "Tổng quan" },
  { prefix: "/reports", title: "Báo cáo & Thống kê" },
  { prefix: "/recruitment", title: "Quy trình tuyển dụng" },
  { prefix: "/upload-cv", title: "Upload CV" },
  { prefix: "/candidates", title: "Quản lý ứng viên" },
  { prefix: "/jobs", title: "Danh sách công việc" },
];

const getPageTitle = (pathname) => {
  const match = PAGE_TITLES.find((item) => pathname.startsWith(item.prefix));
  return match ? match.title : "Hr-agent";
};

function ClientHeader({ onOpenSidebar, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const getInitial = () => {
    if (!user?.fullName) return "U";
    return user.fullName.charAt(0).toUpperCase();
  };

  const handleMenuClick = () => {
    if (window.matchMedia("(max-width: 1024px)").matches) {
      onOpenSidebar?.();
    } else {
      onToggleSidebar?.();
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Local session is cleared even if the API call fails
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Đăng xuất thành công!");
    navigate("/");
  };

  const today = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-50 flex h-[76px] items-center justify-between gap-5 border-b border-black/[0.07] bg-white/80 px-8 backdrop-blur-xl max-md:h-[66px] max-md:px-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl border-[#e6edf6] bg-white text-[#475569] transition hover:border-[#cfe1f7] hover:bg-[#f6faff] hover:text-brand hover:shadow-[0_6px_16px_-12px_rgba(37,99,235,0.6)] max-[420px]:size-[38px]"
          onClick={handleMenuClick}
          aria-label="Đóng hoặc mở thanh điều hướng"
          title="Thanh điều hướng"
        >
          <Menu className="size-[21px]" />
        </Button>
        <div className="flex min-w-0 flex-col gap-px">
          <span className="whitespace-nowrap text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] max-md:hidden">
            HR Agent workspace
          </span>
          <h1 className="truncate text-[17px] font-bold leading-[1.3] tracking-[-0.02em] text-ink max-md:text-[15.5px]">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-[#e9eff7] bg-[#f8fafc] px-[13px] py-2 text-xs font-medium text-[#64748b] max-[1100px]:hidden">
          <Calendar size={15} className="text-[#94a3b8]" aria-hidden="true" />
          {today}
        </span>

        <div
          className="h-[26px] w-px bg-[#e8eef6] max-[1100px]:hidden"
          aria-hidden="true"
        />

        <div
          className={cn(
            "relative flex cursor-pointer items-center gap-2.5 rounded-[14px] border border-[#e9eff7] bg-white py-[5px] pl-1.5 pr-3 transition hover:border-[#cfe1f7] hover:bg-[#fbfdff] hover:shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand max-md:border-0 max-md:bg-transparent max-md:p-1 max-md:hover:bg-transparent max-md:hover:shadow-none",
            showDropdown && "border-[#cfe1f7] bg-[#f8fbff]",
          )}
          ref={dropdownRef}
          onClick={() => setShowDropdown((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-haspopup="menu"
          aria-expanded={showDropdown}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowDropdown((prev) => !prev);
            }
            if (e.key === "Escape") setShowDropdown(false);
          }}
        >
          <Avatar className="size-[34px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <AvatarFallback className="bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-[13px] font-bold text-white">
              {getInitial()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-px max-md:hidden">
            <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold leading-[1.2] text-[#1e293b]">
              {user?.fullName || "Người dùng"}
            </span>
            <span className="text-[10.5px] text-[#94a3b8]">Ứng viên</span>
          </div>
          <ChevronDown
            size={17}
            className={cn(
              "shrink-0 text-[17px] text-[#94a3b8] transition-transform duration-200 max-md:hidden",
              showDropdown && "rotate-180",
            )}
            aria-hidden="true"
          />

          {showDropdown && (
            <div
              className="absolute right-0 top-[calc(100%+10px)] z-[100] min-w-[232px] rounded-[14px] border border-black/[0.06] bg-white p-1.5 shadow-[0_22px_44px_-24px_rgba(15,23,42,0.32),0_0_0_1px_rgba(15,23,42,0.02)] duration-150 animate-in fade-in slide-in-from-top-1"
              role="menu"
            >
              <div className="flex items-center gap-2.5 px-3 pb-3 pt-2.5">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-sm font-bold text-white">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[13.5px] font-semibold leading-[1.3] text-ink">
                    {user?.fullName || "Người dùng"}
                  </div>
                  <div className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-[#94a3b8]">
                    {user?.email || "Tài khoản ứng viên"}
                  </div>
                </div>
              </div>
              <div className="mx-0.5 my-1 h-px bg-[#eef2f7]" />
              <Button
                type="button"
                variant="ghost"
                role="menuitem"
                className="h-auto w-full justify-start gap-2.5 rounded-[9px] px-3 py-2.5 text-left text-[13px] font-medium text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#b91c1c]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <LogOut className="size-[17px]" aria-hidden="true" />
                Đăng xuất
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default ClientHeader;
