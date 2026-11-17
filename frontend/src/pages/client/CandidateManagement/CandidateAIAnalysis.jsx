import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import aiService from "../../../services/client/aiService";
import candidateService from "../../../services/client/candidateService";
import jobService from "../../../services/client/jobService";
import { Button } from "@/components/ui/button";

const CandidateAIAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get("jobId");

  const [candidate, setCandidate] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);

  useEffect(() => {
    fetchAndAnalyze();
  }, [id]);

  const fetchAndAnalyze = async () => {
    try {
      setLoading(true);
      const res = await candidateService.getById(id);
      const cand = res.candidate;
      setCandidate(cand);

      if (!cand) {
        toast.error("Không tìm thấy ứng viên!");
        return;
      }

      const jobIdToUse = jobIdFromUrl || cand.jobID;

      if (!jobIdToUse) {
        toast.error("Ứng viên này chưa gắn với vị trí công việc nào!");
        return;
      }

      try {
        const allJobsRes = await jobService.getAll();
        const jobs = allJobsRes.jobs || [];
        const job = jobs.find(
          (j) => j.id === jobIdToUse || j._id === jobIdToUse,
        );
        if (job) {
          setCurrentJob(job);
        }
      } catch (jobErr) {
        console.error("Lỗi khi tải job:", jobErr);
      }

      await runAnalysis(jobIdToUse, id);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải thông tin ứng viên!");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (jobID, candidateID) => {
    setAnalyzing(true);
    const res = await aiService.analyzeCandidate({ jobID, candidateID });
    if (res.success) {
      setAiResult(res.aiAnalyze);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setAnalyzing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loading || analyzing;

  return (
    <div className="max-w-4xl mx-auto space-y-3 pb-6">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-sm border border-border shadow-2xs">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/candidates/${id}`)}
          className="gap-2 bg-white border-border text-ink hover:bg-slate-50 w-fit h-8 rounded-sm text-xs"
        >
          <ArrowLeft className="size-3.5" /> Quay lại hồ sơ
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-border gap-1.5 text-xs h-8 rounded-sm"
          >
            <Printer className="size-3.5" /> In kết quả
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/candidates/${id}`)}
            className="border-border text-xs h-8 rounded-sm"
          >
            Cập nhật trạng thái
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/candidates/${id}`)}
            className="bg-primary hover:bg-brand-dark text-white font-semibold text-xs h-8 rounded-sm shadow-2xs"
          >
            Lưu kết quả
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-sm p-12 shadow-xs text-subtle text-sm border border-border">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="font-medium text-ink">
            Đang phân tích hồ sơ ứng viên...
          </span>
        </div>
      )}

      {/* Analysis Result */}
      {!isLoading && aiResult && candidate && (
        <div className="space-y-3">
          {/* Header Card */}
          <div className="rounded-sm border border-border bg-white p-4 sm:p-5 shadow-2xs">
            <h1 className="text-xl sm:text-2xl font-bold text-ink mb-0.5">
              Phân tích AI cho ứng viên
            </h1>
            <p className="text-xs text-subtle">
              Thông tin chi tiết và đánh giá tự động từ mô hình AI
            </p>
          </div>

          {/* Analysis Details */}
          <div className="rounded-sm border border-border bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            {/* Họ tên */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink">Họ tên</label>
              <div className="text-sm text-ink leading-relaxed p-3.5 rounded-sm bg-surface border border-border">
                {candidate?.personal?.fullName || "—"}
              </div>
            </div>

            {/* Vị trí công việc */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink">
                Vị trí công việc
              </label>
              <div className="text-sm font-medium text-primary leading-relaxed p-3.5 rounded-sm bg-surface border border-border">
                {currentJob?.title || "—"}
              </div>
            </div>

            {/* Điểm phù hợp */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink">
                Điểm phù hợp
              </label>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary min-w-[100px] py-3 px-4 bg-[#e8f3ff] rounded-sm text-center shadow-xs">
                  {aiResult.matchingScore}%
                </div>
                <span className="text-sm font-medium text-subtle">
                  {aiResult.matchingScore >= 80
                    ? "Rất phù hợp"
                    : aiResult.matchingScore >= 60
                    ? "Phù hợp trung bình"
                    : "Chưa đủ yêu cầu"}
                </span>
              </div>
            </div>

            {/* Tóm tắt năng lực */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink">
                Tóm tắt năng lực
              </label>
              <div className="text-sm text-ink leading-relaxed p-3.5 rounded-sm bg-surface border border-border whitespace-pre-wrap break-words min-h-[80px]">
                {aiResult.summary || "—"}
              </div>
            </div>

            {/* Kỹ năng còn thiếu */}
            {aiResult.redFlags && aiResult.redFlags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-danger flex items-center gap-1.5">
                  <AlertCircle className="size-4" /> Kỹ năng còn thiếu
                </label>
                <div className="space-y-2.5">
                  {aiResult.redFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="text-sm text-[#7f1d1d] bg-[#fef2f2] border-l-4 border-l-danger rounded-r-sm p-3 px-4 leading-relaxed"
                    >
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Câu hỏi phỏng vấn gợi ý */}
            {aiResult.suggestedQuestions &&
              aiResult.suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" /> Câu hỏi phỏng
                    vấn gợi ý
                  </label>
                  <ol className="space-y-2.5 list-none p-0 m-0">
                    {aiResult.suggestedQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-ink bg-surface border border-border border-l-4 border-l-primary rounded-r-sm p-3 px-4 leading-relaxed"
                      >
                        <span className="font-bold text-primary shrink-0">
                          {i + 1}.
                        </span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

            {/* Bottom Secondary Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="w-full sm:w-auto border-border gap-1.5 text-xs h-9 rounded-sm"
              >
                <Printer className="size-3.5" /> In kết quả
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/candidates/${id}`)}
                className="w-full sm:w-auto bg-primary hover:bg-brand-dark text-white font-semibold text-xs h-9 rounded-sm"
              >
                Hoàn tất & Quay lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !aiResult && candidate && !candidate.jobID && (
        <div className="rounded-sm border border-border bg-white p-12 sm:p-16 text-center shadow-xs max-w-4xl mx-auto">
          <div className="max-w-md mx-auto space-y-2">
            <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-ink">
              Chưa gắn vị trí công việc
            </h3>
            <p className="text-sm text-subtle leading-relaxed">
              Ứng viên này chưa được liên kết với job nào. Vui lòng upload CV
              qua đúng vị trí tuyển dụng.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAIAnalysis;
