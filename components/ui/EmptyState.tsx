"use client";
import { motion } from "framer-motion";
import GradientButton from "./GradientButton";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ emoji = "📭", title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-6xl mb-4"
      >
        {emoji}
      </motion.div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-6 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <GradientButton onClick={onAction} className="w-auto px-8 py-3 rounded-xl">
          {actionLabel}
        </GradientButton>
      )}
    </motion.div>
  );
}
