"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronRight } from "lucide-react";
import { Expense, CATEGORIES, MOODS } from "@/types";
import { formatCurrency, formatShortDate, getCategoryColor } from "@/lib/utils";
import { ExpenseSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import toast from "react-hot-toast";

interface RecentExpensesProps {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function ExpenseRow({ expense, onDelete }: { expense: Expense; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cat = CATEGORIES.find(c => c.label === expense.category);
  const mood = MOODS.find(m => m.label === expense.mood);
  const color = getCategoryColor(expense.category);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    onDelete(expense.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
      >
        {cat?.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-white truncate">{expense.title}</p>
          {mood && <span className="text-xs shrink-0">{mood.emoji}</span>}
        </div>
        <p className="text-xs text-slate-500">
          {formatShortDate(expense.date)} · {expense.category}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white">
          {formatCurrency(expense.amount)}
        </span>
        <AnimatePresence>
          {confirmDelete ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={handleDelete}
              className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg"
            >
              {deleting ? "..." : "Sure?"}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function RecentExpenses({ expenses, loading, onDelete, onAdd }: RecentExpensesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-white">Recent Expenses</span>
        <a href="/history" className="text-xs text-violet-400 font-medium flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <ExpenseSkeleton key={i} />)
        ) : expenses.length === 0 ? (
          <EmptyState
            emoji="💸"
            title="No expenses yet"
            description="Start tracking your spending"
            actionLabel="Add First Expense"
            onAction={onAdd}
          />
        ) : (
          <AnimatePresence>
            <div className="p-2">
              {expenses.map(exp => (
                <ExpenseRow key={exp.id} expense={exp} onDelete={onDelete} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
