export type Category =
    | "Food"
    | "Transport"
    | "Entertainment"
    | "Shopping"
    | "Health"
    | "Education"
    | "Rent"
    | "Utilities"
    | "Travel"
    | "Other";

export type Mood = "Happy" | "Neutral" | "Stressed" | "Celebratory" | "Tired";

export type RecurringInterval = "daily" | "weekly" | "monthly" | "yearly";

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    financial_personality: string;
    personality_score: Record<string, unknown>;
    monthly_budget: number;
    currency: string;
    streak_days: number;
    last_logged_date: string | null;
    created_at: string;
}

export interface Expense {
    id: string;
    user_id: string;
    title: string;
    amount: number;
    category: Category;
    subcategory?: string;
    mood?: Mood;
    note?: string;
    receipt_url?: string;
    is_recurring: boolean;
    recurring_interval?: RecurringInterval;
    date: string;
    created_at: string;
}

export interface Budget {
    id: string;
    user_id: string;
    category: Category;
    amount: number;
    month: number;
    year: number;
    created_at: string;
}

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    target_amount: number;
    saved_amount: number;
    deadline?: string;
    icon?: string;
    color?: string;
    created_at: string;
}

export interface Badge {
    id: string;
    user_id: string;
    badge_type: string;
    earned_at: string;
}

export interface AIInsight {
    id: string;
    user_id: string;
    insight_text: string;
    insight_type?: string;
    generated_at: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ExpenseSummary {
    category: Category;
    total: number;
    count: number;
}

export interface DailySpending {
    date: string;
    total: number;
}

export interface PredictionResult {
    predicted_total: number;
    current_total: number;
    days_elapsed: number;
    days_in_month: number;
    daily_average: number;
}

export interface WhatIfResult {
    category: string;
    reduction_percent: number;
    monthly_savings: number;
    savings_3_months: number;
    savings_6_months: number;
    savings_12_months: number;
    insight: string;
}

export interface FinancialPersonality {
    type: string;
    emoji: string;
    traits: string[];
    description: string;
}

export interface VoiceExpense {
    title: string;
    amount: number;
    category: Category;
    date: string;
    note?: string;
}

export interface ReceiptData {
    merchant: string;
    amount: number;
    date: string;
    category: Category;
}

export interface Benchmark {
    category: string;
    peer_avg: number;
    user_amount: number;
    percentile: number;
    city: string;
    demographic: string;
}

export interface StreakData {
    streak_days: number;
    last_logged_date: string | null;
    last_7_days: boolean[];
}

export const CATEGORIES: { label: Category; emoji: string; color: string }[] = [
    { label: "Food", emoji: "🍔", color: "#F59E0B" },
    { label: "Transport", emoji: "🚗", color: "#06B6D4" },
    { label: "Entertainment", emoji: "🎮", color: "#8B5CF6" },
    { label: "Shopping", emoji: "🛍️", color: "#EC4899" },
    { label: "Health", emoji: "💊", color: "#10B981" },
    { label: "Education", emoji: "📚", color: "#3B82F6" },
    { label: "Rent", emoji: "🏠", color: "#FF6B6B" },
    { label: "Utilities", emoji: "⚡", color: "#6B7280" },
    { label: "Travel", emoji: "✈️", color: "#F97316" },
    { label: "Other", emoji: "💰", color: "#94A3B8" },
];

export const MOODS: { label: Mood; emoji: string }[] = [
    { label: "Happy", emoji: "😊" },
    { label: "Neutral", emoji: "😐" },
    { label: "Stressed", emoji: "😟" },
    { label: "Celebratory", emoji: "🎉" },
    { label: "Tired", emoji: "😴" },
];

export const BADGE_TYPES: Record<string, { label: string; emoji: string; description: string }> = {
    first_expense: { label: "First Step", emoji: "👶", description: "Logged your first expense" },
    streak_7: { label: "7 Day Streak", emoji: "🔥", description: "7 consecutive days of tracking" },
    streak_30: { label: "Month Master", emoji: "🏆", description: "30 consecutive days of tracking" },
    budget_master: { label: "Budget Master", emoji: "💎", description: "Stayed within budget all month" },
    first_goal: { label: "Goal Setter", emoji: "⭐", description: "Created your first savings goal" },
    goal_achieved: { label: "Goal Crusher", emoji: "🎯", description: "Achieved a savings goal" },
    saver: { label: "Super Saver", emoji: "🐷", description: "Saved 20% of budget this month" },
};
