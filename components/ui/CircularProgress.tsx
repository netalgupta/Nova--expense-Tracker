"use client";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export default function CircularProgress({
  percentage, size = 120, strokeWidth = 10, color = "#7C3AED",
  trackColor = "rgba(255,255,255,0.06)", children,
}: CircularProgressProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(Math.min(percentage, 100)), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedPct / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct < 60) return "#10B981";
    if (pct < 85) return "#F59E0B";
    return "#FF6B6B";
  };

  const dynamicColor = color === "dynamic" ? getColor(percentage) : color;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={dynamicColor} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s ease-in-out, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
