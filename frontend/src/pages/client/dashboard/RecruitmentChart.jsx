import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BarChart3, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="min-w-[168px] rounded-sm border border-border bg-white/95 p-2.5 text-xs shadow-md backdrop-blur-xs">
      <p className="mb-1.5 border-b border-border/60 pb-1 font-semibold text-ink">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const swatchColor =
            entry.dataKey === "blueValue"
              ? "#0087f1"
              : entry.dataKey === "orangeValue"
                ? "#f97316"
                : "#10b981";

          return (
            <div
              key={`${entry.dataKey || entry.name}-${idx}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span
                  className="size-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: swatchColor }}
                />
                {entry.name}
              </span>
              <span className="font-bold text-ink [font-variant-numeric:tabular-nums]">
                {Number.isFinite(Number(entry.value))
                  ? Number(entry.value).toLocaleString("vi-VN")
                  : (entry.value ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecruitmentChart = ({ data = [], loading, onViewReport, onUploadCV }) => {
  const hasData =
    Array.isArray(data) &&
    data.some(
      (item) =>
        (Number(item?.blueValue) || 0) > 0 ||
        (Number(item?.orangeValue) || 0) > 0 ||
        (Number(item?.grayValue) || 0) > 0,
    );

  return (
    <Card className="flex min-w-0 flex-col justify-between gap-0 rounded-sm border border-border bg-white p-4 shadow-2xs sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-ink sm:text-[0.95rem]">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-sm border border-sky-200/70 bg-sky-50 text-brand"
              aria-hidden="true"
            >
              <TrendingUp className="size-3.5" />
            </span>
            Nhịp tuyển dụng
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            CV tiếp nhận, lịch phỏng vấn và mức hoàn thành theo thời gian
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="group h-8 shrink-0 cursor-pointer gap-1.5 rounded-sm border-border bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-brand/40 hover:bg-sky-50/50 hover:text-brand"
          onClick={onViewReport}
        >
          <span>Xem báo cáo</span>
          <ArrowRight
            className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
            aria-hidden="true"
          />
        </Button>
      </div>

      {loading ? (
        <div
          className="mt-1 flex h-[280px] flex-1 animate-pulse items-center justify-center rounded-sm bg-slate-100/90 text-xs text-slate-400"
          aria-busy="true"
          aria-label="Đang tải biểu đồ nhịp tuyển dụng"
        >
          Đang tải dữ liệu biểu đồ...
        </div>
      ) : hasData ? (
        <>
          <div className="h-[280px] min-h-[260px] min-w-0 w-full flex-1 pt-1">
            <ResponsiveContainer
              width="100%"
              height={268}
              minWidth={0}
              minHeight={260}
            >
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 12, left: -4, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="dashboardCvBar"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#0087f1" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient
                    id="dashboardInterviewBar"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                    <stop
                      offset="100%"
                      stopColor="#fdba74"
                      stopOpacity={0.75}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  strokeOpacity={0.75}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  width={36}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey="blueValue"
                  name="CV tiếp nhận"
                  fill="url(#dashboardCvBar)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="orangeValue"
                  name="Lịch phỏng vấn"
                  fill="url(#dashboardInterviewBar)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={24}
                />
                <Line
                  type="monotone"
                  dataKey="grayValue"
                  name="Hoàn thành"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#10b981",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 4.5,
                    fill: "#10b981",
                    stroke: "#ffffff",
                    strokeWidth: 1.5,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div
            className="mt-3 flex flex-wrap items-center justify-center gap-5 border-t border-border/50 pt-2.5 text-xs text-slate-600"
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#0087f1]" />
              CV tiếp nhận
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#f97316]" />
              Lịch phỏng vấn
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 bg-[#10b981]" />
              Hoàn thành
            </span>
          </div>
        </>
      ) : (
        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center gap-2.5 rounded-sm border border-dashed border-border/80 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
          <span className="grid size-10 place-items-center rounded-sm border border-border bg-white text-slate-400">
            <BarChart3 className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">
              Chưa có dữ liệu biểu đồ
            </p>
            <p className="max-w-[34ch] text-[11px] leading-relaxed text-slate-500">
              Hãy tải lên CV hoặc tạo lịch phỏng vấn để theo dõi nhịp tuyển dụng
              theo thời gian.
            </p>
          </div>
          {onUploadCV && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 h-8 cursor-pointer gap-1.5 rounded-sm border-brand/30 bg-white px-3 text-xs font-semibold text-brand shadow-2xs hover:bg-sky-50 hover:text-brand-dark"
              onClick={onUploadCV}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Upload CV ngay
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default RecruitmentChart;
