import React from "react";
import { cn } from "@/lib/utils";

const AdminStatisticsKPICard = ({
  icon: Icon,
  title,
  value,
  unit = "",
  trend = null,
  color = "#0d6efd",
}) => {
  return (
    <div
      className="flex items-start gap-4 rounded-[10px] border-l-4 bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
      style={{ borderLeftColor: color }}
    >
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        {Icon && <Icon style={{ color }} size={24} />}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-[0.85rem] font-medium text-hint">{title}</p>
        <p className="flex items-baseline gap-2 text-[1.5rem] font-bold text-ink">
          {value.toLocaleString("vi-VN")}{" "}
          <span className="text-xs font-medium text-hint">{unit}</span>
        </p>
        {trend && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              trend.positive ? "text-[#198754]" : "text-[#dc3545]",
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminStatisticsKPICard;
