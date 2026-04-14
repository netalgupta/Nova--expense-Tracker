"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { AIInsight } from "@/types";
import { InsightSkeleton } from "@/components/ui/SkeletonLoader";

interface AIInsightsStripProps {
  insights: AIInsight[];
  loading: boolean;
  onRefresh: () => void;
}

const typeColors: Record<string, { border: string; bg: string; icon: string }> = {
  warning: { border: "rgba(255,107,107,0.4)", bg: "rgba(255,107,107,0.06)", icon: "⚠️" },
  tip: { border: "rgba(124,58,237,0.4)", bg: "rgba(124,58,237,0.06)", icon: "💡" },
  info: { border: "rgba(6,182,212,0.4)", bg: "rgba(6,182,212,0.06)", icon: "📊" },
  success: { border: "rgba(16,185,129,0.4)", bg: "rgba(16,185,129,0.06)", icon: "✅" },
};

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const colors = typeColors[insight.insight_type ?? "info"] ?? typeColors.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => setExpanded(!expanded)}
      className="rounded-2xl p-4 w-64 shrink-0 cursor-pointer"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
          <p className={`text-sm text-white font-medium ${!expanded ? "line-clamp-2" : ""}`}>
            {insight.insight_text}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {new Date(insight.generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </p>
    </motion.div>
  );
}

export default function AIInsightsStrip({ insights, loading, onRefresh }: AIInsightsStripProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">AI Insights</span>
        </div>
        <button
          id="refresh-insights-btn"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-violet-400 font-medium py-1 px-2 rounded-lg hover:bg-violet-500/10 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <InsightSkeleton key={i} />)
          : insights.length > 0
            ? insights.map((ins, i) => <InsightCard key={ins.id} insight={ins} index={i} />)
            : (
              <div className="rounded-2xl p-4 w-full text-center text-slate-400 text-sm"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px dashed rgba(124,58,237,0.3)" }}>
                <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                Tap Refresh to generate AI insights
              </div>
            )}
      </div>
    </div>
  );
}
