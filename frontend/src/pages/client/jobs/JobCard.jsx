import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Edit3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const JobCard = ({ job, onViewDetail }) => {
  const navigate = useNavigate();

  const handleViewCandidates = () => {
    navigate(`/jobs/${job.id || job._id}/candidates`);
  };

  const formattedDate = new Date(job.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="text-lg font-bold text-ink group-hover:text-brand transition-colors line-clamp-2"
            title={job.title}
          >
            {job.title}
          </h3>
          <Badge
            variant="outline"
            className={
              job.status
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold shrink-0 gap-1.5"
                : "bg-slate-100 text-slate-600 border-slate-200 px-2.5 py-0.5 text-xs font-semibold shrink-0 gap-1.5"
            }
          >
            <span
              className={`size-1.5 rounded-full ${
                job.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {job.status ? "Đang tuyển" : "Đã đóng"}
          </Badge>
        </div>

        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.requirements.slice(0, 5).map((req, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-2 text-subtle border border-border/60"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-hint bg-surface-2/60">
                +{job.requirements.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-subtle mt-auto pt-3 border-t border-border/50">
          <Calendar className="size-3.5 text-hint" />
          <span>Ngày tạo: {formattedDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        <Button
          size="sm"
          onClick={() => onViewDetail(job)}
          className="w-full text-xs font-semibold bg-brand hover:bg-brand-dark text-white rounded-lg gap-1.5 cursor-pointer shadow-2xs"
        >
          <Eye className="size-3.5" />
          <span>Xem chi tiết</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigate(`/jobs/${job.id || job._id}`, { state: { editMode: true } })
          }
          className="w-full text-xs font-semibold rounded-lg gap-1.5 cursor-pointer hover:bg-surface-2"
        >
          <Edit3 className="size-3.5" />
          <span>Chỉnh sửa</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleViewCandidates}
          className="w-full text-xs font-semibold rounded-lg gap-1.5 cursor-pointer bg-surface-2 hover:bg-surface-2/80 hover:text-brand"
        >
          <Users className="size-3.5" />
          <span>DS ứng viên</span>
        </Button>
      </div>
    </div>
  );
};

export default JobCard;
