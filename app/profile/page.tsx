"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Edit2, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, CATEGORIES, Category, Badge, BADGE_TYPES } from "@/types";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import { Skeleton, CardSkeleton } from "@/components/ui/SkeletonLoader";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [token, setToken] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      setToken(session.access_token);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (p) { setProfile(p); setNewBudget(String(p.monthly_budget)); }
      }

      const badgesRes = await fetch("/api/badges", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const badgesData = await badgesRes.json();
      if (badgesData.success) setBadges(badgesData.data);

      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out!");
    router.push("/");
  };

  const handleSaveBudget = async () => {
    if (!newBudget || !profile) return;
    setSavingBudget(true);
    const { error } = await supabase
      .from("profiles")
      .update({ monthly_budget: parseFloat(newBudget) })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, monthly_budget: parseFloat(newBudget) });
      setEditingBudget(false);
      toast.success("Budget updated!");
    } else toast.error("Failed to update budget");
    setSavingBudget(false);
  };

  const handleExport = async () => {
    if (!token) return;
    const res = await fetch("/api/expenses", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!data.success) return;
    const csv = ["Date,Title,Category,Amount,Mood,Note",
      ...data.data.map((e: any) => `${e.date},"${e.title}",${e.category},${e.amount},${e.mood ?? ""},${e.note ?? ""}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "nova-all-expenses.csv"; a.click();
    toast.success("All data exported!");
  };

  if (loading) {
    return (
      <div className="min-h-screen page-content px-4 space-y-4" style={{ background: "#0A0E1A" }}>
        <Skeleton className="h-7 w-32 mt-2" />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      <div className="page-content px-4 space-y-4">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-white pt-2">Profile</motion.h1>

        {/* Avatar + Info */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl border-2 border-violet-500/40" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-2xl">
                {profile?.full_name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-white">{profile?.full_name}</p>
              <p className="text-sm text-slate-400">{profile?.email}</p>
              <p className="text-xs text-violet-400 mt-1">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Financial Personality */}
        {profile?.financial_personality && profile.financial_personality !== "Analyzing..." && (
          <GlassCard className="p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-3">Financial Personality</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{profile.financial_personality.split(" ")[0]}</div>
              <div>
                <p className="font-bold text-white">{profile.financial_personality.split(" ").slice(1).join(" ")}</p>
                {(profile.personality_score as any)?.traits && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {((profile.personality_score as any).traits as string[]).map((t: string) => (
                      <span key={t} className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Monthly Budget */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Monthly Budget</p>
            {!editingBudget ? (
              <button id="edit-budget-btn" onClick={() => setEditingBudget(true)}
                className="text-xs text-violet-400 flex items-center gap-1 hover:text-violet-300 transition-all">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingBudget(false)} className="text-slate-400 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                <button id="save-budget-btn" onClick={handleSaveBudget} disabled={savingBudget} className="text-violet-400 hover:text-violet-300 transition-all">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">₹</span>
              <input value={newBudget} onChange={e => setNewBudget(e.target.value)} type="number" id="budget-input"
                className="flex-1 bg-white/5 border border-violet-500/30 rounded-xl px-3 py-2 text-white text-lg font-bold focus:border-violet-400 transition-all" autoFocus />
            </div>
          ) : (
            <p className="text-2xl font-black text-white">{formatCurrency(profile?.monthly_budget ?? 10000)}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">per month</p>
        </GlassCard>

        {/* Badges */}
        {badges.length > 0 && (
          <GlassCard className="p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-3">Achievements</p>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(badge => {
                const info = BADGE_TYPES[badge.badge_type];
                if (!info) return null;
                return (
                  <div key={badge.id} className="rounded-xl p-3 flex items-center gap-2"
                    style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-white">{info.label}</p>
                      <p className="text-[10px] text-slate-500">{new Date(badge.earned_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Actions */}
        <GlassCard className="p-5 space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Data & Account</p>
          <button id="export-all-btn" onClick={handleExport}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm text-white hover:bg-white/5 transition-all border border-white/[0.06]">
            <span>Export All Data (CSV)</span>
            <span className="text-slate-400">📥</span>
          </button>
          <button id="signout-btn" onClick={handleSignOut}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium hover:bg-rose-500/10 transition-all border border-rose-500/20"
            style={{ color: "#FF6B6B" }}>
            <span>Sign Out</span>
            <LogOut className="w-4 h-4" />
          </button>
        </GlassCard>

        <p className="text-center text-xs text-slate-600 pb-2">Nova v1.0 · Made with ❤️ · MIT License</p>
      </div>
      <BottomNav />
    </div>
  );
}
