import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import verificationService from "../../../services/client/verificationService";
import candidateService from "../../../services/client/candidateService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Star,
  ExternalLink,
  Code2,
  Loader2,
  Mail,
  User,
  Sparkles,
  FolderGit2,
} from "lucide-react";

const VerificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [verification, setVerification] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const fetchCandidate = useCallback(async () => {
    try {
      const res = await candidateService.getById(id);
      if (res?.candidate) {
        setCandidateStatus(res.candidate.status);
      }
    } catch (error) {
      console.error("Error fetching candidate:", error);
    }
  }, [id]);

  const fetchVerification = useCallback(async () => {
    try {
      setLoading(true);
      const response = await verificationService.getVerificationDetail(id);
      if (response?.success) {
        setVerification(response.verification);
      } else {
        toast.error(response?.message || "Không thể tải dữ liệu kiểm chứng!");
        navigate(`/candidates/${id}`);
      }
    } catch (error) {
      console.error("Error fetching verification:", error);
      const message =
        error.response?.data?.message || "Không thể tải dữ liệu kiểm chứng!";
      toast.error(message);
      navigate(`/candidates/${id}`);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchVerification();
    fetchCandidate();
  }, [fetchVerification, fetchCandidate]);

  const handleConfirm = async (status) => {
    if (candidateStatus !== "screening" && candidateStatus !== "applied") {
      toast.warning(
        "Ứng viên chỉ có thể kiểm chứng ở giai đoạn Ứng tuyển hoặc Sàng lọc!"
      );
      return;
    }

    setSelectedStatus(status);
    setConfirming(true);

    try {
      const message =
        status === "verified" ? "Kiểm chứng ứng viên..." : "Gắn cờ rủi ro...";
      toast.info(message);

      const response = await verificationService.confirmVerification(id, {
        status: status,
      });

      if (response.success) {
        if (status === "verified") {
          toast.success("Kiểm chứng thành công!");
        } else {
          toast.warning("Đã gắn cờ rủi ro cho ứng viên này!");
        }

        setTimeout(() => {
          navigate(`/candidates/${id}`);
        }, 1500);
      } else {
        toast.error(response.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error("Error confirming verification:", error);
      toast.error(error.message || "Có lỗi xảy ra khi kiểm chứng!");
    } finally {
      setConfirming(false);
      setSelectedStatus(null);
    }
  };

  const calculateTrustScore = (stars) => {
    if (stars > 100) return 90;
    if (stars > 50) return 75;
    if (stars > 10) return 60;
    if (stars > 0) return 40;
    return 20;
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <p className="text-sm font-medium text-subtle">
          Đang tải dữ liệu kiểm chứng ứng viên...
        </p>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldAlert className="size-7" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-ink">Không tìm thấy dữ liệu</h3>
          <p className="mt-1 text-sm text-subtle">
            Dữ liệu kiểm chứng ứng viên không tồn tại hoặc đã bị xóa.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/candidates/${id}`)}
          className="mt-2"
        >
          <ArrowLeft className="mr-2 size-4" /> Quay lại hồ sơ ứng viên
        </Button>
      </div>
    );
  }

  const trustScore = calculateTrustScore(verification.githubStars || 0);

  const getScoreColor = (score) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-slate-600";
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 75)
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (score >= 50)
      return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-slate-100 text-slate-700";
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3.5 pb-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/candidates/${id}`)}
          className="gap-1.5 text-xs font-semibold text-slate-600 hover:text-ink hover:bg-slate-100 rounded-sm"
        >
          <ArrowLeft className="size-4" /> Quay lại hồ sơ ứng viên
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-sm bg-brand/10 text-brand">
            <ShieldCheck className="size-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Kiểm chứng ứng viên
          </h1>
        </div>
        <p className="text-xs text-subtle pl-9">
          Xem chi tiết đối soát thông tin, đánh giá mã nguồn và kinh nghiệm công khai từ GitHub
        </p>
      </div>

      {/* Main Card */}
      <Card className="border-border/80 bg-white shadow-2xs rounded-sm">
        <CardHeader className="border-b border-slate-100 pb-3 pt-4 px-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-ink">
                Kết quả kiểm tra hồ sơ
              </CardTitle>
              <CardDescription className="text-xs">
                Dữ liệu được trích xuất và phân tích tự động từ hồ sơ kỹ thuật số.
              </CardDescription>
            </div>
            {candidateStatus && (
              <Badge variant="outline" className="w-fit text-xs font-medium capitalize rounded-sm">
                Giai đoạn: {candidateStatus}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 px-4 sm:px-5">
          {/* Identity Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <User className="size-3.5 text-brand" /> Họ và tên
              </label>
              <div className="rounded-sm border border-slate-100 bg-slate-50/60 px-3.5 py-2 text-sm font-semibold text-ink">
                {verification.name || "—"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Mail className="size-3.5 text-brand" /> Địa chỉ Email
              </label>
              <div className="rounded-sm border border-slate-100 bg-slate-50/60 px-3.5 py-2 text-sm font-semibold text-ink">
                {verification.email || "—"}
              </div>
            </div>
          </div>

          {/* Trust Score */}
          <div className="space-y-2.5 rounded-sm border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Chỉ số độ tin cậy năng lực
                </span>
                <p className="text-xs text-subtle">
                  Dựa trên số lượng repository, stars và lịch sử đóng góp GitHub
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", getScoreColor(trustScore))}>
                  {trustScore}%
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    getScoreBadgeClass(trustScore)
                  )}
                >
                  {trustScore >= 75
                    ? "Kỹ năng vững vàng"
                    : trustScore >= 50
                    ? "Có kinh nghiệm"
                    : "Kinh nghiệm mở hạn chế"}
                </span>
              </div>
            </div>

            <Progress value={trustScore} className="h-2.5" />

            <p className="text-xs text-slate-600">
              {trustScore >= 75
                ? "✓ Ứng viên có kỹ năng solid, có các dự án nhận được sự quan tâm và đánh giá cao trên GitHub."
                : trustScore >= 50
                ? "• Ứng viên có kinh nghiệm lập trình thực tế nhưng các dự án công khai chưa thật sự nổi bật."
                : "! Ứng viên chưa có nhiều hoạt động hoặc dự án công khai trên GitHub, khuyến nghị kiểm tra thêm qua phỏng vấn kỹ thuật."}
            </p>
          </div>

          {/* AI Reasoning */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Sparkles className="size-3.5 text-brand" /> Chi tiết phân tích AI
            </label>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {verification.aiReasoning || "Chưa có nhận xét phân tích từ hệ thống."}
            </div>
          </div>

          {/* GitHub Profile Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Code2 className="size-3.5 text-brand" /> Hồ sơ GitHub
            </label>
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <a
                  href={`https://github.com/${verification.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
                >
                  github.com/{verification.name}
                  <ExternalLink className="size-3.5" />
                </a>
                <div className="flex items-center gap-3 text-xs text-subtle">
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-500" />
                    <strong>{verification.githubStars || 0}</strong> Stars
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{verification.topLanguages?.length || 0}</strong> Ngôn ngữ sử dụng
                  </span>
                </div>
              </div>

              <a
                href={`https://github.com/${verification.name}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  Truy cập GitHub <ExternalLink className="size-3" />
                </Button>
              </a>
            </div>
          </div>

          {/* Top Languages */}
          {verification.topLanguages && verification.topLanguages.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Code2 className="size-3.5 text-brand" /> Ngôn ngữ lập trình chính
              </label>
              <div className="flex flex-wrap gap-2">
                {verification.topLanguages.map((lang, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Probed Projects */}
          {verification.probedProjects &&
            verification.probedProjects.length > 0 && (
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <FolderGit2 className="size-3.5 text-brand" /> Dự án nổi bật trên GitHub
                </label>
                <div className="space-y-2.5">
                  {verification.probedProjects.slice(0, 5).map((project, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-50 hover:border-slate-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 truncate font-semibold text-ink hover:text-brand"
                        >
                          <FolderGit2 className="size-4 shrink-0 text-slate-400" />
                          <span className="truncate">{project.name}</span>
                          <ExternalLink className="size-3 text-slate-400" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {project.language && (
                          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                            {project.language}
                          </span>
                        )}
                        {project.stars > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Star className="size-3.5 fill-amber-400 text-amber-500" />
                            {project.stars}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Action Buttons Footer */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="outline"
          onClick={() => navigate(`/candidates/${id}`)}
          disabled={confirming}
          className="h-10 px-5 text-sm font-medium"
        >
          Hủy bỏ
        </Button>

        <Button
          variant="destructive"
          onClick={() => handleConfirm("risky")}
          disabled={confirming || selectedStatus === "risky"}
          className="h-10 px-5 text-sm font-medium shadow-xs"
        >
          {selectedStatus === "risky" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <ShieldAlert className="mr-2 size-4" /> Gắn cờ rủi ro
            </>
          )}
        </Button>

        <Button
          onClick={() => handleConfirm("verified")}
          disabled={confirming || selectedStatus === "verified"}
          className="h-10 bg-emerald-600 px-5 text-sm font-medium text-white shadow-xs hover:bg-emerald-700"
        >
          {selectedStatus === "verified" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 size-4" /> Xác nhận đã kiểm chứng
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationDetail;
