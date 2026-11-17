import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import authService from "../../../services/client/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ClientLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    let newErrors = {};
    if (!email) newErrors.email = "Vui lòng nhập email";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email, password);

      if (res.code === 200) {
        toast.success("Đăng nhập thành công!");
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/dashboard");
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
    <form className="flex w-full flex-col" onSubmit={handleSubmit} noValidate>
      <div className="mb-8">
        <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-ink max-md:text-[22px]">
          Đăng nhập
        </h1>
        <p className="text-sm leading-[1.5] text-subtle">
          Chào mừng bạn! Vui lòng đăng nhập để tiếp tục.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        <Label htmlFor="email" className="text-[13px] font-semibold text-ink">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail
            size={18}
            className="pointer-events-none absolute left-3 text-subtle"
          />
          <Input
            id="email"
            type="email"
            name="email"
            className="h-[45px] rounded-lg bg-[#f9f9f9] pl-10"
            placeholder="nguyenvana@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
        </div>
        {errors.email && (
          <span className="mt-1 text-xs text-danger">{errors.email}</span>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-2">
        <Label htmlFor="password" className="text-[13px] font-semibold text-ink">
          Mật khẩu
        </Label>
        <div className="relative flex items-center">
          <Lock
            size={18}
            className="pointer-events-none absolute left-3 text-subtle"
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            className="h-[45px] rounded-lg bg-[#f9f9f9] pr-11 pl-10"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            className="absolute right-3 flex cursor-pointer items-center justify-center p-1 text-subtle transition-colors hover:text-ink"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <span className="mt-1 text-xs text-danger">{errors.password}</span>
        )}
      </div>

      <div className="mb-5 flex justify-end">
        <Link
          to="/auth/forgot-password"
          className="text-[13px] text-[#e91e63] no-underline transition-colors hover:text-[#c2185b]"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button
        type="submit"
        className="mt-2 h-[45px] w-full bg-[linear-gradient(135deg,#0087f1_0%,#0058b8_100%)] text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,135,241,0.3)] disabled:opacity-70"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Đăng nhập"
        )}
      </Button>
    </form>
  );
}

export default ClientLogin;
