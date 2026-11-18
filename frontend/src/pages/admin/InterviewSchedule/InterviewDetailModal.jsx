import { useState } from "react";
import { toast } from "react-toastify";
import interviewService from "../../../services/client/interviewService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const statusBadgeMap = {
  scheduled: "text-blue-500",
  completed: "text-emerald-500",
  cancelled: "text-danger",
  rescheduled: "text-amber-500",
};

const InterviewDetailModal = ({ schedule, candidate, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [time, setTime] = useState(schedule?.time ? new Date(schedule.time).toISOString().slice(0, 16) : "");
  const [address, setAddress] = useState(schedule?.address || "");
  const [status, setStatus] = useState(schedule?.status || "scheduled");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!time.trim() || !address.trim()) {
      toast.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      const res = await interviewService.updateSchedule(schedule.id, {
        time: new Date(time).toISOString(),
        address,
        status,
      });

      if (res.success) {
        toast.success("Cập nhật lịch phỏng vấn thành công");
        setIsEditing(false);
        onUpdate?.();
      } else {
        toast.error(res.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật lịch phỏng vấn");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const fieldLabel =
    "mb-2 block text-sm font-semibold text-ink";
  const readonlyWrap =
    "flex items-center rounded-md bg-surface px-4 py-3 text-sm break-words text-gray-700";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[700px] gap-0 overflow-y-auto p-0 max-md:max-w-[95vw] [&>button]:text-white [&>button]:hover:bg-white/20">
        <DialogHeader className="flex items-center justify-between rounded-t-lg bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] p-6 max-md:p-4">
          <DialogTitle className="text-xl font-semibold text-white max-md:text-lg">
            Phỏng vấn : {candidate?.personal?.fullName || "Ứng viên"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-md:p-4">
          {isEditing ? (
            <>
              <div className="mb-5">
                <Label htmlFor="idm-time" className={fieldLabel}>
                  Thời gian đề xuất :
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="idm-time"
                    type="datetime-local"
                    className="h-[46px] pr-10"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute right-3 text-hint"
                  />
                </div>
              </div>

              <div className="mb-5">
                <Label className={fieldLabel}>Người tham gia :</Label>
                <div className={readonlyWrap}>
                  <span>{candidate?.personal?.email || "—"}</span>
                </div>
              </div>

              <div className="mb-5">
                <Label htmlFor="idm-address" className={fieldLabel}>
                  Địa điểm/ Link :
                </Label>
                <Input
                  id="idm-address"
                  type="text"
                  className="h-[46px]"
                  placeholder="https://meet.google.com/... hoặc địa chỉ văn phòng"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="mb-5">
                <Label className={fieldLabel}>Trạng Thái :</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-[46px] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                    <SelectItem value="completed">Hoàn tất</SelectItem>
                    <SelectItem value="cancelled">Hủy</SelectItem>
                    <SelectItem value="rescheduled">Lên lại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5">
                <Label className={fieldLabel}>Thời gian đề xuất :</Label>
                <div className={readonlyWrap}>
                  <span>
                    {schedule?.time ? formatDateTime(schedule.time) : "—"}
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <Label className={fieldLabel}>Người tham gia :</Label>
                <div className={readonlyWrap}>
                  <span>{candidate?.personal?.email || "—"}</span>
                </div>
              </div>

              <div className="mb-5">
                <Label className={fieldLabel}>Địa điểm/ Link :</Label>
                <div className={readonlyWrap}>
                  <span>{schedule?.address || "—"}</span>
                </div>
              </div>

              <div className="mb-5">
                <Label className={fieldLabel}>Trạng Thái :</Label>
                <div className={readonlyWrap}>
                  <span
                    className={cn(
                      "font-medium",
                      statusBadgeMap[schedule?.status] || "text-blue-500",
                    )}
                  >
                    {schedule?.status === "scheduled"
                      ? "Đã lên lịch"
                      : schedule?.status === "completed"
                      ? "Hoàn tất"
                      : schedule?.status === "cancelled"
                      ? "Hủy"
                      : "Lên lại"}
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <Label className={fieldLabel}>Thời gian tạo :</Label>
                <div className={readonlyWrap}>
                  <span>
                    {schedule?.createdAt
                      ? formatDateTime(schedule.createdAt)
                      : "—"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 rounded-b-lg border-t border-gray-100 bg-surface px-6 py-5 max-md:px-4 max-md:py-4">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>
                Đóng
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setIsEditing(true)}
              >
                Chỉnh sửa
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDetailModal;
