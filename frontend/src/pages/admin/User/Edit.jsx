import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labelCell =
  "flex items-center gap-1.5 text-sm font-semibold text-ink";
const requiredMark = "font-semibold text-danger";

function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      const user = (res.users || []).find((u) => u.id === id);
      if (user) {
        if (user.status !== "active") {
          toast.error("Không thể chỉnh sửa tài khoản đã bị khóa!");
          navigate("/admin/users");
          return;
        }
        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          password: "",
          status: user.status || "active",
        });
      } else {
        toast.error("Không tìm thấy người dùng!");
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Lỗi tải thông tin người dùng!");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

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

    if (formData.password && formData.password.length < 6) {
      toast.warning("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        status: formData.status,
      };
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await userService.updateUser(id, updateData);
      toast.success("Cập nhật tài khoản thành công!");
      navigate("/admin/users");
    } catch (error) {
      const msg =
        error.response?.data?.message || "Lỗi cập nhật tài khoản, vui lòng thử lại!";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        </div>
        <div className="p-10 text-center">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

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
            Sửa người dùng
          </h1>
          <p className="text-sm font-normal text-subtle">
            Cập nhật thông tin tài khoản người dùng.
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
            <Label className={labelCell}>Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="h-[46px] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className={labelCell}>
              <Lock size={18} className="text-hint" />
              Mật khẩu
            </Label>
            <div className="relative flex items-center">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="h-[46px] pr-11"
                placeholder="Để trống nếu không muốn đổi mật khẩu"
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
              {saving ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUser;
