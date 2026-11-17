import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "react-toastify";
import * as userService from "../../../services/admin/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function UserSearch() {
  const navigate = useNavigate();
  const { email: initialEmail } = useParams();
  const [email, setEmail] = useState(decodeURIComponent(initialEmail || ""));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      handleSearch();
    }
  }, [initialEmail]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      toast.warning("Vui lòng nhập email để tìm kiếm!");
      return;
    }

    try {
      setLoading(true);
      const res = await userService.getUsers();
      const foundUsers = (res.users || []).filter((user) =>
        user.email.toLowerCase().includes(email.toLowerCase())
      );

      if (foundUsers.length === 0) {
        toast.warning("Không tìm thấy người dùng với email này!");
        setUsers([]);
      } else {
        setUsers(foundUsers);
      }
      setSearched(true);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tìm kiếm người dùng!");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
            Tìm kiếm người dùng
          </h1>
          <p className="text-sm font-normal text-subtle">
            Nhập email để tìm kiếm và sửa thông tin người dùng.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="search-email" className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Search size={18} className="text-hint" />
              Email <span className="font-semibold text-danger">*</span>
            </Label>
            <Input
              id="search-email"
              type="email"
              className="h-[46px]"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
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
            <Button type="submit" disabled={loading}>
              <Search size={18} />
              {loading ? "Đang tìm kiếm..." : "Tìm kiếm"}
            </Button>
          </div>
        </form>

        {searched && (
          <div className="mt-[30px] border-t border-gray-200 pt-5">
            <h3 className="mb-[15px] text-base font-semibold text-ink">
              Kết quả tìm kiếm:
            </h3>
            {users.length === 0 ? (
              <p className="text-sm text-gray-400">Không tìm thấy kết quả nào.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg bg-gray-100 p-[15px]"
                  >
                    <div>
                      <h4 className="mb-1 text-base font-semibold text-ink">
                        {user.fullName}
                      </h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Tạo: {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="ml-2.5"
                      onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                    >
                      Sửa
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserSearch;
