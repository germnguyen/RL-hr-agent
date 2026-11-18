import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Calendar,
  Hash,
  FileText,
  Tag,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import jobService from "../../../services/client/jobService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(location.state?.editMode || false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    status: true,
  });

  const fetchJobDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobService.getJobById(id);
      let foundJob = null;
      if (res.job) foundJob = res.job;
      else if (res.success && res.data?.job) foundJob = res.data.job;
      else foundJob = res.data || res;

      if (foundJob) {
        setJob(foundJob);
        resetFormData(foundJob);
      }
    } catch (err) {
      console.error("Lỗi tải chi tiết công việc:", err);
      setError("Không thể tải chi tiết công việc. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchJobDetail();
  }, [id, fetchJobDetail]);

  const resetFormData = (jobData) => {
    setFormData({
      title: jobData.title || "",
      description: jobData.description || "",
      requirements: jobData.requirements ? jobData.requirements.join(", ") : "",
      status: jobData.status !== undefined ? jobData.status : true,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetFormData(job);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const reqArray = formData.requirements
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const updatePayload = {
        title: formData.title,
        description: formData.description,
        requirements: reqArray,
        status: formData.status === "true" || formData.status === true,
      };

      const res = await jobService.updateJob(id, updatePayload);
      if (res.success) {
        const updatedJob =
          res.updatedJob ||
          res.data?.updatedJob ||
          res.job || { ...job, ...updatePayload };
        setJob(updatedJob);
        resetFormData(updatedJob);
        setIsEditing(false);
        toast.success("Cập nhật công việc thành công!");
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi cập nhật!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 min-h-screen">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-subtle">
          <Loader2 className="size-8 animate-spin text-brand" />
          <span className="text-sm font-medium">Đang tải thông tin chi tiết...</span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 min-h-screen">
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-destructive/20 max-w-lg mx-auto shadow-xs">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">Oops! Có lỗi xảy ra</h3>
          <p className="text-sm text-subtle mb-6">{error || "Không tìm thấy thông tin công việc."}</p>
          <Button
            onClick={() => navigate("/jobs")}
            className="rounded-xl px-5 font-semibold text-xs bg-brand hover:bg-brand-dark text-white cursor-pointer"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(job.createdAt).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Top Bar: Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-subtle hover:text-ink transition-colors cursor-pointer group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách công việc
        </button>

        <div className="flex items-center gap-2.5">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-xl px-4 text-xs font-semibold hover:bg-surface-2 cursor-pointer gap-1.5"
              >
                <X className="size-3.5" />
                <span>Hủy</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl px-4 text-xs font-semibold bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-xs gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="rounded-xl px-4 text-xs font-semibold hover:bg-surface-2 cursor-pointer gap-1.5"
            >
              <Edit3 className="size-3.5" />
              <span>Chỉnh sửa</span>
            </Button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          {isEditing ? (
            <div className="w-full space-y-2">
              <label className="block text-xs font-semibold text-subtle">
                Tiêu đề công việc
              </label>
              <Input
                className="h-12 text-lg sm:text-xl font-bold rounded-xl"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề công việc..."
              />
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {job.title}
            </h1>
          )}

          <div className="shrink-0">
            {isEditing ? (
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-subtle">Trạng thái:</label>
                <select
                  className="h-10 px-3.5 rounded-xl border border-input bg-surface text-xs font-semibold text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value === "true" || e.target.value === true,
                    })
                  }
                >
                  <option value="true">Đang tuyển dụng</option>
                  <option value="false">Đã đóng</option>
                </select>
              </div>
            ) : (
              <Badge
                variant="outline"
                className={
                  job.status
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 px-3 py-1 text-xs font-bold gap-1.5"
                    : "bg-slate-100 text-slate-600 border-slate-200 px-3 py-1 text-xs font-bold gap-1.5"
                }
              >
                <span
                  className={`size-2 rounded-full ${
                    job.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {job.status ? "Đang tuyển dụng" : "Đã đóng"}
              </Badge>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-border text-xs sm:text-sm text-subtle font-medium">
          <div className="flex items-center gap-2">
            <Hash className="size-4 text-hint" />
            <span>ID Công việc:</span>
            <span className="font-mono text-ink font-semibold">{job.id || job._id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-hint" />
            <span>Ngày tạo:</span>
            <span className="text-ink font-semibold">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Description */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-xs lg:col-span-2 space-y-4">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-ink">
            <span className="size-8 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <FileText className="size-4" />
            </span>
            Mô tả công việc
          </h2>

          {isEditing ? (
            <Textarea
              className="min-h-[280px] p-4 text-sm rounded-xl resize-y leading-relaxed"
              placeholder="Nhập mô tả công việc chi tiết..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          ) : job.description ? (
            <div
              className="text-sm text-subtle leading-relaxed whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <div className="p-6 rounded-xl bg-surface/50 border border-dashed border-border text-sm text-hint italic text-center">
              Chưa có thông tin mô tả chi tiết cho công việc này.
            </div>
          )}
        </div>

        {/* Right Column: Skills & Quick Actions */}
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2.5 text-lg font-bold text-ink">
              <span className="size-8 rounded-xl bg-brand-light text-brand flex items-center justify-center">
                <Tag className="size-4" />
              </span>
              Yêu cầu kỹ năng
            </h2>

            {isEditing ? (
              <div className="space-y-2">
                <label className="block text-xs text-hint">
                  Phân cách các kỹ năng bằng dấu phẩy (,)
                </label>
                <Textarea
                  className="min-h-[100px] p-3 text-sm rounded-xl resize-y"
                  placeholder="VD: ReactJS, Node.js, TypeScript"
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {job.requirements?.length > 0 ? (
                  job.requirements.map((req, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-brand-light text-brand text-xs font-semibold rounded-full border border-brand/20 shadow-2xs"
                    >
                      {req}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-hint italic">
                    Chưa có yêu cầu kỹ năng cụ thể.
                  </span>
                )}
              </div>
            )}
          </div>

          <Button
            asChild
            className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold text-xs sm:text-sm py-2.5 cursor-pointer shadow-xs gap-2"
          >
            <Link to={`/jobs/${job.id || job._id}/candidates`}>
              <Users className="size-4" />
              <span>Xem danh sách ứng viên</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
