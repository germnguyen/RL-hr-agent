import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar as CalendarIcon,
  ChevronRight,
  LayoutDashboard,
  Network,
  RefreshCw,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import reportService from "../../../services/client/reportService";
import StatsOverview from "./StatsOverview";
import RecruitmentChart from "./RecruitmentChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

const QUICK_ACTIONS = [
  {
    path: "/upload-cv",
    icon: Upload,
    title: "Upload CV",
    desc: "Tải hồ sơ ứng viên lên hệ thống",
    iconClass: "bg-sky-50 text-sky-600 border border-sky-200/70",
  },
  {
    path: "/candidates",
    icon: Users,
    title: "Quản lý ứng viên",
    desc: "Xem và cập nhật trạng thái hồ sơ",
    iconClass: "bg-amber-50 text-amber-600 border border-amber-200/70",
  },
  {
    path: "/jobs",
    icon: Briefcase,
    title: "Danh sách công việc",
    desc: "Quản lý tin tuyển dụng đang mở",
    iconClass: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const formatName = (name) => {
  if (typeof name !== "string") return "bạn";
  const trimmed = name.trim();
  if (!trimmed) return "bạn";
  return trimmed
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase());
};

const readUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [stats, setStats] = useState({
    totalCVs: 0,
    totalEmailsSent: 0,
    responseRate: "0%",
    chartData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const today = new Date();
  const weekday = WEEKDAYS[today.getDay()];
  const day = today.getDate();
  const monthYear = `Tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getStatistics("Toàn thời gian", "");
      if (!mountedRef.current) return;
      if (res && res.success) {
        setStats({
          totalCVs: res.data?.totalCVs ?? 0,
          totalEmailsSent: res.data?.totalEmailsSent ?? 0,
          responseRate: res.data?.responseRate ?? "0%",
          chartData: Array.isArray(res.data?.chartData) ? res.data.chartData : [],
        });
      } else {
        setError("Không thể tải dữ liệu thống kê tuyển dụng.");
      }
    } catch (err) {
      console.error("Lỗi khi tải thống kê tổng quan:", err);
      if (mountedRef.current) {
        setError("Không thể kết nối máy chủ để tải dữ liệu thống kê.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  // Real-time synchronization: cross-tab storage sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "hr-agent-sync") {
        try {
          const syncData = JSON.parse(e.newValue);
          if (syncData && syncData.type === "candidate-status-changed") {
            fetchStats();
          }
        } catch (err) {
          console.error("Error parsing hr-agent-sync data:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchStats]);

  // Real-time synchronization: same-tab custom event
  useEffect(() => {
    const handleCustomEvent = () => {
      fetchStats();
    };

    window.addEventListener("candidate-status-changed", handleCustomEvent);
    return () => {
      window.removeEventListener("candidate-status-changed", handleCustomEvent);
    };
  }, [fetchStats]);

  return (
    <div className="space-y-3.5 duration-300 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      {/* Header Greeting Banner */}
      <section className="relative isolate flex items-center justify-between gap-6 overflow-hidden rounded-sm border border-slate-800/80 px-5 py-4.5 text-white shadow-xs [background:radial-gradient(90%_140%_at_90%_10%,rgba(14,165,233,0.28),transparent_58%),radial-gradient(60%_100%_at_75%_110%,rgba(59,130,246,0.18),transparent_60%),linear-gradient(135deg,#0a1122_0%,#0f1b35_55%,#132954_100%)] sm:px-6 sm:py-5 max-md:flex-col max-md:items-start max-md:gap-4">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(75%_100%_at_80%_20%,#000_0%,transparent_75%)]"
        />

        <div className="w-full min-w-0 max-w-[640px]">
          <Badge
            variant="outline"
            className="mb-2 gap-1.5 rounded-sm border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-sky-200"
          >
            <LayoutDashboard className="size-3" aria-hidden="true" />
            Bảng điều khiển
          </Badge>

          <h1 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
            {getGreeting()}, {formatName(user?.fullName)}
          </h1>

          <p className="mt-1 max-w-[56ch] text-xs leading-relaxed text-sky-100/75 sm:text-[0.85rem]">
            Đây là tình hình tuyển dụng của bạn hôm nay. Theo dõi chỉ số, xử lý
            hồ sơ mới và giữ quy trình luôn chuyển động.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              className="h-8.5 cursor-pointer gap-2 rounded-sm bg-white px-3.5 text-xs font-semibold text-slate-900 shadow-xs transition hover:bg-sky-50 focus-visible:ring-sky-300/60 has-[>svg]:px-3.5"
              onClick={() => navigate("/upload-cv")}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Upload CV
            </Button>

            <Button
              type="button"
              variant="outline"
              className="group h-8.5 cursor-pointer gap-2 rounded-sm border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white shadow-xs backdrop-blur-xs transition hover:border-white/30 hover:bg-white/15 hover:text-white focus-visible:ring-sky-300/60 has-[>svg]:px-3.5"
              onClick={() => navigate("/recruitment")}
            >
              <Network className="size-3.5" aria-hidden="true" />
              Quy trình tuyển dụng
              <ArrowRight
                className="size-3.5 text-sky-200 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        {/* Date Calendar Widget */}
        <div
          className="relative flex w-[148px] shrink-0 flex-col overflow-hidden rounded-sm border border-white/15 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md max-md:w-full max-md:flex-row max-md:items-center max-md:justify-between max-md:px-4 max-md:py-2.5"
          aria-label={`Hôm nay: ${weekday}, ${day} ${monthYear}`}
        >
          {/* Calendar top accent header */}
          <div className="flex items-center justify-center gap-1.5 border-b border-white/10 bg-sky-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-200 max-md:border-b-0 max-md:bg-transparent max-md:p-0">
            <CalendarIcon className="size-3 text-sky-300 max-md:hidden" aria-hidden="true" />
            <span>{weekday}</span>
          </div>

          {/* Calendar date body */}
          <div className="flex flex-col items-center justify-center px-4 py-2.5 text-center max-md:flex-row max-md:gap-3 max-md:p-0">
            <span className="text-3xl font-extrabold leading-none tracking-tight text-white [font-variant-numeric:tabular-nums] max-md:text-2xl">
              {day}
            </span>
            <span className="mt-1 text-[11px] font-medium text-sky-100/75 max-md:mt-0">
              {monthYear}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-red-200 bg-red-50/90 px-4 py-2.5 text-xs text-red-700"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <AlertCircle className="size-4 shrink-0 text-red-500" aria-hidden="true" />
            {error}
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 cursor-pointer gap-1.5 rounded-sm border-red-200 bg-white px-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={fetchStats}
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            Thử lại
          </Button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <StatsOverview stats={stats} loading={loading} />

      {/* Main Content Split: Chart + Quick Actions Sidebar */}
      <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-[minmax(0,1.75fr)_minmax(310px,1fr)]">
        <RecruitmentChart
          data={stats.chartData}
          loading={loading}
          onViewReport={() => navigate("/reports")}
          onUploadCV={() => navigate("/upload-cv")}
        />

        <Card className="flex min-w-0 flex-col justify-between gap-0 rounded-sm border border-border bg-white p-4 shadow-2xs sm:p-5">
          <div className="mb-3 border-b border-border/60 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-ink sm:text-[0.95rem]">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-sm border border-amber-200/70 bg-amber-50 text-amber-600"
                aria-hidden="true"
              >
                <Zap className="size-3.5" />
              </span>
              Truy cập nhanh
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Các thao tác bạn dùng nhiều nhất
            </p>
          </div>

          {/* 3 Quick Action Items from specification */}
          <div className="flex flex-col gap-2 max-lg:grid max-lg:grid-cols-3 max-sm:grid-cols-1">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  type="button"
                  className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm border border-border/70 bg-slate-50/40 px-3 py-2.5 text-left transition hover:border-brand/40 hover:bg-sky-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                  onClick={() => navigate(action.path)}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-sm transition-transform duration-200 group-hover:scale-[1.03]",
                        action.iconClass,
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-brand sm:text-[0.84rem]">
                        {action.title}
                      </span>
                      <span className="truncate text-[11px] text-slate-500">
                        {action.desc}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Kanban Workflow Callout Widget */}
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-sm border border-sky-100 bg-sky-50/50 p-3 max-lg:mt-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-sm border border-sky-200/80 bg-white text-brand shadow-2xs"
                aria-hidden="true"
              >
                <Network className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  Quy trình tuyển dụng
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  Kéo thả ứng viên trực quan
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 shrink-0 cursor-pointer gap-1 rounded-sm border-sky-200 bg-white px-2 text-[11px] font-semibold text-brand shadow-2xs transition hover:bg-sky-50 hover:text-brand-dark"
              onClick={() => navigate("/recruitment")}
            >
              <span>Mở bảng</span>
              <ArrowRight className="size-3" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
