"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  height?: string;
  width?: string;
}

export function Skeleton({ className, rounded = "md", height, width }: SkeletonProps) {
  const roundedMap = { sm: "rounded", md: "rounded-lg", lg: "rounded-2xl", full: "rounded-full" };
  return (
    <div
      className={cn("shimmer", roundedMap[rounded], className)}
      style={{ height, width }}
    />
  );
}

export function ExpenseSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10 shrink-0" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <Skeleton className="h-5 w-1/2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${75 + Math.random() * 25}%` }} />
      ))}
    </div>
  );
}

export function InsightSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 w-64 shrink-0 space-y-2">
      <Skeleton className="h-5 w-5" rounded="full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass rounded-2xl p-4">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            rounded="sm"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}
