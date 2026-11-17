import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import interviewService from "../../../services/client/interviewService";
import candidateService from "../../../services/client/candidateService";
import InterviewDetailModal from "./InterviewDetailModal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

const thCell =
  "h-auto bg-gray-100 px-[15px] text-left text-sm font-semibold tracking-[0.5px] text-gray-700 uppercase";
const tdCell = "px-[15px] text-sm text-gray-700";

const statusMap = {
  scheduled: { label: "Đã lên lịch", cls: "text-blue-500" },
  completed: { label: "Hoàn tất", cls: "text-emerald-500" },
  cancelled: { label: "Hủy", cls: "text-danger" },
  rescheduled: { label: "Lên lại", cls: "text-amber-500" },
};

const InterviewScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [candidatesMap, setCandidatesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await interviewService.getSchedules();
      if (res.success) {
        setSchedules(res.data || []);
        const candidateIds = [...new Set((res.data || []).map((s) => s.candidateId))];
        if (candidateIds.length > 0) {
          await fetchCandidates(candidateIds);
        }
      } else {
        toast.error(res.message || "Lỗi khi lấy danh sách lịch phỏng vấn");
      }
    } catch (err) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (candidateIds) => {
    try {
      const map = {};
      for (const id of candidateIds) {
        const res = await candidateService.getCandidateDetail(id);
        if (res.success && res.data) {
          map[id] = res.data;
        }
      }
      setCandidatesMap(map);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin ứng viên:", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa lịch phỏng vấn này?")) return;

    try {
      const res = await interviewService.deleteSchedule(id);
      if (res.success) {
        toast.success("Xóa lịch phỏng vấn thành công");
        setSchedules(schedules.filter((s) => s.id !== id));
      } else {
        toast.error(res.message || "Xóa thất bại");
      }
    } catch (err) {
      toast.error("Lỗi khi xóa lịch phỏng vấn");
    }
  };

  const getStatusBadge = (status) => {
    const info = statusMap[status] || { label: status, cls: "text-gray-500" };
    return <span className={cn("font-medium", info.cls)}>{info.label}</span>;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const getCandidateName = (candidateId) => {
    const candidate = candidatesMap[candidateId];
    return candidate?.personal?.fullName || "—";
  };

  return (
    <div className="mx-auto max-w-[1200px] rounded-lg bg-surface p-5 max-md:p-[15px]">
      <div className="mb-[30px] flex flex-wrap items-center justify-between gap-[15px] max-md:flex-col max-md:items-start">
        <h1 className="text-[28px] font-semibold text-ink max-md:text-2xl">
          📅 Quản Lý Lịch Phỏng Vấn
        </h1>
        <Button onClick={fetchSchedules} disabled={loading}>
          <RotateCw size={16} />
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-lg bg-white px-5 py-[60px] text-center text-base text-gray-500">
          <p>Không có lịch phỏng vấn nào</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-gray-200 hover:bg-transparent">
                <TableHead className={thCell}>Ứng Viên</TableHead>
                <TableHead className={thCell}>Thời Gian</TableHead>
                <TableHead className={thCell}>Địa Điểm/Link</TableHead>
                <TableHead className={thCell}>Trạng Thái</TableHead>
                <TableHead className={thCell}>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className={cn(tdCell, "font-medium text-ink")}>
                    {getCandidateName(schedule.candidateId)}
                  </TableCell>
                  <TableCell className={tdCell}>
                    {formatDateTime(schedule.time)}
                  </TableCell>
                  <TableCell
                    className={cn(tdCell, "max-w-[250px] truncate text-gray-500 max-md:max-w-[150px]")}
                  >
                    {schedule.address}
                  </TableCell>
                  <TableCell className={tdCell}>
                    {getStatusBadge(schedule.status)}
                  </TableCell>
                  <TableCell className={cn(tdCell, "py-[15px]")}>
                    <div className="flex gap-2">
                      <button
                        className="flex size-8 cursor-pointer items-center justify-center rounded bg-indigo-100 text-blue-500 transition-all hover:scale-110 hover:bg-indigo-200"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowDetailModal(true);
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="flex size-8 cursor-pointer items-center justify-center rounded bg-red-100 text-danger transition-all hover:scale-110 hover:bg-red-200"
                        onClick={() => handleDelete(schedule.id)}
                        title="Xóa"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showDetailModal && selectedSchedule && (
        <InterviewDetailModal
          schedule={selectedSchedule}
          candidate={candidatesMap[selectedSchedule.candidateId]}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSchedule(null);
          }}
          onUpdate={() => {
            fetchSchedules();
            setShowDetailModal(false);
          }}
        />
      )}
    </div>
  );
};

export default InterviewScheduleList;
