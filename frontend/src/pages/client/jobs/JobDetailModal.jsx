import React from "react";
import { X, FileText, CheckCircle2, Calendar, Hash, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const JobDetailModal = ({ job, onClose }) => {
  if (!job) return null;

  const formattedDate = new Date(job.createdAt).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-ink line-clamp-1 pr-4">
            {job.title}
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-foreground">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border/80 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
                <Hash className="size-3.5 text-hint" />
                <span>Mã tham chiếu (ID)</span>
              </div>
              <div className="text-sm font-semibold font-mono text-ink break-all">
                {job.id || job._id}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border/80 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
                <CheckCircle2 className="size-3.5 text-hint" />
                <span>Trạng thái tuyển dụng</span>
              </div>
              <div>
                <Badge
                  variant="outline"
                  className={
                    job.status
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 px-2.5 py-1 text-xs font-semibold gap-1.5"
                      : "bg-slate-100 text-slate-600 border-slate-200 px-2.5 py-1 text-xs font-semibold gap-1.5"
                  }
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      job.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  {job.status ? "Đang tuyển dụng" : "Đã đóng"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mô tả công việc */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-base font-bold text-ink">
              <span className="size-7 rounded-lg bg-brand-light text-brand flex items-center justify-center">
                <FileText className="size-4" />
              </span>
              Mô tả công việc
            </h3>
            {job.description ? (
              <div
                className="p-4 rounded-xl bg-surface/50 border border-border/60 text-sm text-subtle leading-relaxed whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <div className="p-4 rounded-xl bg-surface/50 border border-dashed border-border text-sm text-hint italic">
                Chưa có thông tin mô tả chi tiết cho công việc này.
              </div>
            )}
          </div>

          {/* Yêu cầu kỹ năng */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-base font-bold text-ink">
              <span className="size-7 rounded-lg bg-brand-light text-brand flex items-center justify-center">
                <Tag className="size-4" />
              </span>
              Yêu cầu kỹ năng
            </h3>
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
          </div>

          {/* Ngày tạo */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-base font-bold text-ink">
              <span className="size-7 rounded-lg bg-surface-2 text-subtle flex items-center justify-center">
                <Calendar className="size-4" />
              </span>
              Ngày tạo
            </h3>
            <div className="text-sm font-medium text-subtle pl-9">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-surface-2/40">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 font-semibold text-xs cursor-pointer hover:bg-surface-2"
          >
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
