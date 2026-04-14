"use client";
import { motion } from "framer-motion";
import CircularProgress from "@/components/ui/CircularProgress";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { formatCurrency, getProgressColor } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/SkeletonLoader";

interface HeroCardProps {
  totalSpent: number;
  monthlyBudget: number;
  currency?: string;
  loading?: boolean;
}

export default function HeroCard({ totalSpent, monthlyBudget, currency = "INR", loading = false }: HeroCardProps) {
  const percentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  const remaining = monthlyBudget - totalSpent;
  const progressColor = getProgressColor(percentage);

  const getBgGradient = () => {
    if (percentage < 60) return "from-violet-900/30 to-green-900/20";
    if (percentage < 85) return "from-violet-900/30 to-yellow-900/20";
    return "from-violet-900/30 to-rose-900/30";
  };

  if (loading) {
    return (
      <GlassCard className="p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex items-center gap-6">
          <Skeleton className="w-28 h-28 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`bg-gradient-to-br ${getBgGradient()} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
        This Month's Spending
      </p>
      <div className="flex items-center gap-5">
        <CircularProgress percentage={percentage} size={110} strokeWidth={9} color="dynamic">
          <div className="text-center">
            <span className="text-lg font-bold text-white">{Math.round(percentage)}%</span>
          </div>
        </CircularProgress>

        <div className="flex-1">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-black text-white">
              ₹<AnimatedNumber value={totalSpent} formatter={(v) => new Intl.NumberFormat("en-IN").format(Math.round(v))} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">of ₹{new Intl.NumberFormat("en-IN").format(monthlyBudget)} budget</p>

          <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: progressColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          <p className="text-xs font-medium" style={{ color: progressColor }}>
            {remaining >= 0
              ? `₹${new Intl.NumberFormat("en-IN").format(Math.round(remaining))} remaining`
              : `₹${new Intl.NumberFormat("en-IN").format(Math.abs(Math.round(remaining)))} over budget`}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
