import { CheckCircle2, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const SKELETON_KEYS = ["cv", "interview", "completion"];

const CARDS = [
  {
    key: "cv",
    icon: Users,
    badge: "Tích lũy",
    label: "Số lượng CV",
    hint: "Hồ sơ đã được tiếp nhận vào hệ thống",
    iconClass: "bg-sky-50 text-sky-600 border border-sky-200/70",
    badgeClass: "bg-sky-50/80 text-sky-700 border border-sky-200/70",
    lineClass: "bg-gradient-to-r from-sky-400 to-blue-600",
    hoverBorderClass: "hover:border-sky-300/80",
    dotClass: "bg-sky-500",
    metaTextClass: "text-sky-700",
  },
  {
    key: "interview",
    icon: Mail,
    badge: "Đã gửi",
    label: "Phỏng vấn",
    hint: "Lịch phỏng vấn đã gửi tới ứng viên",
    iconClass: "bg-amber-50 text-amber-600 border border-amber-200/70",
    badgeClass: "bg-amber-50/80 text-amber-700 border border-amber-200/70",
    lineClass: "bg-gradient-to-r from-amber-400 to-orange-500",
    hoverBorderClass: "hover:border-amber-300/80",
    dotClass: "bg-amber-500",
    metaTextClass: "text-amber-700",
  },
  {
    key: "completion",
    icon: CheckCircle2,
    badge: "Hiệu suất",
    label: "Hoàn thành",
    hint: "Tỷ lệ phỏng vấn đã hoàn thành",
    iconClass: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
    badgeClass: "bg-emerald-50/80 text-emerald-700 border border-emerald-200/70",
    lineClass: "bg-gradient-to-r from-emerald-400 to-teal-600",
    hoverBorderClass: "hover:border-emerald-300/80",
  },
];

const CARD_BASE =
  "group relative flex flex-col justify-between gap-2.5 overflow-hidden rounded-sm border border-border bg-white p-4 shadow-2xs transition-all duration-200 hover:shadow-xs";

const parsePercentage = (value) => {
  const num = parseFloat(String(value ?? "0").replace("%", "").trim());
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
};

const formatCount = (value) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num.toLocaleString("vi-VN") : String(value ?? 0);
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) return "0%";
  const str = String(value).trim();
  if (!str) return "0%";
  if (str.endsWith("%")) {
    const num = parseFloat(str.slice(0, -1).trim());
    return Number.isFinite(num) ? `${Math.round(num)}%` : "0%";
  }
  const num = parseFloat(str);
  return Number.isFinite(num) ? `${Math.round(num)}%` : "0%";
};

const StatsOverview = ({ stats = {}, loading }) => {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Đang tải thống kê"
      >
        {SKELETON_KEYS.map((key, index) => (
          <Card
            key={key}
            className={cn(
              CARD_BASE,
              "pointer-events-none animate-pulse",
              index === 2 && "sm:col-span-2 lg:col-span-1",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="size-9 rounded-sm bg-slate-200/75" />
              <span className="h-5 w-16 rounded-sm bg-slate-200/75" />
            </div>
            <div className="mt-1 space-y-2">
              <span className="block h-7 w-20 rounded-sm bg-slate-200/75" />
              <span className="block h-3.5 w-28 rounded-sm bg-slate-200/75" />
            </div>
            <span className="block h-2 w-full rounded-sm bg-slate-200/60" />
            <span className="mt-auto block h-3 w-3/4 rounded-sm bg-slate-200/75" />
          </Card>
        ))}
      </div>
    );
  }

  const totalCVsNum = Number(stats?.totalCVs ?? 0);
  const totalEmailsNum = Number(stats?.totalEmailsSent ?? 0);
  const completion = parsePercentage(stats?.responseRate);
  const interviewRate =
    Number.isFinite(totalCVsNum) && totalCVsNum > 0 && Number.isFinite(totalEmailsNum)
      ? Math.min(100, Math.max(0, Math.round((totalEmailsNum / totalCVsNum) * 100)))
      : null;

  const values = {
    cv: formatCount(stats?.totalCVs),
    interview: formatCount(stats?.totalEmailsSent),
    completion: formatPercentage(stats?.responseRate),
  };

  const metaLabels = {
    cv: totalCVsNum > 0 ? "Đang theo dõi toàn thời gian" : "Chưa có hồ sơ nào",
    interview:
      interviewRate !== null
        ? `Tỷ lệ mời phỏng vấn: ${interviewRate}% tổng CV`
        : "Chưa có lịch hẹn nào",
  };

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            className={cn(
              CARD_BASE,
              card.hoverBorderClass,
              index === 2 && "sm:col-span-2 lg:col-span-1",
            )}
          >
            {/* Colored micro top accent stripe */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 top-0 h-[2px] opacity-80 transition-opacity duration-200 group-hover:opacity-100",
                card.lineClass,
              )}
            />

            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-sm transition-transform duration-200 group-hover:scale-[1.03]",
                  card.iconClass,
                )}
                aria-hidden="true"
              >
                <Icon className="size-4.5" />
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
                  card.badgeClass,
                )}
              >
                {card.badge}
              </Badge>
            </div>

            <div className="mt-0.5">
              <p className="text-2xl font-extrabold leading-none tracking-tight text-ink sm:text-[1.75rem] [font-variant-numeric:tabular-nums]">
                {values[card.key]}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-slate-700 sm:text-[0.85rem]">
                {card.label}
              </p>
            </div>

            {/* Consistent height slot for indicator / progress bar */}
            <div className="flex h-5 items-center">
              {card.key === "completion" ? (
                <Progress
                  value={completion}
                  aria-label="Tỷ lệ hoàn thành"
                  className="h-1.5 w-full rounded-sm bg-slate-100 [&>[data-slot=progress-indicator]]:rounded-sm [&>[data-slot=progress-indicator]]:bg-emerald-600"
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-medium [font-variant-numeric:tabular-nums]",
                    card.metaTextClass,
                  )}
                >
                  <span
                    className={cn("size-1.5 shrink-0 rounded-xs", card.dotClass)}
                    aria-hidden="true"
                  />
                  <span className="truncate">{metaLabels[card.key]}</span>
                </div>
              )}
            </div>

            <p className="mt-auto text-[11px] leading-relaxed text-slate-500">
              {card.hint}
            </p>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
