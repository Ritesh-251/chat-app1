import React from "react";
import { BRAND_GREEN, RADIUS } from "./mockData";

interface KPIProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

export function KPI({ title, value, icon }: KPIProps) {
  return (
    <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
      <div className="p-4 pb-2">
        <div className="text-sm text-neutral-500">{title}</div>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="text-2xl font-semibold">{value}</div>
        <div className={`p-2 ${RADIUS}`} style={{ backgroundColor: `${BRAND_GREEN}15` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
