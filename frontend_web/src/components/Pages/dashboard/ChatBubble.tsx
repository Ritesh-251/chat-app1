import React from "react";
import { BRAND_GREEN, RADIUS } from "./mockData";

interface ChatBubbleProps {
  who: "student" | "ai";
  text: string;
}

export function ChatBubble({ who, text }: ChatBubbleProps) {
  const isStudent = who === "student";
  return (
    <div className={`w-full flex ${isStudent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-3 py-2 text-sm ${RADIUS} border ${
          isStudent ? "bg-white border-neutral-200" : "text-white"
        }`}
        style={!isStudent ? { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN } : {}}
      >
        {text}
      </div>
    </div>
  );
}
