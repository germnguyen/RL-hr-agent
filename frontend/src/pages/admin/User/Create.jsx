import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import * as userService from "../../../services/admin/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const labelCell =
  "flex items-center gap-1.5 text-sm font-semibold text-ink";
const requiredMark = "font-semibold text-danger";

function CreateUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.warning("Vui lòng nhập Họ tên!");
      return;
    }

    if (!formData.email.trim()) {
      toast.warning("Vui lòng nhập Email!");
      return;
    }

    if (!formData.password) {
      toast.warning("Vui lòng nhập Mật khẩu!");
      return;
    }

    if (formData.password.length < 8) {
      toast.warning("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.warning("Mật khẩu phải chứa ít nhất một chữ hoa!");
      return;
    }

    if (!/\d/.test(formData.password)) {
      toast.warning("Mật khẩu phải chứa ít nhất một chữ số!");
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      toast.warning("Mật khẩu phải chứa ít nhất một ký tự đặc biệt!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.warning("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      setSaving(true);
      await userService.createUser(formData);
      toast.success("Tạo tài khoản thành công!");
      navigate("/admin/users");
    } catch (error) {
      const msg =
        error.response?.data?.message || "Lỗi tạo tài khoản, vui lòng thử lại!";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-full">
      <div className="mb-7">
        <button
          className="mb-3 inline-flex cursor-pointer items-center gap-1.5 bg-transparent py-1.5 text-sm font-medium text-subtle transition-colors hover:text-primary"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <div>
          <h1 className="mb-1.5 text-[26px] font-bold tracking-[-0.3px] text-ink">
            Thêm người dùng mới
          </h1>
          <p className="text-sm font-normal text-subtle">
            Điền thông tin bên dưới để tạo tài khoản mới cho hệ thống.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className={labelCell}>
              <UserRound size={18} className="text-hint" />
              Họ tên <span className={requiredMark}>*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              name="fullName"
              className="h-[46px]"
              placeholder="Nhập họ và tên đầy đủ"
              value={formData.fullName}
              onChange={handleInputChange}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className={labelCell}>
              <Mail size={18} className="text-hint" />
              Email <span className={requiredMark}>*</span>
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              className="h-[46px]"
              placeholder="example@company.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className={labelCell}>
              <Lock size={18} className="text-hint" />
              Mật khẩu <span className={requiredMark}>*</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="h-[46px] pr-11"
                placeholder="Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute right-3 flex cursor-pointer items-center p-1 text-hint transition-colors hover:text-primary"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className={labelCell}>
              <Lock size={18} className="text-hint" />
              Xác nhận mật khẩu <span className={requiredMark}>*</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                className="h-[46px] pr-11"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute right-3 flex cursor-pointer items-center p-1 text-hint transition-colors hover:text-primary"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/users")}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "Đang lưu..." : "Tạo tài khoản"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;
