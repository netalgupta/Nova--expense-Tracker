import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiFlash } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse, PredictionResult } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<PredictionResult>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const daysInMonth = new Date(year, month, 0).getDate();
        const dayOfMonth = now.getDate();

        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const { data: expenses } = await svc()
            .from("expenses")
            .select("amount, date")
            .eq("user_id", user.id)
            .gte("date", startDate);

        const dailyMap: Record<string, number> = {};
        for (const e of expenses ?? []) {
            dailyMap[e.date] = (dailyMap[e.date] || 0) + parseFloat(e.amount);
        }
        const dailyTotals = Array.from({ length: dayOfMonth }, (_, i) => {
            const d = new Date(year, month - 1, i + 1).toISOString().split("T")[0];
            return dailyMap[d] || 0;
        });

        const currentTotal = dailyTotals.reduce((a, b) => a + b, 0);
        const dailyAvg = currentTotal / dayOfMonth;
        const predicted_total = Math.round(dailyAvg * daysInMonth);

        return NextResponse.json({
            success: true,
            data: { predicted_total, current_total: currentTotal, days_elapsed: dayOfMonth, days_in_month: daysInMonth, daily_average: dailyAvg },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: "AI error" }, { status: 500 });
    }
}
