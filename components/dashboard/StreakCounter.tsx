"use client";
import { motion } from "framer-motion";
import { StreakData } from "@/types";
import GlassCard from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/SkeletonLoader";

interface StreakCounterProps {
  data: StreakData | null;
  loading?: boolean;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StreakCounter({ data, loading = false }: StreakCounterProps) {
  if (loading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="w-7 h-7 rounded-full" />)}
          </div>
        </div>
      </GlassCard>
    );
  }

  const streak = data?.streak_days ?? 0;
  const last7 = data?.last_7_days ?? Array(7).fill(false);
  const isHot = streak >= 7;

  // Align 7-day array to Mon-Sun (reverse to get today at end)
  const today = new Date().getDay();
  const shifted = [...last7];

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-3xl"
            animate={isHot ? { scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] } : {}}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
          >
            🔥
          </motion.span>
          <div>
            <p className="text-xl font-black text-white">
              {streak} day{streak !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-400">
              {streak === 0 ? "Start your streak today!" : streak >= 7 ? "You're on fire! 🎉" : "Keep it up!"}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-1">
          {shifted.map((active, i) => {
            const dayIndex = (today + i - 6 + 7) % 7;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.2 }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #7C3AED, #A855F7)"
                      : "rgba(255,255,255,0.05)",
                    border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {active ? "✓" : ""}
                </div>
                <span className="text-[9px] text-slate-500">
                  {DAY_LABELS[dayIndex]?.[0]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
