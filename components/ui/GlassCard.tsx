"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({ children, className, onClick, hover = false, animate = true, delay = 0 }: GlassCardProps) {
  const Component = animate ? motion.div : "div";

  return (
    <Component
      {...(animate ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay, ease: "easeOut" },
      } : {})}
      onClick={onClick}
      className={cn(
        "glass rounded-2xl p-4",
        hover && "glass-hover cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}
