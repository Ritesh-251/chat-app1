import React from "react";
import { BRAND_GREEN, RADIUS } from "./mockData";

interface SidebarItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export function SidebarItem({ active, onClick, icon, label }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 ${RADIUS} text-sm mb-1 transition-colors
        ${active ? `bg-[${BRAND_GREEN}]` : "hover:bg-neutral-200"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
