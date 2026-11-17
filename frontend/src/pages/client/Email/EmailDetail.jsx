import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import emailService from "../../../services/client/emailService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  Mail,
  Users,
  Eye,
  Loader2,
  Lightbulb,
  FileText,
} from "lucide-react";

const EmailDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [template, setTemplate] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const state = location.state;

    if (state?.selectedTemplate) {
      const tmpl = state.selectedTemplate;
      setTemplate(tmpl);
      setCustomTitle(tmpl.title);
      setCustomContent(tmpl.content);
    } else {
      toast.warning("Không có mẫu email nào được chọn!");
      navigate("/candidates/emails");
      return;
    }

    if (state?.selectedCandidateIds && Array.isArray(state.selectedCandidateIds)) {
      setSelectedCandidates(state.selectedCandidateIds);
    } else {
      toast.warning("Không có ứng viên nào được chọn!");
      navigate("/candidates");
    }
  }, [navigate, location]);

  const handleSend = async () => {
    if (!customTitle.trim()) {
      toast.warning("Vui lòng nhập tiêu đề email!");
      return;
    }
    if (!customContent.trim()) {
      toast.warning("Vui lòng nhập nội dung email!");
      return;
    }

    setSending(true);
    toast.info(`Đang gửi email tới ${selectedCandidates.length} ứng viên...`);

    try {
      const response = await emailService.sendBulkEmail({
        candidateIds: selectedCandidates,
        template: {
          id: template.id,
          name: template.name,
        },
        title: customTitle,
        content: customContent,
      });

      if (response.success) {
        toast.success(
          `✅ Gửi email thành công tới ${selectedCandidates.length} ứng viên!`
        );
        setTimeout(() => {
          navigate("/candidates");
        }, 1500);
      } else {
        toast.error(response.message || "Gửi email thất bại!");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Có lỗi xảy ra khi gửi email!");
    } finally {
      setSending(false);
    }
  };

  const handleInsertTag = (tag) => {
    setCustomContent((prev) => prev + tag);
  };

  if (!template) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <p className="text-sm font-medium text-subtle">
          Đang tải thông tin mẫu email...
        </p>
      </div>
    );
  }

  const DYNAMIC_TAGS = [
    "[Tên Ứng Viên]",
    "[Tên Vị Trí]",
    "[Công ty]",
    "[Giờ]",
    "[Ngày/Tháng/Năm]",
    "[Link Google Meet]",
    "[Tên người phỏng vấn]",
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3.5 pb-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/candidates/emails")}
          className="gap-1.5 text-xs font-semibold text-slate-600 hover:text-ink hover:bg-slate-100 rounded-sm"
        >
          <ArrowLeft className="size-4" /> Quay lại danh sách mẫu email
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-sm bg-brand/10 text-brand">
              <Mail className="size-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Chỉnh sửa & Gửi email
            </h1>
          </div>
          <p className="text-xs text-subtle pl-9">
            Xem lại và tùy chỉnh tiêu đề cũng như nội dung email trước khi gửi hàng loạt đến ứng viên.
          </p>
        </div>

        <div className="flex items-center gap-2 pl-9 sm:pl-0">
          <Badge variant="outline" className="border-blue-200 bg-blue-50/70 text-blue-700 rounded-sm text-xs">
            Mẫu: {template.name}
          </Badge>
          <Badge className="bg-brand text-white rounded-sm text-xs">
            <Users className="mr-1 size-3" /> {selectedCandidates.length} ứng viên
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {/* Left column: Editor */}
        <div className="space-y-3.5 lg:col-span-2">
          <Card className="border-border/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-ink">
                Nội dung email gửi đi
              </CardTitle>
              <CardDescription>
                Tùy chỉnh thông tin liên hệ và lời nhắn cụ thể cho đợt thông báo này.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Title input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Tiêu đề email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Nhập tiêu đề email..."
                  className="h-10 text-sm font-medium focus-visible:ring-brand/20 focus-visible:border-brand"
                />
              </div>

              {/* Dynamic tag helpers */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500">
                  Chèn biến tự động (nhấn để thêm vào nội dung):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DYNAMIC_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Nhập nội dung email..."
                  rows={14}
                  className="min-h-[320px] font-sans text-sm leading-relaxed focus-visible:ring-brand/20 focus-visible:border-brand"
                />
              </div>

              {/* Hint alert */}
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900">
                <Lightbulb className="size-4 shrink-0 text-brand mt-0.5" />
                <span>
                  <strong>Mẹo:</strong> Các biến nằm trong dấu ngoặc vuông như <code>[Tên Ứng Viên]</code> sẽ được hệ thống tự động thay thế bằng dữ liệu thực tế tương ứng với từng ứng viên khi gửi.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Preview and Action */}
        <div className="space-y-3.5">
          {/* Info Card */}
          <Card className="border-border/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileText className="size-4 text-brand" />
                Thông tin đợt gửi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Mẫu áp dụng:</span>
                <span className="font-semibold text-ink">{template.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Số lượng người nhận:</span>
                <Badge variant="secondary" className="font-semibold">
                  {selectedCandidates.length} ứng viên
                </Badge>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Tiêu đề dự kiến:</span>
                <p className="truncate font-medium text-ink">
                  {customTitle || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Card */}
          <Card className="border-border/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Eye className="size-4 text-brand" />
                Xem trước email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <div className="border-b border-slate-200 pb-2">
                  <div className="text-[11px] text-slate-400">Tiêu đề:</div>
                  <div className="text-xs font-bold text-ink">
                    {customTitle || "(Chưa có tiêu đề)"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Nội dung mẫu:</div>
                  <div className="mt-1 line-clamp-6 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {customContent || "(Chưa có nội dung)"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div>
            <Button
              className="w-full h-11 rounded-xl bg-brand text-white font-medium shadow-sm hover:bg-brand-dark transition-all disabled:opacity-50"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang gửi email...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Gửi email cho {selectedCandidates.length} ứng viên
                </>
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Quá trình gửi sẽ chạy trên nền thông qua dịch vụ máy chủ email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;
