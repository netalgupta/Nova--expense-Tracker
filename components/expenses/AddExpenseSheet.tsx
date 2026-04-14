"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Mic, RotateCcw, AlertTriangle } from "lucide-react";
import { Category, Mood, CATEGORIES, MOODS, Expense, Budget } from "@/types";
import { todayISO, formatCurrency, getCategoryColor } from "@/lib/utils";
import GradientButton from "@/components/ui/GradientButton";
import toast from "react-hot-toast";

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Partial<Expense>) => Promise<void>;
  budgets: Budget[];
  existingExpenses?: Expense[];
}

export default function AddExpenseSheet({ isOpen, onClose, onAdd, budgets, existingExpenses = [] }: AddExpenseSheetProps) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [mood, setMood] = useState<Mood>("Neutral");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [listening, setListening] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => amountRef.current?.focus(), 400);
    } else {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    checkBudgetWarning();
  }, [amount, category]);

  const resetForm = () => {
    setAmount(""); setTitle(""); setCategory("Other"); setMood("Neutral");
    setDate(todayISO()); setNote(""); setIsRecurring(false); setBudgetWarning(null);
  };

  const checkBudgetWarning = () => {
    if (!amount || !category) { setBudgetWarning(null); return; }
    const now = new Date();
    const budget = budgets.find(b => b.category === category && b.month === now.getMonth() + 1 && b.year === now.getFullYear());
    if (!budget) { setBudgetWarning(null); return; }

    const currentSpend = existingExpenses
      .filter(e => {
        const d = new Date(e.date);
        return e.category === category && d.getMonth() + 1 === now.getMonth() + 1 && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, e) => acc + e.amount, 0);

    const newTotal = currentSpend + parseFloat(amount || "0");
    if (newTotal > budget.amount) {
      setBudgetWarning(`This will exceed your ${category} budget by ₹${Math.round(newTotal - budget.amount).toLocaleString("en-IN")}`);
    } else {
      setBudgetWarning(null);
    }
  };

  const handleTitleBlur = async () => {
    if (!title.trim() || categorizing) return;
    setCategorizing(true);
    try {
      const token = (await import("@/lib/supabase/client")).createClient().auth.getSession()
        .then(r => r.data.session?.access_token);
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token}` },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.success) setCategory(data.data.category);
    } catch { }
    setCategorizing(false);
  };

  const handleVoiceInput = async () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    setListening(true);
    recognition.start();
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      toast.loading("Parsing voice input...", { id: "voice" });
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch("/api/ai/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ transcript }),
        });
        const data = await res.json();
        if (data.success) {
          setTitle(data.data.title); setAmount(String(data.data.amount));
          setCategory(data.data.category); if (data.data.date) setDate(data.data.date);
          if (data.data.note) setNote(data.data.note);
          toast.success("Voice parsed!", { id: "voice" });
        } else throw new Error();
      } catch { toast.error("Could not parse voice", { id: "voice" }); }
    };
    recognition.onerror = () => { setListening(false); toast.error("Voice input failed"); };
  };

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    toast.loading("Scanning receipt...", { id: "scan" });
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch("/api/receipts/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image_base64: base64, mime_type: file.type }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.data.merchant) setTitle(data.data.merchant);
          if (data.data.amount) setAmount(String(data.data.amount));
          if (data.data.category) setCategory(data.data.category);
          if (data.data.date) setDate(data.data.date);
          toast.success("Receipt scanned!", { id: "scan" });
        } else throw new Error();
      };
      reader.readAsDataURL(file);
    } catch { toast.error("Scan failed", { id: "scan" }); }
    finally { setScanning(false); }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (!title.trim()) { toast.error("Enter an expense title"); return; }
    setLoading(true);
    try {
      await onAdd({ title: title.trim(), amount: parseFloat(amount), category, mood, note: note.trim(), date, is_recurring: isRecurring });
      onClose();
    } catch {
      toast.error("Failed to add expense");
    }
    setLoading(false);
  };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-3xl overflow-hidden"
            style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pb-6 max-h-[88vh] overflow-y-auto no-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Add Expense</h2>
                <div className="flex items-center gap-2">
                  {/* Receipt scan */}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptScan} id="receipt-input" />
                  <button
                    id="receipt-scan-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={scanning}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  {/* Voice input */}
                  <motion.button
                    id="voice-input-btn"
                    onClick={handleVoiceInput}
                    disabled={listening}
                    animate={listening ? { scale: [1, 1.2, 1], boxShadow: ["0 0 0 0 rgba(255,107,107,0)", "0 0 0 8px rgba(255,107,107,0.2)", "0 0 0 0 rgba(255,107,107,0)"] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-coral-400 hover:bg-rose-500/10 transition-all"
                    style={{ color: listening ? "#FF6B6B" : undefined }}
                  >
                    <Mic className="w-5 h-5" />
                  </motion.button>
                  <button onClick={onClose} className="p-2.5 rounded-xl text-slate-400 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-light text-slate-400">₹</span>
                  <input
                    ref={amountRef}
                    id="amount-input"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="text-5xl font-black text-center bg-transparent outline-none w-48 placeholder-slate-600"
                    style={{ color: numericAmount > 0 ? "#FF6B6B" : "#FF6B6B66" }}
                  />
                </div>
                {numericAmount > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(numericAmount)}
                  </p>
                )}
              </div>

              {/* Budget Warning */}
              <AnimatePresence>
                {budgetWarning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)" }}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-300">{budgetWarning}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title */}
              <div className="mb-4">
                <input
                  id="title-input"
                  type="text"
                  placeholder="What did you spend on?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 focus:bg-white/8 transition-all"
                />
                {categorizing && <p className="text-xs text-violet-400 mt-1.5 ml-1">✨ AI categorizing...</p>}
              </div>

              {/* Category */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium mb-2.5">Category</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.label}
                      onClick={() => setCategory(cat.label)}
                      className="flex flex-col items-center gap-1 shrink-0 transition-all"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                        style={{
                          background: category === cat.label ? `${cat.color}25` : "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${category === cat.label ? cat.color : "rgba(255,255,255,0.08)"}`,
                          transform: category === cat.label ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        {cat.emoji}
                      </div>
                      <span className="text-[9px] font-medium" style={{ color: category === cat.label ? cat.color : "#64748B" }}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium mb-2.5">Mood</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {MOODS.map(m => (
                    <button
                      key={m.label}
                      onClick={() => setMood(m.label)}
                      className="flex flex-col items-center gap-1 shrink-0"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                        style={{
                          background: mood === m.label ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${mood === m.label ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)"}`,
                          transform: mood === m.label ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        {m.emoji}
                      </div>
                      <span className="text-[9px] font-medium" style={{ color: mood === m.label ? "#A78BFA" : "#64748B" }}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Note */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-2">Date</p>
                  <input
                    id="date-input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-3 text-white text-sm focus:border-violet-500/50 transition-all"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-2">Note (optional)</p>
                  <input
                    id="note-input"
                    type="text"
                    placeholder="Any details..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-3 text-white placeholder-slate-500 text-sm focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Recurring */}
              <div className="flex items-center justify-between mb-5 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div>
                  <p className="text-sm font-medium text-white">Recurring expense</p>
                  <p className="text-xs text-slate-500">e.g. subscriptions, rent</p>
                </div>
                <button
                  id="recurring-toggle"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className="relative w-11 h-6 rounded-full transition-all"
                  style={{ background: isRecurring ? "rgba(124,58,237,0.8)" : "rgba(255,255,255,0.1)" }}
                >
                  <motion.div
                    animate={{ x: isRecurring ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              {/* Submit */}
              <GradientButton
                id="add-expense-submit"
                onClick={handleSubmit}
                loading={loading}
                className="py-4 rounded-2xl text-base"
              >
                Add Expense
              </GradientButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
