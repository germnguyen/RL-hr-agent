import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { X, Briefcase, Loader2 } from "lucide-react";
import jobService from "../../../services/client/jobService";
import TagInput from "./TagInput";
import RichToolbar from "./RichToolbar";
import { Button } from "@/components/ui/button";

const JobCreateModal = ({ onClose, onJobCreated }) => {
  const descRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: true,
  });
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc!");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: tags,
      status: form.status,
    };

    setSubmitting(true);
    try {
      const res = await jobService.create(payload);
      if (res.success || res.data) {
        toast.success("Tạo công việc mới thành công!");
        onJobCreated();
        onClose();
      } else {
        toast.error("Không thể tạo công việc. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi tạo Job:", error);
      toast.error("Đã xảy ra lỗi khi tạo công việc.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <Briefcase className="size-5" />
            </span>
            <h2 className="text-xl font-bold text-ink">Tạo Công Việc Mới</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="size-8 rounded-lg flex items-center justify-center text-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="job-create-form"
          className="p-6 overflow-y-auto space-y-5 text-foreground"
          onSubmit={handleSubmit}
        >
          {/* Tiêu đề */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="w-full h-11 px-3.5 rounded-xl border border-input bg-surface focus:bg-background focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="VD: Senior Frontend Developer (React)"
              value={form.title}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          {/* Mô tả */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Mô tả chi tiết
            </label>
            <div className="rounded-xl border border-input focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 bg-surface overflow-hidden transition-all">
              <RichToolbar textareaRef={descRef} />
              <textarea
                id="description"
                name="description"
                ref={descRef}
                className="w-full p-3.5 bg-transparent resize-y min-h-[160px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="Mô tả trách nhiệm, quyền lợi và môi trường làm việc..."
                value={form.description}
                onChange={handleChange}
                rows={6}
              />
            </div>
          </div>

          {/* Kỹ năng */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              Yêu cầu kỹ năng
            </label>
            <p className="text-xs text-hint mb-2">
              Nhấn Enter hoặc dấu phẩy để thêm kỹ năng
            </p>
            <TagInput tags={tags} setTags={setTags} />
          </div>

          {/* Trạng thái ban đầu */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Trạng thái ban đầu
            </label>
            <div className="inline-flex p-1 bg-surface-2 rounded-xl border border-border">
              <button
                type="button"
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  form.status
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-subtle hover:text-ink"
                }`}
                onClick={() => setForm((p) => ({ ...p, status: true }))}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    form.status ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                Đang mở
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !form.status
                    ? "bg-white text-rose-700 shadow-xs"
                    : "text-subtle hover:text-ink"
                }`}
                onClick={() => setForm((p) => ({ ...p, status: false }))}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    !form.status ? "bg-rose-500" : "bg-slate-400"
                  }`}
                />
                Đóng
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-2/40">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-5 font-semibold text-xs cursor-pointer hover:bg-surface-2"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="job-create-form"
            disabled={submitting}
            className="rounded-xl px-5 font-semibold text-xs bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-xs gap-1.5"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitting ? "Đang tạo..." : "Tạo Công việc"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobCreateModal;
