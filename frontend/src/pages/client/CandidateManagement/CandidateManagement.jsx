import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Mail,
  Plus,
  Filter,
  RotateCcw,
  Users,
  UserCheck,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Clock,
  ExternalLink,
} from "lucide-react";
import candidateService from "../../../services/client/candidateService";
import jobService from "../../../services/client/jobService";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 8;

const CandidateManagement = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter Inputs
  const [searchSkillInput, setSearchSkillInput] = useState("");
  const [searchExpInput, setSearchExpInput] = useState("");
  const [filterStatusInput, setFilterStatusInput] = useState("all");

  // Applied Filters
  const [searchSkill, setSearchSkill] = useState("");
  const [searchExp, setSearchExp] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Tooltip State
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredCandidateData, setHoveredCandidateData] = useState(null);

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await candidateService.getAll();
      setCandidates(res.candidates || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách ứng viên!");
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

  const getJobTitle = (jobID) => {
    if (!jobID) return "Chưa cập nhật";
    const job = jobs.find((j) => j.id === jobID || j._id === jobID);
    return job ? job.title : "Chưa cập nhật";
  };

  const matchesKeyword = (candidate, searchTerm) => {
    if (!searchTerm) return true;
    const trimmed = searchTerm.trim().toLowerCase();

    // Check full name
    if (candidate.fullName && candidate.fullName.toLowerCase().includes(trimmed)) {
      return true;
    }

    // Check job title
    const jobTitle = candidate.jobTitle || getJobTitle(candidate.jobID);
    if (jobTitle && jobTitle.toLowerCase().includes(trimmed)) {
      return true;
    }

    // Check skills
    let skills = candidate.allSkills || [];
    if (typeof skills === "string") {
      skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(skills)) {
      return skills.some((skill) => skill && skill.toLowerCase().trim().includes(trimmed));
    }

    return false;
  };

  const matchesExperience = (candidate, searchTerm) => {
    if (!searchTerm) return true;
    const years = candidate.yearsOfExperience || candidate.experiences?.length || 0;
    return years.toString().includes(searchTerm.trim());
  };

  const matchesStatus = (candidate, status) => {
    if (status === "all") return true;
    return candidate.status === status;
  };

  const filtered = useMemo(() => {
    return candidates.filter((candidate) => {
      const hasSkill = matchesKeyword(candidate, searchSkill);
      const hasExp = matchesExperience(candidate, searchExp);
      const hasStatus = matchesStatus(candidate, filterStatus);
      return hasSkill && hasExp && hasStatus;
    });
  }, [candidates, searchSkill, searchExp, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = currentPage * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Selection logic
  const isAllCurrentSelected =
    paginatedData.length > 0 && paginatedData.every((c) => selectedIds.includes(c.id));
  const isSomeCurrentSelected =
    paginatedData.some((c) => selectedIds.includes(c.id)) && !isAllCurrentSelected;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      const pageIds = paginatedData.map((c) => c.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedData.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Status metrics for KPI cards
  const stats = useMemo(() => {
    const total = candidates.length;
    const applied = candidates.filter((c) => c.status === "applied").length;
    const interview = candidates.filter(
      (c) => c.status === "interview" || c.status === "screening"
    ).length;
    const offer = candidates.filter((c) => c.status === "offer").length;
    return { total, applied, interview, offer };
  }, [candidates]);

  const getRecruitmentStatusLabel = (status) => {
    const labels = {
      applied: "Ứng tuyển",
      screening: "Sàng lọc",
      interview: "Phỏng vấn",
      offer: "Đề nghị",
    };
    return labels[status] || status || "—";
  };

  const getRecruitmentBadgeStyle = (status) => {
    switch (status) {
      case "applied":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "screening":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "interview":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "offer":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSearch = () => {
    setSearchSkill(searchSkillInput);
    setSearchExp(searchExpInput);
    setFilterStatus(filterStatusInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchSkillInput("");
    setSearchExpInput("");
    setFilterStatusInput("all");
    setSearchSkill("");
    setSearchExp("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const handleQuickStatusFilter = (status) => {
    const nextStatus = filterStatus === status ? "all" : status;
    setFilterStatusInput(nextStatus);
    setFilterStatus(nextStatus);
    setCurrentPage(1);
  };

  const handleAvatarHover = async (e, candidateId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setHoveredCandidateId(candidateId);

    try {
      const res = await candidateService.getById(candidateId);
      setHoveredCandidateData(res.candidate);
    } catch (error) {
      console.error("Error fetching candidate detail:", error);
    }
  };

  const handleAvatarLeave = () => {
    setHoveredCandidateId(null);
    setHoveredCandidateData(null);
  };

  const handleNavigateEmail = () => {
    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một ứng viên để gửi email!");
      return;
    }
    navigate("/candidates/emails", {
      state: { selectedCandidateIds: selectedIds },
    });
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary uppercase tracking-wider mb-0.5">
            <Users className="size-3.5" />
            <span>Hệ thống tuyển dụng thông minh</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Quản lý ứng viên
          </h1>
          <p className="text-xs text-subtle mt-0.5">
            Sàng lọc hồ sơ, theo dõi trạng thái ứng viên và điều phối phỏng vấn tập trung.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => navigate("/upload-cv")}
            className="rounded-sm bg-primary hover:bg-brand-dark text-white font-medium text-xs gap-1.5 h-8 px-3.5 shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>Thêm hồ sơ CV</span>
          </Button>
          <Button
            size="sm"
            onClick={handleNavigateEmail}
            variant={selectedIds.length > 0 ? "default" : "outline"}
            className={`rounded-sm font-medium text-xs gap-1.5 h-8 px-3.5 shadow-2xs transition-all ${
              selectedIds.length > 0
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                : "border-border text-subtle hover:text-ink hover:bg-slate-50"
            }`}
          >
            <Mail className="size-3.5" />
            <span>Gửi email {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary Cards - Compact Density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: All */}
        <div
          onClick={() => handleQuickStatusFilter("all")}
          className={`cursor-pointer px-3 py-2.5 rounded-sm border transition-all ${
            filterStatus === "all"
              ? "bg-blue-50/70 border-primary shadow-2xs ring-1 ring-primary/20"
              : "bg-white border-border hover:border-slate-300 hover:shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-subtle">Tổng ứng viên</span>
            <div className="size-6 rounded-sm bg-blue-100 text-primary flex items-center justify-center">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-ink leading-tight">{stats.total}</span>
            <span className="text-[10px] text-muted-foreground">hồ sơ</span>
          </div>
        </div>

        {/* Card 2: Applied */}
        <div
          onClick={() => handleQuickStatusFilter("applied")}
          className={`cursor-pointer px-3 py-2.5 rounded-sm border transition-all ${
            filterStatus === "applied"
              ? "bg-blue-50/70 border-blue-500 shadow-2xs ring-1 ring-blue-500/20"
              : "bg-white border-border hover:border-slate-300 hover:shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-subtle">Mới ứng tuyển</span>
            <div className="size-6 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-blue-600 leading-tight">{stats.applied}</span>
            <span className="text-[10px] text-muted-foreground">chờ sàng lọc</span>
          </div>
        </div>

        {/* Card 3: Interviewing / Screening */}
        <div
          onClick={() => handleQuickStatusFilter("interview")}
          className={`cursor-pointer px-3 py-2.5 rounded-sm border transition-all ${
            filterStatus === "interview"
              ? "bg-emerald-50/70 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20"
              : "bg-white border-border hover:border-slate-300 hover:shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-subtle">Đang phỏng vấn</span>
            <div className="size-6 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-600 leading-tight">{stats.interview}</span>
            <span className="text-[10px] text-muted-foreground">đang xử lý</span>
          </div>
        </div>

        {/* Card 4: Offer */}
        <div
          onClick={() => handleQuickStatusFilter("offer")}
          className={`cursor-pointer px-3 py-2.5 rounded-sm border transition-all ${
            filterStatus === "offer"
              ? "bg-purple-50/70 border-purple-500 shadow-2xs ring-1 ring-purple-500/20"
              : "bg-white border-border hover:border-slate-300 hover:shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-subtle">Gửi đề nghị (Offer)</span>
            <div className="size-6 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-purple-600 leading-tight">{stats.offer}</span>
            <span className="text-[10px] text-muted-foreground">đạt yêu cầu</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar - Compact & Sleek */}
      <div className="p-2 sm:p-2.5 bg-white rounded-sm border border-border shadow-2xs space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          {/* Search Keyword (Skill / Name / Title) */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-hint pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm theo tên ứng viên, kỹ năng hoặc chức danh..."
              value={searchSkillInput}
              onChange={(e) => setSearchSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-sm pl-8 pr-2.5 bg-slate-50/50 border-border h-8 text-xs focus-visible:bg-white"
            />
          </div>

          {/* Search Experience */}
          <div className="relative w-full md:w-36 shrink-0">
            <Input
              type="number"
              min="0"
              placeholder="Năm kinh nghiệm..."
              value={searchExpInput}
              onChange={(e) => setSearchExpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-sm px-2.5 bg-slate-50/50 border-border h-8 text-xs focus-visible:bg-white"
            />
          </div>

          {/* Status Select */}
          <div className="w-full md:w-40 shrink-0">
            <Select
              value={filterStatusInput}
              onValueChange={(val) => setFilterStatusInput(val)}
            >
              <SelectTrigger size="sm" className="rounded-sm w-full bg-slate-50/50 border-border h-8 text-xs px-2.5">
                <SelectValue placeholder="Tất cả quy trình" />
              </SelectTrigger>
              <SelectContent className="rounded-sm">
                <SelectItem value="all" className="rounded-sm text-xs py-1.5">
                  Tất cả quy trình
                </SelectItem>
                <SelectItem value="applied" className="rounded-sm text-xs py-1.5">
                  Ứng tuyển
                </SelectItem>
                <SelectItem value="screening" className="rounded-sm text-xs py-1.5">
                  Sàng lọc
                </SelectItem>
                <SelectItem value="interview" className="rounded-sm text-xs py-1.5">
                  Phỏng vấn
                </SelectItem>
                <SelectItem value="offer" className="rounded-sm text-xs py-1.5">
                  Đề nghị
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter & Reset Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={handleSearch}
              className="rounded-sm bg-primary hover:bg-brand-dark text-white font-medium text-xs h-8 px-3 gap-1.5 shadow-2xs"
            >
              <Filter className="size-3" />
              <span>Tìm kiếm</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              title="Đặt lại bộ lọc"
              className="rounded-sm border-border bg-slate-50 hover:bg-slate-100 text-subtle h-8 px-2.5 gap-1 text-xs"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Đặt lại</span>
            </Button>
          </div>
        </div>

        {/* Selected Items Notice & Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50/80 border border-blue-200/70 rounded-sm text-xs text-blue-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-medium">
              <span className="size-1.5 rounded-xs bg-primary inline-block" />
              <span>
                Đang chọn <strong>{selectedIds.length}</strong> ứng viên
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="rounded-sm h-6.5 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2"
              >
                Bỏ chọn
              </Button>
              <Button
                size="sm"
                onClick={handleNavigateEmail}
                className="rounded-sm h-6.5 bg-primary text-white hover:bg-brand-dark text-xs px-2.5 gap-1 shadow-2xs"
              >
                <Mail className="size-3" />
                Gửi email ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Accessible Table Container */}
      <div
        role="region"
        aria-label="Bảng quản lý danh sách ứng viên"
        tabIndex={0}
        className="overflow-x-auto w-full rounded-sm border border-border bg-white shadow-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40"
      >
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-subtle text-sm">
            <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            <p>Đang tải dữ liệu ứng viên...</p>
          </div>
        ) : (
          <Table className="w-full min-w-[760px]">
            <TableHeader className="bg-slate-50/90 sticky top-0 z-10 border-b border-border backdrop-blur-xs">
              <TableRow className="hover:bg-transparent">
                {/* Checkbox Column */}
                <TableHead scope="col" className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả ứng viên trên trang"
                    checked={isAllCurrentSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeCurrentSelected;
                    }}
                    onChange={toggleSelectAllCurrent}
                    className="size-4 rounded-xs accent-primary cursor-pointer align-middle"
                  />
                </TableHead>

                <TableHead scope="col" className="px-4 py-3.5 text-xs font-semibold text-subtle uppercase tracking-wider">
                  Ứng viên
                </TableHead>

                <TableHead scope="col" className="px-4 py-3.5 text-xs font-semibold text-subtle uppercase tracking-wider">
                  Chức danh
                </TableHead>

                <TableHead scope="col" className="px-4 py-3.5 text-xs font-semibold text-subtle uppercase tracking-wider">
                  Năm kinh nghiệm
                </TableHead>

                <TableHead scope="col" className="px-4 py-3.5 text-xs font-semibold text-subtle uppercase tracking-wider">
                  Ngày lưu
                </TableHead>

                <TableHead scope="col" className="px-4 py-3.5 text-xs font-semibold text-subtle uppercase tracking-wider">
                  Trạng thái
                </TableHead>

                <TableHead scope="col" className="px-4 py-3.5 text-xs font-semibold text-subtle uppercase tracking-wider text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-2">
                      <div className="size-12 rounded-sm bg-slate-100 flex items-center justify-center text-subtle mb-1">
                        <Users className="size-6 text-slate-400" />
                      </div>
                      <h3 className="font-semibold text-ink text-base">Không tìm thấy ứng viên nào</h3>
                      <p className="text-xs text-subtle">
                        Không có hồ sơ nào khớp với điều kiện tìm kiếm hoặc quy trình hiện tại. Hãy thử thay đổi bộ lọc.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="rounded-sm mt-2 text-xs border-border hover:bg-slate-50"
                      >
                        Xóa tất cả bộ lọc
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const jobName = c.jobTitle || getJobTitle(c.jobID);
                  const expYears = c.yearsOfExperience || c.experiences?.length || 0;

                  return (
                    <TableRow
                      key={c.id}
                      className={`border-b border-border/60 transition-colors group ${
                        isSelected
                          ? "bg-blue-50/40 hover:bg-blue-50/70"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="w-12 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Chọn ứng viên ${c.fullName}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="size-4 rounded-xs accent-primary cursor-pointer align-middle"
                        />
                      </TableCell>

                      {/* Candidate Avatar & Info */}
                      <TableCell
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="px-4 py-3 cursor-pointer"
                      >
                        <div
                          className="flex items-center gap-3"
                          onMouseEnter={(e) => handleAvatarHover(e, c.id)}
                          onMouseLeave={handleAvatarLeave}
                        >
                          <div className="size-9 rounded-sm bg-gradient-to-br from-[#0087f1] to-[#005bb5] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
                            {c.fullName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-ink group-hover:text-primary transition-colors truncate">
                              {c.fullName || "Chưa có tên"}
                            </span>
                            <span className="text-[11px] text-subtle truncate">
                              {c.email || c.personal?.email || `ID: ${c.id.substring(0, 8)}`}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Job Title */}
                      <TableCell
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="px-4 py-3 cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700">
                          <Briefcase className="size-3 text-slate-500" />
                          <span className="truncate max-w-[150px]">{jobName}</span>
                        </span>
                      </TableCell>

                      {/* Years of Experience */}
                      <TableCell
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="px-4 py-3 cursor-pointer text-xs font-medium text-subtle"
                      >
                        {expYears > 0 ? `${expYears} năm kinh nghiệm` : "Chưa có kinh nghiệm"}
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="px-4 py-3 cursor-pointer text-xs text-subtle"
                      >
                        {formatDate(c.appliedAt)}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="px-4 py-3 cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-xs font-semibold px-2 py-0.5 ${getRecruitmentBadgeStyle(
                            c.status
                          )}`}
                        >
                          {getRecruitmentStatusLabel(c.status)}
                        </Badge>
                      </TableCell>

                      {/* Quick Actions */}
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Xem chi tiết hồ sơ"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidates/${c.id}`);
                            }}
                            className="rounded-sm size-8 text-subtle hover:text-primary hover:bg-slate-100"
                          >
                            <Eye className="size-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Lên lịch phỏng vấn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidates/${c.id}/schedule`);
                            }}
                            className="rounded-sm size-8 text-subtle hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <Calendar className="size-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Phân tích AI chuyên sâu"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidates/${c.id}/ai-analysis`);
                            }}
                            className="rounded-sm size-8 text-subtle hover:text-purple-600 hover:bg-purple-50"
                          >
                            <Sparkles className="size-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Kiểm chứng GitHub & Portfolio"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidates/${c.id}/verify`);
                            }}
                            className="rounded-sm size-8 text-subtle hover:text-blue-600 hover:bg-blue-50"
                          >
                            <ShieldCheck className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="text-xs text-subtle">
          {filtered.length > 0 ? (
            <>
              Hiển thị{" "}
              <span className="font-semibold text-ink">
                {startIndex + 1} - {Math.min(endIndex, filtered.length)}
              </span>{" "}
              trên tổng số <span className="font-semibold text-ink">{filtered.length}</span> ứng viên
            </>
          ) : (
            "Hiển thị 0 ứng viên"
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-sm size-8 border-border text-subtle hover:text-ink disabled:opacity-40"
            title="Trang trước"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={`rounded-sm size-8 p-0 text-xs font-semibold ${
                page === currentPage
                  ? "bg-primary text-white hover:bg-brand-dark"
                  : "border-border text-subtle hover:text-primary hover:border-primary/50"
              }`}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-sm size-8 border-border text-subtle hover:text-ink disabled:opacity-40"
            title="Trang sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Quick Preview Dossier Tooltip */}
      {hoveredCandidateId && hoveredCandidateData && (
        <div
          className="fixed z-50 w-64 rounded-sm p-4 shadow-xl pointer-events-auto border border-slate-700 bg-slate-900/95 backdrop-blur-md text-white animate-in fade-in duration-150"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 12}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="size-12 rounded-sm bg-gradient-to-br from-[#0087f1] to-[#005bb5] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {hoveredCandidateData?.personal?.fullName?.charAt(0)?.toUpperCase() || "?"}
            </div>

            <p className="font-semibold text-sm text-white line-clamp-1">
              {hoveredCandidateData?.personal?.fullName || "Chưa có tên"}
            </p>

            <span className="text-[11px] text-slate-300 font-medium px-2 py-0.5 rounded-sm bg-white/10">
              {getJobTitle(hoveredCandidateData?.jobID)}
            </span>

            <div className="w-full pt-2 mt-1 border-t border-white/10 text-center">
              {hoveredCandidateData?.personal?.githubLink ? (
                <a
                  href={hoveredCandidateData?.personal?.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#00c6ff] hover:text-white hover:underline break-all max-w-[220px]"
                >
                  <ExternalLink className="size-3 shrink-0" />
                  <span className="truncate">{hoveredCandidateData?.personal?.githubLink}</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400">Chưa liên kết GitHub</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;
