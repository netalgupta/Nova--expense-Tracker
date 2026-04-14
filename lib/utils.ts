import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { Category, CATEGORIES } from "@/types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateStr: string): string {
    try {
        return format(parseISO(dateStr), "dd MMM yyyy");
    } catch {
        return dateStr;
    }
}

export function formatShortDate(dateStr: string): string {
    try {
        return format(parseISO(dateStr), "dd MMM");
    } catch {
        return dateStr;
    }
}

export function getCategoryColor(category: Category): string {
    return CATEGORIES.find((c) => c.label === category)?.color ?? "#94A3B8";
}

export function getCategoryEmoji(category: Category): string {
    return CATEGORIES.find((c) => c.label === category)?.emoji ?? "💰";
}

export function getProgressColor(percentage: number): string {
    if (percentage < 60) return "#10B981";
    if (percentage < 85) return "#F59E0B";
    return "#FF6B6B";
}

export function todayISO(): string {
    return new Date().toISOString().split("T")[0];
}

export function getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}
