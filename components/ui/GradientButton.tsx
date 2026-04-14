"use client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: "violet" | "coral" | "ghost";
  id?: string;
}

export default function GradientButton({
  children, onClick, loading = false, disabled = false,
  className, type = "button", variant = "violet", id,
}: GradientButtonProps) {
  const gradients = {
    violet: "from-violet-600 to-violet-500",
    coral: "from-rose-500 to-orange-400",
    ghost: "from-white/5 to-white/10 border border-white/10",
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "btn-violet flex items-center justify-center gap-2 px-6 w-full text-sm font-semibold transition-all select-none",
        `bg-gradient-to-r ${gradients[variant]}`,
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </motion.button>
  );
}
