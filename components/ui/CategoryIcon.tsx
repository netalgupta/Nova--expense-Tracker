"use client";
import { Category, CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: Category;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function CategoryIcon({ category, size = "md", showLabel = false, selected = false, onClick }: CategoryIconProps) {
  const cat = CATEGORIES.find((c) => c.label === category);
  if (!cat) return null;

  const sizes = { sm: "w-8 h-8 text-base", md: "w-10 h-10 text-lg", lg: "w-14 h-14 text-2xl" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 group",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div
        className={cn(
          "rounded-xl flex items-center justify-center transition-all duration-200",
          sizes[size],
          selected ? "ring-2 ring-offset-1 ring-offset-transparent scale-110" : "opacity-80 hover:opacity-100"
        )}
        style={{
          background: selected ? `${cat.color}33` : "rgba(255,255,255,0.06)",
          borderColor: selected ? cat.color : "transparent",
          border: selected ? `1.5px solid ${cat.color}` : "1.5px solid rgba(255,255,255,0.08)",
          ringColor: cat.color,
        }}
      >
        <span role="img" aria-label={cat.label}>{cat.emoji}</span>
      </div>
      {showLabel && (
        <span className={cn("text-[10px] font-medium", selected ? "text-white" : "text-slate-500")}>
          {cat.label}
        </span>
      )}
    </button>
  );
}
