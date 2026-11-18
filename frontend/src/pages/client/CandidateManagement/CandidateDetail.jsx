import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GitBranch,
  Code,
  GraduationCap,
  Briefcase,
  Target,
  Layers,
  ShieldCheck,
  Calendar,
  Download,
  Bot,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import candidateService from "../../../services/client/candidateService";
import jobService from "../../../services/client/jobService";
import verificationService from "../../../services/client/verificationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tempVerificationData, setTempVerificationData] = useState(null);

  const [showManualLinkModal, setShowManualLinkModal] = useState(false);
  const [manualLink, setManualLink] = useState("");

  useEffect(() => {
    fetchDetail();
    fetchJobs();
  }, [id]);

  useEffect(() => {
    if (candidate?.jobID) {
      setSelectedJobId(candidate.jobID);
    }
  }, [candidate]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await candidateService.getById(id);
      setCandidate(res.candidate || null);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin ứng viên!");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await jobService.getAll();
      setJobs(res.jobs || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách job:", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const handleJobChange = (e) => {
    const jobId = e.target.value;
    setSelectedJobId(jobId);
    console.log(
      "Job được chọn:",
      jobId,
      jobs.find((j) => j.id === jobId || j._id === jobId),
    );
  };

  const handleVerify = async (githubLink, candidateID) => {
    if (!githubLink) {
      toast.warning(
        "Ứng viên chưa có link GitHub. Vui lòng nhập link thủ công!",
      );
      setShowManualLinkModal(true);
      return;
    }

    const candidateEmail =
      candidate?.contact?.email ||
      candidate?.email ||
      candidate?.personal?.email;
    const candidatePhone =
      candidate?.contact?.phone ||
      candidate?.phone ||
      candidate?.personal?.phone;

    console.log("DEBUG - Email found:", candidateEmail);
    console.log("DEBUG - Phone found:", candidatePhone);

    if (!candidateEmail && !candidatePhone) {
      toast.error(
        "Không đủ thông tin định danh để thực hiện kiểm chứng. Vui lòng cập nhật Email hoặc SĐT",
      );
      return;
    }

    try {
      setVerifyingLoading(true);

      try {
        const checkRes =
          await verificationService.getVerificationDetail(candidateID);
        if (checkRes.success && checkRes.verification) {
          toast.info("Ứng viên đã được kiểm chứng.");
          setTimeout(() => {
            navigate(`/candidates/${candidateID}/verify`);
          }, 800);
          return;
        }
      } catch (checkError) {
        const status = checkError.response?.status;
        const rawMsg =
          checkError.response?.data?.message ||
          checkError.response?.data?.error ||
          checkError.message ||
          "";
        const errorMsg = typeof rawMsg === "string" ? rawMsg.toLowerCase() : "";

        const isUnverified =
          status === 404 ||
          (status === 400 &&
            (errorMsg.includes("không tìm thấy") ||
              errorMsg.includes("khong tim thay") ||
              errorMsg.includes("not found") ||
              errorMsg.includes("chưa có dữ liệu") ||
              errorMsg.includes("chua co du lieu") ||
              errorMsg.includes("dữ liệu kiểm chứng") ||
              errorMsg.includes("kiểm chứng")));

        if (!isUnverified) {
          throw checkError;
        }
        console.log("Chưa có dữ liệu kiểm chứng, bắt đầu quét mới...");
      }

      const extensionId = import.meta.env.VITE_EXTENSION_ID;

      if (!extensionId) {
        toast.error("Extension ID chưa được cấu hình. Kiểm tra file .env!");
        setVerifyingLoading(false);
        return;
      }

      if (!window.chrome?.runtime?.sendMessage) {
        toast.error(
          "Không tìm thấy Chrome Extension. Hãy đảm bảo extension đã được cài đặt!",
        );
        setVerifyingLoading(false);
        return;
      }

      window.chrome.runtime.sendMessage(
        extensionId,
        {
          action: "NANO_START_TASK",
          url: githubLink,
          candidateID: candidateID,
        },
        (response) => {
          if (response && response.success) {
            const dataJson = JSON.parse(response.data);
            console.log(dataJson);
            setTempVerificationData(dataJson);
            setShowSaveModal(true);
            setVerifyingLoading(false);
          } else {
            toast.error(
              "Lỗi xác thực: " +
                (response?.error || "Không kết nối được Extension"),
            );
            setVerifyingLoading(false);
          }
        },
      );
    } catch (error) {
      console.error("Lỗi khi chuẩn bị kiểm chứng:", error);
      toast.error("Có lỗi xảy ra khi kiểm tra trạng thái xác minh!");
      setVerifyingLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    try {
      toast.info("Đang lưu kết quả kiểm chứng GitHub...");

      const response = await verificationService.verifyCandidate(
        id,
        tempVerificationData,
      );

      if (response.success) {
        toast.success("Đã lưu kết quả kiểm chứng!");
        setShowSaveModal(false);

        try {
          const confirmRes = await verificationService.confirmVerification(id, {
            status: "verified",
          });

          if (confirmRes.success) {
            toast.success("Ứng viên đã kiểm chứng thành công!");
            await fetchDetail();
            setTimeout(() => {
              navigate(`/candidates/${id}/verify`);
            }, 800);
          }
        } catch (confirmError) {
          console.error("Lỗi khi xác nhận verification:", confirmError);
          toast.warning(
            "Đã lưu kiểm chứng nhưng chưa cập nhật trường. Vui lòng tải lại!",
          );
          await fetchDetail();
          setTimeout(() => {
            navigate(`/candidates/${id}/verify`);
          }, 1000);
        }
      } else {
        toast.error(response.message || "Không thể lưu kết quả kiểm chứng!");
      }
    } catch (error) {
      console.error("Lỗi khi lưu kết quả kiểm chứng:", error);
      toast.error("Có lỗi xảy ra khi gọi API lưu dữ liệu!");
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 md:p-10 min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-subtle text-sm">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span>Đang tải thông tin ứng viên...</span>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 sm:p-8 md:p-10 min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-danger text-sm">
          <AlertTriangle className="size-10" />
          <span className="font-semibold text-base">Không tìm thấy ứng viên!</span>
        </div>
      </div>
    );
  }

  const {
    personal = {},
    educations = [],
    experiences = [],
    allSkills = [],
    status,
    objective,
    createdAt,
  } = candidate;

  const recruitmentStatusLabels = {
    applied: "Ứng tuyển",
    screening: "Sàng lọc",
    interview: "Phỏng vấn",
    offer: "Đề nghị",
  };

  const getRecruitmentBadgeStyle = (st) => {
    switch (st) {
      case "applied":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "screening":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "interview":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "offer":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const verificationStatusLabels = {
    unverified: "Chưa kiểm chứng",
    verified: "Đã kiểm chứng ✅",
    risky: "Rủi ro ⚠️",
  };

  const getVerificationBadgeStyle = (vst) => {
    switch (vst) {
      case "verified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "risky":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "unverified":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const recruitmentLabel = recruitmentStatusLabels[status] || status || "—";
  const verificationLabel =
    verificationStatusLabels[candidate.verificationStatus] ||
    candidate.verificationStatus ||
    "—";

  const firstEdu = educations[0];
  const firstExp = experiences[0];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3.5 pb-6">
      {/* Top Action Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-sm border border-border/80 bg-white p-3 sm:p-3.5 shadow-2xs">
        {/* Left: Back button & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/candidates")}
            className="inline-flex items-center justify-center size-9 rounded-sm border border-slate-200 bg-white text-subtle hover:text-ink hover:bg-slate-50 transition shadow-2xs shrink-0"
            title="Quay lại danh sách ứng viên"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-subtle">
              <span
                className="hover:underline cursor-pointer"
                onClick={() => navigate("/candidates")}
              >
                Quản lý ứng viên
              </span>
              <span>/</span>
              <span className="text-ink font-medium">Chi tiết ứng viên</span>
            </div>
            <h1 className="text-lg font-bold text-ink sm:text-xl truncate max-w-[280px] sm:max-w-md">
              {personal.fullName || "Chi tiết hồ sơ"}
            </h1>
          </div>
        </div>

        {/* Right: ACTION BUTTONS RIGHT AT THE TOP */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/candidates")}
            className="border-slate-200 text-slate-600 hover:text-ink h-9 px-3.5 text-xs rounded-sm"
          >
            Huỷ
          </Button>

          {personal.cvLink ? (
            <a
              href={personal.cvLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-2xs"
            >
              <Download className="size-3.5 text-slate-500" /> Tải CV
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed h-9 px-3.5 border-slate-200 text-slate-400 text-xs rounded-sm"
            >
              <Download className="size-3.5" /> Tải CV
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handleVerify(personal.githubLink, id)}
            disabled={verifyingLoading}
            variant="outline"
            className="border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/80 font-semibold gap-1.5 h-9 px-3.5 text-xs shadow-2xs rounded-sm"
          >
            {verifyingLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Đang kiểm chứng...
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 text-blue-600" /> Kiểm chứng
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(`/candidates/${id}/schedule`)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-1.5 h-9 px-3.5 text-xs shadow-2xs rounded-sm"
          >
            <Calendar className="size-3.5" /> Lên lịch phỏng vấn
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (!selectedJobId) {
                toast.warning(
                  "Vui lòng chọn vị trí công việc trước khi phân tích!",
                );
                return;
              }
              navigate(`/candidates/${id}/ai-analysis?jobId=${selectedJobId}`);
            }}
            className="bg-brand hover:bg-brand-dark text-white font-semibold gap-1.5 h-9 px-4 text-xs shadow-xs rounded-sm"
          >
            <Bot className="size-3.5" /> Phân tích AI
          </Button>
        </div>
      </div>

      {/* Candidate Profile Hero Card */}
      <div className="rounded-sm border border-border/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-sm border-2 border-white shadow-xs shrink-0">
              {personal.avatar ? (
                <AvatarImage src={personal.avatar} alt={personal.fullName} />
              ) : null}
              <AvatarFallback className="rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold">
                {personal.fullName ? personal.fullName.charAt(0).toUpperCase() : <User className="size-7" />}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-ink truncate">
                  {personal.fullName || "Chưa cập nhật tên"}
                </h2>
                <Badge
                  variant="outline"
                  className={`font-semibold text-xs px-2.5 py-0.5 rounded-sm ${getRecruitmentBadgeStyle(status)}`}
                >
                  {recruitmentLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-semibold text-xs px-2.5 py-0.5 rounded-sm ${getVerificationBadgeStyle(candidate.verificationStatus)}`}
                >
                  {verificationLabel}
                </Badge>
              </div>

              {/* Contact metadata pills */}
              <div className="flex items-center gap-4 text-xs text-subtle flex-wrap pt-0.5">
                {personal.email ? (
                  <a
                    href={`mailto:${personal.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-brand transition-colors"
                  >
                    <Mail className="size-3.5 text-hint" />
                    <span>{personal.email}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Mail className="size-3.5" /> Chưa có email
                  </span>
                )}

                {personal.phone ? (
                  <a
                    href={`tel:${personal.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-brand transition-colors"
                  >
                    <Phone className="size-3.5 text-hint" />
                    <span>{personal.phone}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Phone className="size-3.5" /> Chưa có SĐT
                  </span>
                )}

                {personal.githubLink && (
                  <a
                    href={personal.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand hover:underline"
                  >
                    <GitBranch className="size-3.5 text-brand" />
                    <span>GitHub Profile</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}

                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Calendar className="size-3.5" />
                  <span>Ngày lưu: {formatDate(createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Job selector embedded cleanly in hero */}
          <div className="min-w-[240px] max-w-[300px] space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Vị trí ứng tuyển (JD)
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={handleJobChange}
                className="w-full h-9 pl-3 pr-8 text-xs font-medium bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer text-ink appearance-none transition"
              >
                <option value="">-- Chọn vị trí công việc --</option>
                {jobs.map((job) => (
                  <option key={job.id || job._id} value={job.id || job._id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (8 cols): Deep dossier */}
        <div className="lg:col-span-8 space-y-3">
          {/* Mục tiêu nghề nghiệp */}
          {objective && (
            <div className="rounded-sm border border-border/80 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
                <Target className="size-4 text-brand" />
                Mục tiêu nghề nghiệp
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/40 border border-blue-100/50 rounded-sm p-3.5">
                {objective}
              </p>
            </div>
          )}

          {/* Kỹ năng chuyên môn */}
          <div className="rounded-sm border border-border/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
                <Code className="size-4 text-brand" />
                Kỹ năng chuyên môn
              </div>
              {allSkills?.length > 0 && (
                <span className="text-xs text-subtle font-medium">
                  {allSkills.length} kỹ năng
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {allSkills && allSkills.length > 0 ? (
                allSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-sm bg-blue-50/70 border border-blue-200/60 px-3 py-1 text-xs font-medium text-blue-700 shadow-2xs hover:bg-blue-100/60 transition"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-hint italic">Chưa có thông tin kỹ năng</span>
              )}
            </div>
          </div>

          {/* Kinh nghiệm làm việc */}
          <div className="rounded-sm border border-border/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
              <Briefcase className="size-4 text-brand" />
              Kinh nghiệm làm việc
            </div>

            {experiences && experiences.length > 0 ? (
              <div className="space-y-3 pt-1">
                {experiences.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-sm border border-slate-100 bg-slate-50/50 p-3.5 transition hover:bg-slate-50"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-blue-100/60 text-brand">
                      <Briefcase className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-ink">
                          {exp.position || "Vị trí công việc"}
                        </h4>
                        {exp.duration && (
                          <span className="text-xs text-subtle font-medium">
                            {exp.duration}
                          </span>
                        )}
                      </div>
                      {exp.company && (
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          {exp.company}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : firstExp ? (
              <div className="flex items-start gap-3 rounded-sm border border-slate-100 bg-slate-50/50 p-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-blue-100/60 text-brand">
                  <Briefcase className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-ink">
                    {firstExp.position || "Vị trí công việc"}
                  </h4>
                  {firstExp.company && (
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {firstExp.company} {firstExp.duration ? `(${firstExp.duration})` : ""}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-sm border border-dashed border-slate-200 p-4 text-sm text-subtle bg-slate-50/40">
                <Briefcase className="size-4 text-slate-400" />
                <span>Chưa có thông tin kinh nghiệm làm việc</span>
              </div>
            )}
          </div>

          {/* Học vấn & Bằng cấp */}
          <div className="rounded-sm border border-border/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
              <GraduationCap className="size-4 text-brand" />
              Học vấn & Bằng cấp
            </div>

            {educations && educations.length > 0 ? (
              <div className="space-y-3 pt-1">
                {educations.map((edu, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-sm border border-slate-100 bg-slate-50/50 p-3.5 transition hover:bg-slate-50"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-emerald-100/60 text-emerald-700">
                      <GraduationCap className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-ink">
                          {edu.school || "Trường đào tạo"}
                        </h4>
                        {edu.gpa && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2 py-0 rounded-sm"
                          >
                            GPA: {edu.gpa}
                          </Badge>
                        )}
                      </div>
                      {edu.major && (
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          Chuyên ngành: {edu.major}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : firstEdu ? (
              <div className="flex items-start gap-3 rounded-sm border border-slate-100 bg-slate-50/50 p-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-emerald-100/60 text-emerald-700">
                  <GraduationCap className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-ink">
                      {firstEdu.school || "Trường đào tạo"}
                    </h4>
                    {firstEdu.gpa && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2 py-0 rounded-sm"
                      >
                        GPA: {firstEdu.gpa}
                      </Badge>
                    )}
                  </div>
                  {firstEdu.major && (
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      Chuyên ngành: {firstEdu.major}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-sm border border-dashed border-slate-200 p-4 text-sm text-subtle bg-slate-50/40">
                <GraduationCap className="size-4 text-slate-400" />
                <span>Chưa có thông tin học vấn</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Attached CV & Verification Cards */}
        <div className="lg:col-span-4 space-y-3">
          {/* CV File Box */}
          <div className="rounded-sm border border-border/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
                <FileText className="size-4 text-brand" />
                Tệp hồ sơ gốc (CV)
              </div>
            </div>

            {personal.cvLink ? (
              <div className="rounded-sm border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-sm bg-red-100 text-red-600 shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-semibold text-ink"
                      title={personal.cvLink.split("/").pop()}
                    >
                      {personal.cvLink.split("/").pop() || "Hồ sơ ứng viên"}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">✓ Đã đính kèm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <a
                    href={personal.cvLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-sm bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-2xs transition"
                  >
                    <Download className="size-3.5" /> Xem / Tải CV
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-dashed border-slate-200 p-4 text-center text-xs text-subtle bg-slate-50/40">
                Chưa có tệp CV đính kèm
              </div>
            )}
          </div>

          {/* Verification GitHub Summary */}
          <div className="rounded-sm border border-border/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
                <ShieldCheck className="size-4 text-brand" />
                Kiểm chứng GitHub
              </div>
              <Badge
                variant="outline"
                className={`font-semibold text-[11px] px-2 py-0 rounded-sm ${getVerificationBadgeStyle(
                  candidate.verificationStatus,
                )}`}
              >
                {verificationLabel}
              </Badge>
            </div>

            <div className="rounded-sm border border-slate-100 bg-slate-50/60 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tài khoản:</span>
                {personal.githubLink ? (
                  <a
                    href={personal.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {personal.githubLink.replace("https://github.com/", "")}
                    <ExternalLink className="size-2.5" />
                  </a>
                ) : (
                  <span className="text-slate-400">Chưa liên kết</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-semibold text-slate-800">{verificationLabel}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerify(personal.githubLink, id)}
              disabled={verifyingLoading}
              className="w-full text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-sm"
            >
              {verifyingLoading ? "Đang quét dữ liệu..." : "Chạy kiểm chứng lại"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Hoàn tất phân tích AI */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-ink text-center">
              Hoàn tất phân tích AI
            </DialogTitle>
            <DialogDescription className="text-sm text-subtle text-center pt-2">
              AI đã phân tích xong profile của{" "}
              <b className="text-ink">
                {tempVerificationData?.name || "ứng viên"}
              </b>
              . Bạn có muốn lưu kết quả và kiểm tra chi tiết không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              className="border-border text-subtle hover:text-ink"
            >
              Huỷ bỏ
            </Button>
            <Button
              className="bg-primary hover:bg-brand-dark text-white font-semibold"
              onClick={handleConfirmSave}
            >
              Lưu & Kiểm tra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Thêm Link Thủ Công */}
      <Dialog
        open={showManualLinkModal}
        onOpenChange={(open) => {
          setShowManualLinkModal(open);
          if (!open) setManualLink("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-ink">
              Thêm link GitHub thủ công
            </DialogTitle>
            <DialogDescription className="text-sm text-subtle pt-2">
              Hệ thống không tìm thấy link GitHub nguyên bản của ứng viên này.
              Vui lòng dán link thủ công để đối chiếu dữ liệu:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="text"
              value={manualLink}
              onChange={(e) => setManualLink(e.target.value)}
              placeholder="Ví dụ: https://github.com/nguyenvana123"
              className="border-border h-10 text-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowManualLinkModal(false);
                setManualLink("");
              }}
              className="border-border text-subtle hover:text-ink"
            >
              Huỷ bỏ
            </Button>
            <Button
              className="bg-primary hover:bg-brand-dark text-white font-semibold"
              onClick={() => {
                if (
                  !manualLink.trim() ||
                  !manualLink.includes("github.com/")
                ) {
                  toast.error("Vui lòng nhập đúng định dạng link GitHub!");
                  return;
                }
                setShowManualLinkModal(false);
                handleVerify(manualLink.trim(), id);
              }}
            >
              Gửi và Kiểm chứng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateDetail;
