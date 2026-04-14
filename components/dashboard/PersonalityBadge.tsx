"use client";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { Profile } from "@/types";
import { Skeleton } from "@/components/ui/SkeletonLoader";

interface PersonalityBadgeProps {
  profile: Profile | null;
  loading?: boolean;
  onAnalyze: () => void;
  analyzing: boolean;
}

export default function PersonalityBadge({ profile, loading = false, onAnalyze, analyzing }: PersonalityBadgeProps) {
  if (loading) {
    return (
      <GlassCard>
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </GlassCard>
    );
  }

  const personality = profile?.financial_personality ?? "Analyzing...";
  const isAnalyzing = personality === "Analyzing...";
  const [emoji, ...nameParts] = personality.split(" ");
  const name = nameParts.join(" ");

  return (
    <GlassCard>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Financial Personality</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(255,107,107,0.2))",
              border: "1px solid rgba(124,58,237,0.4)",
            }}
          >
            {isAnalyzing ? "🔮" : emoji}
          </motion.div>
          <div>
            <p className="font-bold text-white text-base">
              {isAnalyzing ? "Not yet analyzed" : name}
            </p>
            <p className="text-xs text-slate-400">
              {isAnalyzing ? "Add expenses to analyze" : "Based on 3 months of spending"}
            </p>
          </div>
        </div>

        <motion.button
          id="analyze-personality-btn"
          onClick={onAnalyze}
          disabled={analyzing}
          whileTap={{ scale: 0.95 }}
          className="text-xs text-violet-400 font-medium py-1.5 px-3 rounded-lg border border-violet-500/30 hover:bg-violet-500/10 transition-all disabled:opacity-50"
        >
          {analyzing ? "..." : "Analyze"}
        </motion.button>
      </div>
    </GlassCard>
  );
}
