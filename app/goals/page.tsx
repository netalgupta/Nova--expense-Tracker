"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Goal, Badge, BADGE_TYPES } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import CircularProgress from "@/components/ui/CircularProgress";
import GradientButton from "@/components/ui/GradientButton";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

const GOAL_EMOJIS = ["🎯","✈️","🏠","🚗","💻","📱","💍","🎓","🏋️","🎸","📸","🌴"];
const GOAL_COLORS = ["#7C3AED","#FF6B6B","#06B6D4","#10B981","#F59E0B","#EC4899","#8B5CF6","#F97316"];

function GoalCard({ goal, onAddFunds }: { goal: Goal; onAddFunds: (g: Goal) => void }) {
  const pct = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
  const daysLeft = goal.deadline
    ? Math.max(0, Math.round((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
    : null;
  const isComplete = pct >= 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-4 relative overflow-hidden"
    >
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), transparent)" }}
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-2xl">{goal.icon}</span>
          <p className="font-semibold text-white text-sm mt-1">{goal.title}</p>
          {daysLeft !== null && (
            <p className="text-xs text-slate-500">{daysLeft === 0 ? "Due today!" : `${daysLeft} days left`}</p>
          )}
        </div>
        <CircularProgress percentage={pct} size={64} strokeWidth={6} color={isComplete ? "#10B981" : (goal.color ?? "#7C3AED")}>
          <span className="text-xs font-bold text-white">{Math.round(pct)}%</span>
        </CircularProgress>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Saved: <span className="text-white font-semibold">{formatCurrency(goal.saved_amount)}</span></span>
          <span>Goal: <span className="text-white font-semibold">{formatCurrency(goal.target_amount)}</span></span>
        </div>
      </div>

      {!isComplete && (
        <button
          onClick={() => onAddFunds(goal)}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all"
          style={{
            background: `${goal.color ?? "#7C3AED"}33`,
            border: `1px solid ${goal.color ?? "#7C3AED"}55`,
          }}
        >
          + Add Funds
        </button>
      )}
      {isComplete && (
        <p className="text-center text-xs text-green-400 font-semibold">🎉 Goal Achieved!</p>
      )}
    </motion.div>
  );
}

function AddGoalModal({ onClose, onAdd }: { onClose: () => void; onAdd: (g: Partial<Goal>) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#7C3AED");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !target) { toast.error("Fill in title and amount"); return; }
    setLoading(true);
    await onAdd({ title, target_amount: parseFloat(target), deadline: deadline || undefined, icon, color });
    setLoading(false);
    onClose();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-3xl p-6"
        style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
        <h2 className="text-lg font-bold text-white mb-5">New Savings Goal</h2>
        <div className="space-y-3 mb-5">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title..." id="goal-title"
            className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm" />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
            <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target amount" id="goal-target"
              type="number" className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-4 py-3 text-white placeholder-slate-500 text-sm" />
          </div>
          <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" id="goal-deadline"
            className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-slate-400 text-sm" style={{ colorScheme: "dark" }} />

          <div>
            <p className="text-xs text-slate-400 mb-2">Icon</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {GOAL_EMOJIS.map(e => (
                <button key={e} onClick={() => setIcon(e)}
                  className="text-xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{ background: icon === e ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)", border: `1px solid ${icon === e ? "rgba(124,58,237,0.5)" : "transparent"}` }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Color</p>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{ background: c, transform: color === c ? "scale(1.2)" : "scale(1)", boxShadow: color === c ? `0 0 12px ${c}80` : "none" }} />
              ))}
            </div>
          </div>
        </div>
        <GradientButton onClick={handleSubmit} loading={loading} id="create-goal-btn">Create Goal</GradientButton>
      </motion.div>
    </>
  );
}

function AddFundsModal({ goal, onClose, onAdd }: { goal: Goal; onClose: () => void; onAdd: (amount: number) => Promise<void> }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!amount) return;
    setLoading(true);
    await onAdd(parseFloat(amount));
    setLoading(false);
    onClose();
  };
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-3xl p-6"
        style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
        <h2 className="text-lg font-bold text-white mb-2">Add Funds to {goal.title}</h2>
        <p className="text-xs text-slate-400 mb-4">{formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)} saved</p>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Amount to add" id="add-funds-amount"
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-4 py-3.5 text-white placeholder-slate-500" autoFocus />
        </div>
        <GradientButton onClick={handleSubmit} loading={loading} id="add-funds-submit">Add to Goal</GradientButton>
      </motion.div>
    </>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [token, setToken] = useState("");
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) setToken(session.access_token);
    })();
  }, []);

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const [goalsRes, badgesRes] = await Promise.allSettled([
      fetch("/api/goals", { headers }).then(r => r.json()),
      fetch("/api/badges", { headers }).then(r => r.json()),
    ]);
    if (goalsRes.status === "fulfilled" && goalsRes.value.success) setGoals(goalsRes.value.data);
    if (badgesRes.status === "fulfilled" && badgesRes.value.success) setBadges(badgesRes.value.data);
    setLoading(false);
  };

  const handleAddGoal = async (goal: Partial<Goal>) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(goal),
    });
    const data = await res.json();
    if (data.success) { setGoals(prev => [data.data, ...prev]); toast.success("Goal created! 🎯"); }
    else throw new Error(data.error);
  };

  const handleAddFunds = async (amount: number) => {
    if (!selectedGoal) return;
    const res = await fetch(`/api/goals/${selectedGoal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_to_add: amount }),
    });
    const data = await res.json();
    if (data.success) {
      setGoals(prev => prev.map(g => g.id === selectedGoal.id ? data.data : g));
      toast.success(`₹${amount.toLocaleString("en-IN")} added! 💰`);
      if (data.data.saved_amount >= data.data.target_amount) {
        toast.success("🎉 Goal achieved! Badge earned!", { duration: 4000 });
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="page-content px-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-white">Goals</motion.h1>
          <button id="add-goal-btn" onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs text-violet-400 font-medium py-2 px-3 rounded-xl border border-violet-500/30 hover:bg-violet-500/10 transition-all">
            <Plus className="w-3.5 h-3.5" /> New Goal
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState emoji="🎯" title="No goals yet" description="Set a savings goal and start tracking your progress"
            actionLabel="Create First Goal" onAction={() => setShowAdd(true)} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onAddFunds={g => setSelectedGoal(g)} />
            ))}
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-white px-1 mb-3">🏅 Earned Badges</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, i) => {
                const info = BADGE_TYPES[badge.badge_type];
                if (!info) return null;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.05, type: "spring" }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
                  >
                    <span className="text-lg">{info.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-violet-300">{info.label}</p>
                      <p className="text-[10px] text-slate-500">{info.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} onAdd={handleAddGoal} />}
        {selectedGoal && <AddFundsModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} onAdd={handleAddFunds} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
