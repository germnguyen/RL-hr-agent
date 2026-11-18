import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Users,
  Loader2,
  ExternalLink,
} from "lucide-react";
import jobService from "../../../services/client/jobService";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const JobCandidates = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await jobService.getCandidatesByJob(id);
        if (res.candidates) {
          setCandidates(res.candidates);
        } else if (res.success && res.data?.candidates) {
          setCandidates(res.data.candidates);
        } else {
          setCandidates(res.data || []);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách ứng viên:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCandidates();
  }, [id]);

  const getScoreTheme = (score) => {
    if (score == null) {
      return {
        bg: "bg-surface-2 text-subtle border-border",
        label: "Chưa phân tích",
      };
    }
    if (score >= 80) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Phù hợp cao",
      };
    }
    if (score >= 50) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Phù hợp",
      };
    }
    return {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Chưa đạt",
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-subtle hover:text-ink transition-colors mb-4 cursor-pointer group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách công việc
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Danh sách ứng viên
        </h1>
        <p className="text-sm sm:text-base text-subtle mt-1">
          Ứng viên đã nộp hồ sơ cho vị trí tuyển dụng này
        </p>
      </div>

      {/* Main Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-subtle">
            <Loader2 className="size-8 animate-spin text-brand" />
            <span className="text-sm font-medium">
              Đang tải thông tin ứng viên...
            </span>
          </div>
        ) : candidates.length > 0 ? (
          <div className="flex flex-col gap-4">
            {candidates.map((cand) => {
              const score = cand.matchingScore;
              const scoreTheme = getScoreTheme(score);
              const fullName = cand.personal?.fullName || "Chưa cập nhật tên";
              const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "U";

              return (
                <div
                  key={cand.id || cand._id}
                  className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
                >
                  {/* Left Info: Avatar + Details */}
                  <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    <Avatar className="size-14 sm:size-16 rounded-full border-2 border-background shadow-xs shrink-0">
                      <AvatarImage
                        src={cand.personal?.avatar}
                        alt={fullName}
                      />
                      <AvatarFallback className="bg-brand-light text-brand font-bold text-base sm:text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base sm:text-lg font-bold text-ink group-hover:text-brand transition-colors truncate"
                        title={fullName}
                      >
                        {fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle mt-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 truncate"
                          title="Email"
                        >
                          <Mail className="size-3.5 text-hint shrink-0" />
                          <span className="truncate">
                            {cand.personal?.email || "--"}
                          </span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 truncate"
                          title="Số điện thoại"
                        >
                          <Phone className="size-3.5 text-hint shrink-0" />
                          <span>{cand.personal?.phone || "--"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Match Score + Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    {/* Score Badge */}
                    <div
                      className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border min-w-[80px] shrink-0 text-center ${scoreTheme.bg}`}
                    >
                      {score != null ? (
                        <>
                          <span className="text-xl sm:text-2xl font-black leading-none">
                            {score}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider mt-1">
                            {scoreTheme.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold py-1">
                          Chưa phân tích
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/candidates/${cand.id || cand._id}`)
                        }
                        className="rounded-xl px-4 text-xs font-semibold bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-xs gap-1.5"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Xem chi tiết</span>
                      </Button>
                      {cand.personal?.githubLink ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="rounded-xl px-4 text-xs font-semibold hover:bg-surface-2 gap-1.5 cursor-pointer"
                        >
                          <a
                            href={cand.personal.githubLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span>GitHub</span>
                          </a>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="rounded-xl px-4 text-xs font-medium opacity-50 cursor-not-allowed gap-1.5"
                        >
                          <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                          <span>Không GitHub</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border">
            <div className="size-14 rounded-2xl bg-surface-2 text-hint flex items-center justify-center mb-4">
              <Users className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">
              Chưa có ứng viên nào
            </h3>
            <p className="text-sm text-subtle max-w-md">
              Vị trí này hiện tại chưa có hồ sơ ứng tuyển nào được ghi nhận.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCandidates;
