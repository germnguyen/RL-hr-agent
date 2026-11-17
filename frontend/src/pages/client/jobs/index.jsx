import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Briefcase, Loader2, RotateCcw } from "lucide-react";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import JobCreateModal from "./JobCreateModal";
import jobService from "../../../services/client/jobService";
import { Button } from "@/components/ui/button";

const FILTER_ALL = "ALL";
const FILTER_ACTIVE = "ACTIVE";
const FILTER_CLOSED = "CLOSED";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobService.getAll();
      setJobs(res.jobs || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách job:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = (job.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === FILTER_ACTIVE) matchesStatus = job.status === true;
      if (statusFilter === FILTER_CLOSED) matchesStatus = job.status === false;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  const handleViewDetail = async (job) => {
    try {
      const res = await jobService.getJobById(job.id || job._id);
      let fullJob = job;
      if (res.job) fullJob = res.job;
      else if (res.success && res.data?.job) fullJob = res.data.job;
      else if (res.data) fullJob = res.data;

      setSelectedJob(fullJob);
      document.body.style.overflow = "hidden";
    } catch (error) {
      console.error("Lỗi khi tải chi tiết công việc:", error);
      setSelectedJob(job);
      document.body.style.overflow = "hidden";
    }
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    document.body.style.overflow = "auto";
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Danh Sách Công Việc
          </h1>
          <p className="text-xs sm:text-sm text-subtle mt-0.5">
            Quản lý và theo dõi các vị trí tuyển dụng chuyên nghiệp
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="rounded-sm px-4 py-2 font-semibold text-xs bg-brand hover:bg-brand-dark text-white shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          <span>Tạo Job mới</span>
        </Button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-card rounded-sm p-2.5 sm:p-3 border border-border shadow-2xs mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-hint pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề công việc..."
            className="w-full h-8 pl-9 pr-3 rounded-sm border border-input bg-surface focus:bg-background focus:border-brand focus:ring-1 focus:ring-brand/20 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="inline-flex p-0.5 bg-surface-2 rounded-sm border border-border shrink-0 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter(FILTER_ALL)}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === FILTER_ALL
                ? "bg-white text-ink shadow-2xs"
                : "text-subtle hover:text-ink"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter(FILTER_ACTIVE)}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              statusFilter === FILTER_ACTIVE
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-subtle hover:text-ink"
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Đang tuyển
          </button>
          <button
            onClick={() => setStatusFilter(FILTER_CLOSED)}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              statusFilter === FILTER_CLOSED
                ? "bg-white text-rose-700 shadow-2xs"
                : "text-subtle hover:text-ink"
            }`}
          >
            <span className="size-1.5 rounded-full bg-rose-500" />
            Đã đóng
          </button>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm sm:text-base font-bold text-ink">
          Kết quả tìm kiếm
        </h2>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-2 text-subtle border border-border/50">
          <strong className="text-ink">{filteredJobs.length}</strong> công việc
        </span>
      </div>

      {/* Jobs Grid or Empty / Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-subtle">
          <Loader2 className="size-8 animate-spin text-brand" />
          <span className="text-sm font-medium">
            Đang tải danh sách công việc...
          </span>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id || job._id}
              job={job}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-sm border border-dashed border-border py-12">
          <div className="size-12 rounded-sm bg-surface-2 text-hint flex items-center justify-center mb-3">
            <Briefcase className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">
            Không tìm thấy công việc nào
          </h3>
          <p className="text-sm text-subtle max-w-md mb-6">
            Không có công việc nào khớp với tìm kiếm hoặc bộ lọc hiện tại của
            bạn.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter(FILTER_ALL);
            }}
            className="rounded-xl px-4 text-xs font-semibold hover:bg-surface-2 gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Xóa bộ lọc</span>
          </Button>
        </div>
      )}

      {/* Modals */}
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={handleCloseModal} />
      )}

      {isCreateModalOpen && (
        <JobCreateModal
          onClose={handleCloseCreateModal}
          onJobCreated={fetchJobs}
        />
      )}
    </div>
  );
};

export default JobList;
