import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import interviewService from "../../../services/client/interviewService";
import candidateService from "../../../services/client/candidateService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ScheduleInterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const res = await candidateService.getCandidateDetail(id);
      if (res.success && res.candidate) {
        setCandidate(res.candidate);
      } else {
        toast.error("Không tìm thấy ứng viên");
        navigate(-1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải dữ liệu ứng viên");
      navigate(-1);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!time) {
      toast.warning("Vui lòng chọn thời gian phỏng vấn!");
      return;
    }
    if (!address.trim()) {
      toast.warning("Vui lòng nhập địa điểm / meeting link!");
      return;
    }

    try {
      setLoading(true);
      const res = await interviewService.schedule({
        candidateID: candidate._id || candidate.id,
        jobID: candidate.jobID || candidate.job?._id || "",
        time: new Date(time).toISOString(),
        address,
      });

      if (res.success) {
        toast.success("Đặt lịch và gửi lời mời phỏng vấn thành công!");
        setTimeout(() => {
          navigate(`/candidates/${id}`);
        }, 1500);
      } else {
        toast.error(res.message || "Đặt lịch thất bại!");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi khi đặt lịch phỏng vấn!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-subtle text-sm">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="text-danger font-medium text-base">
          Không tìm thấy ứng viên
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-w-2xl mx-auto pb-6 font-sans">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-subtle hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-3.5" /> Quay lại
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Tạo lịch phỏng vấn</h1>
      </div>

      <div>
        <div className="rounded-sm border border-border bg-white p-5 sm:p-6 shadow-2xs">
          <h2 className="text-base sm:text-lg font-bold text-ink mb-4 pb-2.5 border-b border-border">
            Phỏng vấn: {candidate?.personal?.fullName}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Thời gian đề xuất */}
            <div className="space-y-2">
              <Label
                htmlFor="time"
                className="text-sm font-semibold text-ink flex items-center gap-1"
              >
                Thời gian đề xuất: <span className="text-danger">*</span>
              </Label>
              <Input
                id="time"
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="bg-slate-50/70 border-border focus:bg-white h-11 text-sm"
              />
            </div>

            {/* Người tham gia */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-ink">
                Người tham gia:
              </Label>
              <Input
                id="email"
                type="email"
                value={candidate?.personal?.email || ""}
                readOnly
                className="bg-slate-100 border-border cursor-not-allowed h-11 text-sm text-subtle"
              />
            </div>

            {/* Địa điểm / Link */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-semibold text-ink flex items-center gap-1"
              >
                Địa điểm / Link: <span className="text-danger">*</span>
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="https://meet.google.com/... hoặc địa chỉ văn phòng"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="bg-slate-50/70 border-border focus:bg-white h-11 text-sm"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="rounded-sm border-border text-subtle hover:text-ink h-9 px-4 text-xs"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-primary hover:bg-brand-dark text-white font-medium h-9 px-5 text-xs shadow-2xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Đang gửi...
                  </>
                ) : (
                  "Gửi lời mời"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewPage;
