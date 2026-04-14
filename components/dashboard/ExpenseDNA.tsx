"use client";
import { motion } from "framer-motion";
import { ExpenseSummary, CATEGORIES } from "@/types";
import GlassCard from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/SkeletonLoader";

interface ExpenseDNAProps {
  summary: ExpenseSummary[];
  loading?: boolean;
}

function getBlobPath(values: number[]): string {
  const normed = values.slice(0, 6);
  while (normed.length < 6) normed.push(0.2);
  const max = Math.max(...normed, 1);
  const cx = 80, cy = 80;
  const baseR = 45;

  const points = normed.map((v, i) => {
    const angle = (i / normed.length) * 2 * Math.PI - Math.PI / 2;
    const r = baseR * (0.4 + 0.6 * (v / max));
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const d = points.map((p, i) => {
    const next = points[(i + 1) % points.length];
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    return i === 0 ? `M ${mx} ${my}` : `Q ${p.x} ${p.y} ${mx} ${my}`;
  }).join(" ") + " Z";
  return d;
}

export default function ExpenseDNA({ summary, loading = false }: ExpenseDNAProps) {
  const top3 = summary.sort((a, b) => b.total - a.total).slice(0, 6);
  const total = top3.reduce((acc, s) => acc + s.total, 0);

  if (loading) {
    return (
      <GlassCard>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-40 h-40 rounded-full" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (top3.length === 0) {
    return (
      <GlassCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Expense DNA</p>
        <p className="text-sm text-slate-500 text-center py-4">Add expenses to see your spending DNA</p>
      </GlassCard>
    );
  }

  const values = top3.map(s => s.total);
  const blobPath = getBlobPath(values);

  const flatValues = top3.map(() => 0.4);
  const flatPath = getBlobPath(flatValues);

  return (
    <GlassCard>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Expense DNA</p>
      <div className="flex items-center gap-4">
        <div className="relative w-40 h-40 shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <radialGradient id="dnaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(124,58,237,0.6)" />
                <stop offset="60%" stopColor="rgba(124,58,237,0.3)" />
                <stop offset="100%" stopColor="rgba(255,107,107,0.2)" />
              </radialGradient>
            </defs>
            <motion.path
              d={flatPath}
              fill="url(#dnaGrad)"
              stroke="rgba(124,58,237,0.5)"
              strokeWidth="1.5"
              animate={{ d: blobPath }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {top3.slice(0, 3).map((s, i) => {
              const angle = (i / 3) * 2 * Math.PI - Math.PI / 2;
              const r = 65;
              const cat = CATEGORIES.find(c => c.label === s.category);
              const tx = 80 + r * Math.cos(angle);
              const ty = 80 + r * Math.sin(angle);
              return (
                <motion.text
                  key={s.category}
                  x={tx} y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="text-xs"
                  fontSize="14"
                >
                  {cat?.emoji}
                </motion.text>
              );
            })}
          </svg>
        </div>

        <div className="flex-1 space-y-2.5">
          {top3.slice(0, 4).map((s, i) => {
            const cat = CATEGORIES.find(c => c.label === s.category);
            const pct = total > 0 ? Math.round((s.total / total) * 100) : 0;
            return (
              <motion.div
                key={s.category}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.color }} />
                <span className="text-xs text-slate-300 flex-1 truncate">{s.category}</span>
                <span className="text-xs font-bold text-white">{pct}%</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
