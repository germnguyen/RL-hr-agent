import { useContext, useState } from "react";
import { data, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import authServiceAPI from "../../../services/admin/authService";
import { toast } from "react-toastify";
import { AppContext } from "../../../context/admin/app/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Auth() {
  const navigate = useNavigate();
  const { login } = useContext(AppContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await authServiceAPI.login({ email, password });
      if (res.success) {
        toast.success("Đăng nhập thành công!");
        login(res.admin);
        navigate("/admin/dashboard");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex w-[960px] max-w-[95vw] max-md:w-full max-md:max-w-[440px] max-md:flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_4px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] md:min-h-[580px]">
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-[linear-gradient(160deg,#0a1628_0%,#0d2137_40%,#0f2b4a_100%)] p-8 md:px-10 md:py-12 before:absolute before:-top-20 before:-right-20 before:z-0 before:size-[280px] before:rounded-full before:bg-[radial-gradient(circle,rgba(0,135,241,0.15),transparent_70%)] before:content-[''] after:absolute after:-bottom-[60px] after:-left-[60px] after:z-0 after:size-[200px] after:rounded-full after:bg-[radial-gradient(circle,rgba(0,198,255,0.1),transparent_70%)] after:content-['']">
          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#0087f1,#00c6ff)] text-xl font-bold text-white">
                N
              </div>
              <span className="text-[22px] font-bold tracking-[-0.3px] text-white">
                Hr-agent
              </span>
            </div>
            <h2 className="mb-4 text-[22px] font-bold leading-[1.35] text-white md:text-[28px]">
              Hệ thống quản trị <br />
            </h2>
            <div className="flex max-md:hidden flex-col gap-3.5">
              <div className="flex items-center gap-3 text-[13px] font-medium text-white/70">
                <span className="size-2 shrink-0 rounded-full bg-[linear-gradient(135deg,#0087f1,#00c6ff)]"></span>
                Phân tích CV tự động bằng AI
              </div>
              <div className="flex items-center gap-3 text-[13px] font-medium text-white/70">
                <span className="size-2 shrink-0 rounded-full bg-[linear-gradient(135deg,#0087f1,#00c6ff)]"></span>
                Quản lý ứng viên thông minh
              </div>
              <div className="flex items-center gap-3 text-[13px] font-medium text-white/70">
                <span className="size-2 shrink-0 rounded-full bg-[linear-gradient(135deg,#0087f1,#00c6ff)]"></span>
                Dashboard thống kê
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8 md:px-11 md:py-12">
          <form
            className="flex w-full max-w-[380px] flex-col gap-[22px]"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="mb-2">
              <h1 className="mb-2 text-[26px] font-bold text-ink">Đăng nhập</h1>
              <p className="text-sm leading-[1.5] text-hint">
                Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-[13px] font-semibold text-ink"
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={20}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-hint"
                />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  className="h-[46px] bg-surface pl-11"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <span className="text-xs font-medium text-danger">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-[13px] font-semibold text-ink"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock
                  size={20}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-hint"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="h-[46px] bg-surface pr-11 pl-11"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-hint transition-colors hover:text-ink"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs font-medium text-danger">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="-mt-2 flex justify-end">
              <a
                href="/forgot-password"
                className="text-[13px] font-medium text-primary transition-opacity hover:opacity-75"
              >
                Quên mật khẩu?
              </a>
            </div>

            <Button
              type="submit"
              className="mt-1 h-[46px] w-full text-[15px] font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
