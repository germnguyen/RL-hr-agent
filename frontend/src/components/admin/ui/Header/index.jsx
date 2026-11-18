import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import authServiceAPI from "../../../../services/admin/authService";
import { AppContext } from "../../../../context/admin/app/AppContext";
import { cn } from "@/lib/utils";

function Header() {
  const navigate = useNavigate();
  const { logout } = useContext(AppContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      const res = await authServiceAPI.logout();
      if (res.success) {
        logout();
        navigate("/admin/auth/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-8">
      <div className="ml-auto flex items-center gap-2">
        <div className="mx-2 h-7 w-px bg-border" />

        <div
          className="relative flex cursor-pointer select-none items-center gap-2.5 rounded-[10px] py-1.5 pl-1.5 pr-3 transition-colors duration-200 hover:bg-hover"
          ref={dropdownRef}
          onClick={() => setShowDropdown((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setShowDropdown((p) => !p)}
        >
          <div className="flex size-[34px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#0087f1,#00c6ff)] text-[13px] font-semibold text-white">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-[1.2] text-ink">
              Admin
            </span>
            <span className="text-[11px] text-hint">Quản trị viên</span>
          </div>
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-hint transition-transform duration-200",
              showDropdown && "rotate-180",
            )}
          />

          {showDropdown && (
            <div
              className="absolute top-full right-0 z-40 mt-2 min-w-[180px] rounded-lg border border-border bg-white py-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] duration-100 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Đăng xuất
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
