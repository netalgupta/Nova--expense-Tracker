"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Filter, Trash2, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Expense, CATEGORIES, MOODS, Category, Mood } from "@/types";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import { ExpenseSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

type SortOption = "newest" | "oldest" | "highest" | "lowest";

export default function HistoryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filtered, setFiltered] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const PAGE_SIZE = 20;
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) { setToken(session.access_token); }
    })();
  }, []);

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/expenses", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { setExpenses(data.data); }
    setLoading(false);
  };

  useEffect(() => {
    let result = [...expenses];
    if (search) result = result.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== "All") result = result.filter(e => e.category === categoryFilter);
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "highest") return b.amount - a.amount;
      return a.amount - b.amount;
    });
    setFiltered(result);
    setPage(1);
  }, [expenses, search, categoryFilter, sortBy]);

  const handleDelete = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if ((await res.json()).success) toast.success("Deleted");
    else { fetchAll(); toast.error("Delete failed"); }
  };

  const exportCSV = () => {
    const headers = ["Date","Title","Category","Amount","Mood","Note"];
    const rows = filtered.map(e => [e.date, e.title, e.category, e.amount, e.mood ?? "", e.note ?? ""]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "nova-expenses.csv"; a.click();
    toast.success("CSV exported!");
  };

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const recurring = expenses.filter(e => e.is_recurring);
  const recurringGroups = recurring.reduce<Record<string, {expenses: Expense[]; total: number}>>((acc, e) => {
    if (!acc[e.title]) acc[e.title] = { expenses: [], total: 0 };
    acc[e.title].expenses.push(e);
    acc[e.title].total += e.amount;
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="page-content px-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-white">History</motion.h1>
          <button id="export-csv-btn" onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-violet-400 font-medium py-2 px-3 rounded-xl border border-violet-500/30 hover:bg-violet-500/10 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="search-expenses"
            type="search"
            placeholder="Search expenses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["All", ...CATEGORIES.map(c => c.label)] as (Category | "All")[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: categoryFilter === cat ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${categoryFilter === cat ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: categoryFilter === cat ? "#A78BFA" : "#64748B",
              }}
            >
              {cat === "All" ? "All" : `${CATEGORIES.find(c=>c.label===cat)?.emoji} ${cat}`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          {(["newest","oldest","highest","lowest"] as SortOption[]).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: sortBy === s ? "rgba(255,107,107,0.2)" : "rgba(255,255,255,0.05)",
                color: sortBy === s ? "#FF6B6B" : "#64748B",
                border: `1px solid ${sortBy === s ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-slate-500 px-1">{filtered.length} expense{filtered.length !== 1 ? "s" : ""}</p>
        )}

        {/* Expense List */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <ExpenseSkeleton key={i} />)
          ) : paged.length === 0 ? (
            <EmptyState emoji="🔍" title="No expenses found" description={search ? `No results for "${search}"` : "No expenses match your filters"} />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              <AnimatePresence>
                {paged.map((expense, i) => {
                  const cat = CATEGORIES.find(c => c.label === expense.category);
                  const mood = MOODS.find(m => m.label === expense.mood);
                  const color = getCategoryColor(expense.category);
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="flex items-center gap-3 px-4 py-3.5 group hover:bg-white/[0.02] transition-all"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                      >
                        {cat?.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-white truncate">{expense.title}</p>
                          {mood && <span className="text-xs">{mood.emoji}</span>}
                          {expense.is_recurring && <span className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">recurring</span>}
                        </div>
                        <p className="text-xs text-slate-500">{formatDate(expense.date)} · {expense.category}</p>
                        {expense.note && <p className="text-xs text-slate-600 truncate">{expense.note}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-white">{formatCurrency(expense.amount)}</span>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Load more */}
        {paged.length < filtered.length && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3 text-sm text-violet-400 font-medium glass rounded-xl hover:bg-white/5 transition-all"
          >
            Load more ({filtered.length - paged.length} remaining)
          </button>
        )}

        {/* Subscription Graveyard */}
        {Object.keys(recurringGroups).length > 0 && (
          <div>
            <p className="text-sm font-semibold text-white px-1 mb-3">📦 Subscription Graveyard</p>
            <GlassCard className="divide-y divide-white/[0.04] overflow-hidden p-0">
              {Object.entries(recurringGroups).map(([title, { expenses: exps, total }]) => (
                <div key={title} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-slate-500">{exps.length} payments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-400">{formatCurrency(total)}</p>
                    <p className="text-xs text-slate-500">total paid</p>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
