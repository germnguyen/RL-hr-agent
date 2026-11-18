import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Lock,
  Users as UsersIcon,
  SquarePen,
} from "lucide-react";
import { toast } from "react-toastify";
import * as userService from "../../../services/admin/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const thCell =
  "h-auto bg-surface px-5 py-3.5 text-xs font-semibold tracking-[0.5px] text-hint uppercase";
const tdCell = "px-5 py-4 text-sm text-ink";

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, user: null });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      setUsers(res.users || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleChangeStatus = async (user) => {
    if (user.status === "active") {
      setConfirmDialog({ isOpen: true, user });
    } else {
      toast.warning("Tài khoản này đã bị khóa vĩnh viễn và không thể mở lại!");
    }
  };

  const executeChangeStatus = async (user) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const data = await userService.changeStatus(
        user.id.toString(),
        newStatus,
      );
      if (data.success) {
        toast.success(
          newStatus === "active"
            ? "Đã mở khóa tài khoản!"
            : "Đã khóa tài khoản!",
        );
        fetchUsers();
      }
    } catch {
      toast.error("Lỗi cập nhật trạng thái!");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
    <>
      <div className="mb-7">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-[-0.3px] text-ink">
          Quản lý người dùng
        </h1>
        <p className="text-sm font-normal text-subtle">
          Quản lý tài khoản và phân quyền người dùng trong hệ thống.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] max-w-[360px] flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-hint"
          />
          <Input
            type="text"
            className="h-[42px] bg-white pl-10"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Đã khóa</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex gap-2.5">
          <Button onClick={() => navigate("/admin/users/create")}>
            <Plus size={18} />
            Thêm người dùng
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={thCell}>Người dùng</TableHead>
              <TableHead className={thCell}>Email</TableHead>
              <TableHead className={thCell}>Trạng thái</TableHead>
              <TableHead className={thCell}>Ngày tạo</TableHead>
              <TableHead className={thCell}>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className={tdCell}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#e7f3ff,#dbeafe)] text-base font-semibold text-primary">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="size-full object-cover"
                          />
                        ) : (
                          getInitials(user.fullName)
                        )}
                      </div>
                      <span className="font-semibold text-ink">
                        {user.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={tdCell}>{user.email}</TableCell>
                  <TableCell className={tdCell}>
                    <Badge
                      className={`rounded-full font-semibold ${
                        user.status === "active"
                          ? "bg-emerald-50 text-emerald-600 before:size-1.5 before:rounded-full before:bg-emerald-600 before:content-['']"
                          : "bg-amber-100 text-amber-600 before:size-1.5 before:rounded-full before:bg-amber-600 before:content-['']"
                      }`}
                    >
                      {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdCell}>
                    <span className="text-[13px] text-subtle">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className={tdCell}>
                    <div className="flex items-center gap-1">
                      <button
                        className="flex size-[34px] cursor-pointer items-center justify-center rounded-md text-hint transition-all hover:bg-hover hover:text-ink"
                        title="Sửa"
                        onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                        disabled={user.status !== "active"}
                        style={{
                          opacity: user.status === "active" ? 1 : 0.4,
                          cursor: user.status === "active" ? "pointer" : "not-allowed"
                        }}
                      >
                        <SquarePen size={18} />
                      </button>
                      <button
                        className="flex size-[34px] cursor-pointer items-center justify-center rounded-md text-hint transition-all hover:bg-amber-50 hover:text-amber-600"
                        title={
                          user.status === "active"
                            ? "Khóa tài khoản"
                            : "Đã khóa vĩnh viễn"
                        }
                        onClick={() => handleChangeStatus(user)}
                        disabled={user.status !== "active"}
                        style={{
                          opacity: user.status === "active" ? 1 : 0.4,
                          cursor: user.status === "active" ? "pointer" : "not-allowed"
                        }}
                      >
                        <Lock size={18} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ isOpen: false, user: null })
        }
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Xác nhận vô hiệu hóa tài khoản</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-[1.5] text-ink">
            Bạn có chắc chắn muốn vô hiệu hóa tài khoản{" "}
            <strong className="font-semibold text-danger">
              {confirmDialog.user?.fullName}
            </strong>{" "}
            không?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ isOpen: false, user: null })}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                executeChangeStatus(confirmDialog.user);
                setConfirmDialog({ isOpen: false, user: null });
              }}
            >
              Vô hiệu hóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td colSpan="5">
        <div className="flex items-center gap-5 border-b border-gray-100 px-5 py-4">
          <div className="size-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3.5 w-[140px] animate-pulse rounded-md bg-gray-200" />
          <div className="h-3.5 w-[200px] animate-pulse rounded-md bg-gray-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3.5 w-[100px] animate-pulse rounded-md bg-gray-200" />
          <div className="h-3.5 w-[120px] animate-pulse rounded-md bg-gray-200" />
        </div>
      </td>
    </tr>
  ));
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <UsersIcon size={56} className="mb-4 text-border" />
      <p className="mb-1.5 text-base font-semibold text-ink">
        Chưa có người dùng nào
      </p>
      <p className="text-sm text-subtle">
        Nhấn "Thêm người dùng" để tạo tài khoản mới.
      </p>
    </div>
  );
}

export default Users;
