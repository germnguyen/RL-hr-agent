import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import jobService from "../../../services/client/jobService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Loader2,
  ChevronDown,
  ExternalLink,
  X,
  File,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Camera,
} from "lucide-react";

const UploadCV = () => {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [jobId, setJobId] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [jobList, setJobList] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobService.getAll();
        if (response?.success && response.jobs) {
          const fetchedJobs = response.jobs.map((j) => ({
            id: j._id || j.id,
            title: j.title,
          }));
          setJobList(fetchedJobs);
        } else {
          setJobList([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách công việc:", error);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [selectedImage]);

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const validateFile = useCallback((file) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Chỉ chấp nhận ảnh hoặc tài liệu (JPG, PNG, GIF, WEBP, PDF, DOC, DOCX)!"
      );
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File không được vượt quá 10MB!");
      return false;
    }
    return true;
  }, []);

  const validateImage = (file) => {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận ảnh JPG, PNG, GIF, WEBP!");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB!");
      return false;
    }
    return true;
  };

  const handleFileSelect = useCallback((file) => {
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, [validateFile]);

  const handleImageSelect = (file) => {
    if (file && validateImage(file)) {
      setSelectedImage(file);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleImageInputChange = (e) => {
    const file = e.target.files[0];
    handleImageSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file CV!");
      return;
    }

    if (!jobId.trim()) {
      toast.error("Vui lòng nhập Job ID trước khi upload!");
      return;
    }

    setUploading(true);
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("cv", selectedFile);
      if (selectedImage) {
        formData.append("avatar", selectedImage);
      }
      formData.append("jobID", jobId.trim());

      const baseURL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const uploadRes = await axios.post(`${baseURL}/upload/cv`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      const { cvLink, newCandidate } = uploadRes.data || {};
      const candidateID = newCandidate?.id || newCandidate?._id;

      const newFile = {
        id: candidateID || Date.now(),
        name: selectedFile.name,
        size: selectedFile.size,
        date: new Date().toLocaleDateString("vi-VN"),
        cvLink,
      };
      setUploadedFiles((prev) => [newFile, ...prev]);
      setSelectedFile(null);
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      toast.success(
        "Upload CV" + (selectedImage ? " và ảnh" : "") + " thành công!"
      );
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Upload thất bại!");
    } finally {
      setUploading(false);
    }
  };

  const renderFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return (
        <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <FileText className="size-5" />
        </div>
      );
    }
    if (ext === "doc" || ext === "docx") {
      return (
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <FileCode className="size-5" />
        </div>
      );
    }
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return (
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <ImageIcon className="size-5" />
        </div>
      );
    }
    return (
      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <File className="size-5" />
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3.5 pb-4">
      {/* Header section - compact & elegant */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/70 px-2.5 py-0.5 text-xs font-semibold text-brand mb-0.5">
            <Sparkles className="size-3" />
            Tuyển dụng thông minh
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Tải lên hồ sơ ứng viên (CV)
          </h1>
          <p className="text-xs text-subtle mt-0.5">
            Chọn vị trí công việc và đính kèm CV để hệ thống AI tự động phân tích và lưu vào quy trình tuyển dụng.
          </p>
        </div>
      </div>

      {/* Main Upload Card - Compact 2-Column Bento Layout */}
      <Card className="border-border/80 bg-white shadow-xs rounded-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            {/* Cột trái: Điều khiển & Thông tin hồ sơ (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
              <div className="space-y-3">
                {/* Vị trí tuyển dụng */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                    <Briefcase className="size-3.5 text-brand" />
                    Vị trí tuyển dụng <span className="text-red-500">*</span>
                  </label>
                  <Select value={jobId} onValueChange={(val) => setJobId(val)}>
                    <SelectTrigger className="w-full rounded-sm border-border bg-slate-50/60 h-10 text-xs sm:text-sm font-medium text-ink hover:bg-slate-50 focus:border-brand focus:ring-1 focus:ring-brand/20">
                      <SelectValue placeholder="-- Chọn công việc ứng tuyển --" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm max-h-60">
                      {jobList.length === 0 ? (
                        <div className="py-3 px-2 text-center text-xs text-subtle">
                          Chưa có vị trí công việc nào
                        </div>
                      ) : (
                        jobList.map((job, idx) => (
                          <SelectItem
                            key={job.id ? `${job.id}-${idx}` : `job-${idx}`}
                            value={job.id || String(idx)}
                            className="rounded-sm text-xs sm:text-sm cursor-pointer py-2 focus:bg-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <Briefcase className="size-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{job.title}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {/* Quick select pills */}
                  {jobList.length > 0 && (
                    <div className="pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium text-subtle">Gợi ý nhanh:</span>
                        {jobList.slice(0, 3).map((job, idx) => (
                          <button
                            key={job.id ? `${job.id}-${idx}` : `quick-${idx}`}
                            type="button"
                            onClick={() => setJobId(job.id)}
                            className={cn(
                              "px-2 py-0.5 rounded-sm text-[11px] font-medium transition-all border cursor-pointer",
                              jobId === job.id
                                ? "bg-brand/10 text-brand border-brand/30 shadow-2xs"
                                : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-ink"
                            )}
                          >
                            {job.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ảnh chân dung (tùy chọn) - Compact Avatar Tile */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                    <ImageIcon className="size-3.5 text-brand" />
                    Ảnh chân dung (Tùy chọn)
                  </label>
                  <div className="flex items-center gap-3 rounded-sm border border-slate-200/80 bg-slate-50/50 p-2.5">
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="group relative flex size-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed border-slate-300 bg-white transition hover:border-brand"
                      title="Nhấp để chọn ảnh chân dung"
                    >
                      {imagePreviewUrl ? (
                        <>
                          <img
                            src={imagePreviewUrl}
                            alt="Avatar"
                            className="size-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <Camera className="size-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-brand">
                          <Camera className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {selectedImage ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink" title={selectedImage.name}>
                              {selectedImage.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatFileSize(selectedImage.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-sm"
                            onClick={handleRemoveImage}
                          >
                            Xóa
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            className="text-xs font-semibold text-brand hover:underline"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            Chọn ảnh chân dung
                          </button>
                          <p className="text-[11px] text-slate-400">
                            Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
                    onChange={handleImageInputChange}
                  />
                </div>
              </div>

              {/* Nút Submit */}
              <div className="space-y-2 pt-1">
                <Button
                  className="w-full h-10 rounded-sm bg-brand font-medium text-white shadow-xs hover:bg-brand-dark transition-all disabled:opacity-50"
                  disabled={!selectedFile || uploading || !jobId.trim()}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Đang tải hồ sơ lên...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4 mr-2" />
                      Tải lên hồ sơ ứng viên
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] text-slate-400">
                  Tự động lưu vào quy trình tuyển dụng ở cột &quot;Ứng tuyển&quot;.
                </p>
              </div>
            </div>

            {/* Cột phải: CV Dropzone & Instant Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                  <FileText className="size-3.5 text-brand" />
                  Tệp tin hồ sơ CV <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Tối đa 10MB
                </span>
              </div>

              {/* Dropzone Container */}
              <div className="flex-1 flex flex-col justify-center">
                {selectedFile ? (
                  /* Selected File Preview */
                  <div className="flex flex-col justify-between rounded-sm border border-blue-200 bg-blue-50/30 p-4 transition-all">
                    <div className="flex items-start gap-3">
                      {renderFileIcon(selectedFile.name)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-ink" title={selectedFile.name}>
                            {selectedFile.name}
                          </span>
                          <Badge className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 font-medium rounded-sm">
                            ✓ Đã sẵn sàng
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-subtle">
                          Kích thước: {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-sm"
                        onClick={handleRemoveFile}
                        title="Xóa tệp tin"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-blue-100/80 pt-3">
                      <span className="text-xs text-slate-500">
                        Tệp đã sẵn sàng tải lên
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-slate-200 bg-white hover:bg-slate-50 rounded-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Đổi tệp khác
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Active Dropzone */
                  <div
                    className={cn(
                      "group relative flex flex-1 flex-col items-center justify-center rounded-sm border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer min-h-[220px]",
                      isDragging
                        ? "scale-[1.01] border-brand bg-brand/5 ring-4 ring-brand/10"
                        : "border-slate-200 bg-slate-50/40 hover:border-brand/60 hover:bg-slate-50/80"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="mb-2.5 flex size-11 items-center justify-center rounded-sm bg-brand/10 text-brand shadow-2xs transition-transform duration-200 group-hover:scale-105">
                      <UploadCloud className="size-6" />
                    </div>

                    <p className="text-sm font-semibold text-ink">
                      Kéo thả file CV vào đây hoặc{" "}
                      <span className="text-brand hover:underline">chọn từ máy tính</span>
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
                      {["PDF", "DOC", "DOCX", "JPG", "PNG"].map((ext) => (
                        <span
                          key={ext}
                          className="rounded-sm border border-slate-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shadow-2xs"
                        >
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,image/*"
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3-Column Feature & Process Highlights to fill and balance the viewport */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        <div className="p-4 rounded-sm border border-border/80 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-sm bg-blue-50 text-brand flex items-center justify-center shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-ink">Bóc tách CV bằng AI</h3>
              <p className="text-[11px] text-subtle">Tự động trích xuất thông tin</p>
            </div>
          </div>
          <p className="text-xs text-subtle leading-relaxed">
            Hệ thống tự động phân tích kỹ năng, số năm kinh nghiệm, học vấn và đánh giá độ phù hợp với JD tuyển dụng.
          </p>
        </div>

        <div className="p-4 rounded-sm border border-border/80 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-ink">Định dạng hồ sơ chuẩn</h3>
              <p className="text-[11px] text-subtle">Khuyến nghị PDF văn bản</p>
            </div>
          </div>
          <p className="text-xs text-subtle leading-relaxed">
            Hỗ trợ PDF, DOC, DOCX, PNG, JPG (tối đa 10MB). Khuyến khích sử dụng tệp PDF văn bản rõ nét để AI bóc tách chính xác nhất.
          </p>
        </div>

        <div className="p-4 rounded-sm border border-border/80 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Briefcase className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-ink">Đồng bộ phễu tuyển dụng</h3>
              <p className="text-[11px] text-subtle">Lưu vào bảng Kanban</p>
            </div>
          </div>
          <p className="text-xs text-subtle leading-relaxed">
            Hồ sơ sau khi tải lên sẽ lập tức được xếp vào cột &quot;Ứng tuyển&quot; trong quy trình tuyển dụng để tiến hành sàng lọc.
          </p>
        </div>
      </div>

      {/* Uploaded Files History */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <FileCheck className="size-4 text-emerald-600" />
              Hồ sơ đã tải lên phiên này
            </h2>
            <Badge variant="secondary" className="rounded-sm px-2 py-0 text-xs">
              {uploadedFiles.length} tệp
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {uploadedFiles.map((file) => (
              <Card
                key={file.id}
                className="overflow-hidden border-border/80 bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs hover:border-slate-300 rounded-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderFileIcon(file.name)}
                    <div className="min-w-0">
                      <div
                        className="truncate text-xs font-semibold text-ink"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{file.date}</div>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-transparent text-[10px] px-1.5 py-0 font-medium rounded-sm">
                    ✓ Đã tải
                  </Badge>
                </div>
                {file.cvLink && (
                  <div className="mt-2.5 border-t border-slate-100 pt-2 flex justify-end">
                    <a
                      href={file.cvLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                    >
                      Xem chi tiết tệp <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Result */}
      {analysisResult && (
        <Card className="border-border/80 bg-white p-6 shadow-sm space-y-6 rounded-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex size-10 items-center justify-center rounded-sm bg-blue-50 text-brand">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">
                Kết quả Phân tích từ AI
              </h3>
              <p className="text-xs text-subtle">
                Đánh giá mức độ phù hợp và tổng hợp thông tin quan trọng của ứng viên
              </p>
            </div>
          </div>

          {/* Score section */}
          <div className="rounded-sm border border-slate-100 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-700">Mức độ phù hợp với công việc</span>
              <span className="text-brand font-bold text-base">
                {analysisResult.matchingScore}%
              </span>
            </div>
            <Progress value={analysisResult.matchingScore || 0} className="h-2.5" />
          </div>

          {analysisResult.summary && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tóm tắt đánh giá
              </h4>
              <p className="text-sm leading-relaxed text-slate-700">
                {analysisResult.summary}
              </p>
            </div>
          )}

          {analysisResult.redFlags?.length > 0 && (
            <div className="rounded-sm border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="size-4 text-amber-600" />
                Điểm cần lưu ý / Rủi ro tiềm ẩn
              </div>
              <ul className="space-y-1.5 pl-5 text-sm text-amber-900 list-disc">
                {analysisResult.redFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.suggestedQuestions?.length > 0 && (
            <div className="rounded-sm border border-blue-100 bg-blue-50/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <HelpCircle className="size-4 text-brand" />
                Gợi ý câu hỏi phỏng vấn cho HR
              </div>
              <ul className="space-y-1.5 pl-5 text-sm text-blue-950 list-disc">
                {analysisResult.suggestedQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default UploadCV;
