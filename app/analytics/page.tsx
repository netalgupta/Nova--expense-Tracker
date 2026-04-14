"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { ExpenseSummary, Budget, CATEGORIES, Category } from "@/types";
import { formatCurrency, getCurrentMonthYear, getProgressColor, getCategoryColor } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import { ChartSkeleton, CardSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";
import { TrendingUp, Brain, Sliders } from "lucide-react";
import toast from "react-hot-toast";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface DailyData { date: string; total: number; label: string; }

function PredictiveCard({ token }: { token: string }) {
  const [data, setData] = useState<{ predicted_total: number; current_total: number; daily_average: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ai/predict", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (d.success) setData(d.data);
      } catch {}
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <CardSkeleton />;
  if (!data) return null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">AI Spend Prediction</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">Predicted month-end total</p>
          <p className="text-3xl font-black" style={{ color: "#06B6D4" }}>
            {formatCurrency(data.predicted_total)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Avg ₹{Math.round(data.daily_average).toLocaleString("en-IN")}/day · Currently ₹{data.current_total.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-4xl">🔮</div>
      </div>
    </GlassCard>
  );
}

function WhatIfSimulator({ token }: { token: string }) {
  const [category, setCategory] = useState<Category>("Food");
  const [reduction, setReduction] = useState(20);
  const [result, setResult] = useState<{ monthly_savings: number; savings_12_months: number; insight: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, reduction_percent: reduction }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch { toast.error("Simulation failed"); }
    setLoading(false);
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-white">What-If Simulator</span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["Food","Transport","Entertainment","Shopping"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat as Category)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: category === cat ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${category === cat ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"}`,
                color: category === cat ? "#A78BFA" : "#94A3B8",
              }}
            >
              {CATEGORIES.find(c => c.label === cat)?.emoji} {cat}
            </button>
          ))}
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Reduce by</span>
            <span className="font-bold text-violet-400">{reduction}%</span>
          </div>
          <input
            type="range" min="5" max="80" step="5" value={reduction}
            onChange={e => setReduction(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #7C3AED ${reduction}%, rgba(255,255,255,0.1) ${reduction}%)` }}
          />
        </div>

        <button
          onClick={simulate}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: loading ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.5)", border: "1px solid rgba(124,58,237,0.4)" }}
        >
          {loading ? "Simulating..." : "Run Simulation ✨"}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 space-y-2.5"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Monthly", value: result.monthly_savings },
              { label: "6 Months", value: result.monthly_savings * 6 },
              { label: "1 Year", value: result.savings_12_months },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-green-400">+₹{Math.round(value).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center italic">"{result.insight}"</p>
        </motion.div>
      )}
    </GlassCard>
  );
}

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<ExpenseSummary[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) setToken(session.access_token);
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [selectedMonth, token]);

  const fetchData = async () => {
    setLoading(true);
    const month = selectedMonth + 1;
    const headers = { Authorization: `Bearer ${token}` };

    const [summaryRes, budgetsRes, expensesRes] = await Promise.allSettled([
      fetch(`/api/expenses/summary?month=${month}&year=${selectedYear}`, { headers }).then(r => r.json()),
      fetch(`/api/budgets?month=${month}&year=${selectedYear}`, { headers }).then(r => r.json()),
      fetch(`/api/expenses?month=${month}&year=${selectedYear}`, { headers }).then(r => r.json()),
    ]);

    if (summaryRes.status === "fulfilled" && summaryRes.value.success) setSummary(summaryRes.value.data);
    if (budgetsRes.status === "fulfilled" && budgetsRes.value.success) setBudgets(budgetsRes.value.data);
    if (expensesRes.status === "fulfilled" && expensesRes.value.success) {
      const exps = expensesRes.value.data;
      const daysInMonth = new Date(selectedYear, month, 0).getDate();
      const dayMap: Record<string, number> = {};
      for (const e of exps) { dayMap[e.date] = (dayMap[e.date] || 0) + e.amount; }
      const daily = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(selectedYear, selectedMonth, i + 1);
        const key = d.toISOString().split("T")[0];
        return { date: key, total: dayMap[key] || 0, label: String(i + 1) };
      });
      setDailyData(daily);
    }
    setLoading(false);
  };

  const totalSpent = summary.reduce((acc, s) => acc + s.total, 0);
  const COLORS = CATEGORIES.map(c => c.color);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-xl p-2.5 text-xs">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-violet-400">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="page-content px-4 space-y-4">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-white pt-2">
          Analytics
        </motion.h1>

        {/* Month Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {MONTH_NAMES.map((m, i) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(i)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: selectedMonth === i ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${selectedMonth === i ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)"}`,
                color: selectedMonth === i ? "#A78BFA" : "#64748B",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Spending Donut */}
        {loading ? <ChartSkeleton /> : (
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white mb-4">Spending Breakdown</p>
            {summary.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No expenses this month</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={summary}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      dataKey="total" nameKey="category"
                      paddingAngle={3}
                    >
                      {summary.map((entry, i) => (
                        <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-lg font-black text-white -mt-2 mb-4">{formatCurrency(totalSpent)}</p>
                <div className="space-y-2">
                  {summary.sort((a, b) => b.total - a.total).map(s => {
                    const pct = totalSpent > 0 ? (s.total / totalSpent) * 100 : 0;
                    return (
                      <div key={s.category} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCategoryColor(s.category) }} />
                        <span className="text-xs text-slate-300 flex-1">{s.category}</span>
                        <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                        <span className="text-xs font-semibold text-white">{formatCurrency(s.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </GlassCard>
        )}

        {/* Daily Bar Chart */}
        {loading ? <ChartSkeleton /> : (
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white mb-4">Daily Spending</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? Math.round(v/1000) + "k" : v}`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Spent"]} labelFormatter={l => `Day ${l}`}
                  contentStyle={{ background: "#1A1F3A", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="total" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#5B21B6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* Budget Progress */}
        {loading ? <CardSkeleton /> : (
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white mb-4">Budget Progress</p>
            {summary.length === 0 ? (
              <p className="text-sm text-slate-500">No spending data</p>
            ) : (
              <div className="space-y-4">
                {summary.map(s => {
                  const budget = budgets.find(b => b.category === s.category);
                  const pct = budget ? (s.total / budget.amount) * 100 : 0;
                  const color = getProgressColor(pct);
                  const cat = CATEGORIES.find(c => c.label === s.category);
                  return (
                    <div key={s.category}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span>{cat?.emoji}</span>{s.category}
                        </span>
                        <span className="text-slate-400">
                          {formatCurrency(s.total)}{budget ? ` / ${formatCurrency(budget.amount)}` : " (no budget)"}
                        </span>
                      </div>
                      {budget && (
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <motion.div
                            className="h-1.5 rounded-full"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {/* AI Predictions & Simulator */}
        {token && (
          <>
            <PredictiveCard token={token} />
            <WhatIfSimulator token={token} />
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
