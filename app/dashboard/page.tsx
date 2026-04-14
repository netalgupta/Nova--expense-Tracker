"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Expense, ExpenseSummary, AIInsight, Profile, Budget, StreakData } from "@/types";
import { getCurrentMonthYear } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";
import HeroCard from "@/components/dashboard/HeroCard";
import AIInsightsStrip from "@/components/dashboard/AIInsightsStrip";
import ExpenseDNA from "@/components/dashboard/ExpenseDNA";
import PersonalityBadge from "@/components/dashboard/PersonalityBadge";
import StreakCounter from "@/components/dashboard/StreakCounter";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import AddExpenseSheet from "@/components/expenses/AddExpenseSheet";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [token, setToken] = useState<string>("");
  const { month, year } = getCurrentMonthYear();

  const supabase = createClient();

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const t = await getToken();
    setToken(t);
    if (!t) return;

    const headers = { Authorization: `Bearer ${t}` };

    const [profileRes, expensesRes, summaryRes, insightsRes, budgetsRes, streakRes] = await Promise.allSettled([
      fetch(`/api/auth/profile`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`/api/expenses?month=${month}&year=${year}`, { headers }).then(r => r.json()),
      fetch(`/api/expenses/summary?month=${month}&year=${year}`, { headers }).then(r => r.json()),
      supabase.from("ai_insights").select("*").order("generated_at", { ascending: false }).limit(3),
      fetch(`/api/budgets?month=${month}&year=${year}`, { headers }).then(r => r.json()),
      fetch(`/api/streak`, { headers }).then(r => r.json()),
    ]);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) setProfile(p);
    }

    if (expensesRes.status === "fulfilled" && expensesRes.value.success)
      setExpenses(expensesRes.value.data);
    if (summaryRes.status === "fulfilled" && summaryRes.value.success)
      setSummary(summaryRes.value.data);
    if (insightsRes.status === "fulfilled" && insightsRes.value.data)
      setInsights(insightsRes.value.data);
    if (budgetsRes.status === "fulfilled" && budgetsRes.value.success)
      setBudgets(budgetsRes.value.data);
    if (streakRes.status === "fulfilled" && streakRes.value.success)
      setStreak(streakRes.value.data);

    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefreshInsights = async () => {
    setInsightsLoading(true);
    try {
      const t = token || await getToken();
      const res = await fetch("/api/ai/insights", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.success) {
        setInsights(data.data.insights.map((ins: { text: string; type: string }, i: number) => ({
          id: String(i), user_id: "", insight_text: ins.text, insight_type: ins.type, generated_at: new Date().toISOString()
        })));
        toast.success("Insights refreshed!");
      }
    } catch { toast.error("Failed to refresh insights"); }
    setInsightsLoading(false);
  };

  const handleAnalyzePersonality = async () => {
    setAnalyzing(true);
    try {
      const t = token || await getToken();
      const res = await fetch("/api/ai/personality", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.success && profile) {
        setProfile({ ...profile, financial_personality: `${data.data.emoji} ${data.data.type}` });
        toast.success("Personality analyzed!");
      }
    } catch { toast.error("Analysis failed"); }
    setAnalyzing(false);
  };

  const handleAddExpense = async (expense: Partial<Expense>) => {
    const t = token || await getToken();
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempExpense = { ...expense, id: tempId, user_id: "", created_at: new Date().toISOString() } as Expense;
    setExpenses(prev => [tempExpense, ...prev]);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(expense),
    });
    const data = await res.json();
    if (data.success) {
      setExpenses(prev => prev.map(e => e.id === tempId ? data.data : e));
      setSummary(prev => {
        const existing = prev.find(s => s.category === expense.category);
        if (existing) return prev.map(s => s.category === expense.category ? { ...s, total: s.total + (expense.amount ?? 0) } : s);
        return [...prev, { category: expense.category!, total: expense.amount ?? 0, count: 1 }];
      });
      toast.success("Expense added! ✨");
    } else {
      setExpenses(prev => prev.filter(e => e.id !== tempId));
      throw new Error(data.error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    const t = token || await getToken();
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    if (data.success) toast.success("Expense deleted");
    else toast.error("Failed to delete");
  };

  const totalSpent = summary.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="page-content px-4 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between pt-2"
        >
          <div>
            <p className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-xl font-bold text-white">
              Hi, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-violet-500/50" />
            )}
          </div>
        </motion.div>

        {/* Hero Card */}
        <HeroCard
          totalSpent={totalSpent}
          monthlyBudget={profile?.monthly_budget ?? 10000}
          loading={loading}
        />

        {/* Streak */}
        <StreakCounter data={streak} loading={loading} />

        {/* AI Insights */}
        <AIInsightsStrip insights={insights} loading={insightsLoading} onRefresh={handleRefreshInsights} />

        {/* Expense DNA */}
        <ExpenseDNA summary={summary} loading={loading} />

        {/* Financial Personality */}
        <PersonalityBadge
          profile={profile}
          loading={loading}
          onAnalyze={handleAnalyzePersonality}
          analyzing={analyzing}
        />

        {/* Recent Expenses */}
        <RecentExpenses
          expenses={expenses.slice(0, 5)}
          loading={loading}
          onDelete={handleDeleteExpense}
          onAdd={() => setShowAddSheet(true)}
        />
      </div>

      {/* FAB */}
      <motion.button
        id="fab-add-expense"
        onClick={() => setShowAddSheet(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        whileTap={{ scale: 0.9 }}
        className="fixed z-30 fab-pulse"
        style={{
          bottom: "84px",
          right: "calc(50% - 210px + 16px)",
          width: 56, height: 56,
          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
          borderRadius: "18px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
        }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </motion.button>

      {/* Add Expense Sheet */}
      <AddExpenseSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={handleAddExpense}
        budgets={budgets}
        existingExpenses={expenses}
      />

      <BottomNav />
    </div>
  );
}
