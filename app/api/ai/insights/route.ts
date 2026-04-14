import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiFlash } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse } from "@/types";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function svc() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);
    if (!entry || entry.resetAt < now) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
        return true;
    }
    if (entry.count >= 10) return false;
    entry.count++;
    return true;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ insights: { text: string; type: string }[] }>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (!checkRateLimit(user.id)) {
            return NextResponse.json({ success: false, error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
        }

        // Get last 30 days expenses
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: expenses } = await svc()
            .from("expenses")
            .select("category, amount, date, mood")
            .eq("user_id", user.id)
            .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

        const summary: Record<string, number> = {};
        for (const e of expenses ?? []) {
            summary[e.category] = (summary[e.category] || 0) + parseFloat(e.amount);
        }
        const total = Object.values(summary).reduce((a, b) => a + b, 0);

        const result = await geminiFlash.generateContent(
            PROMPTS.insights(JSON.stringify({ summary, total, expense_count: expenses?.length ?? 0 }))
        );
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [
            { text: "Connect your spending data to unlock AI insights.", type: "info" },
        ];

        // Save insights
        const supabase = svc();
        await supabase.from("ai_insights").delete().eq("user_id", user.id);
        await supabase.from("ai_insights").insert(
            insights.map((ins: { text: string; type: string }) => ({
                user_id: user.id,
                insight_text: ins.text,
                insight_type: ins.type,
            }))
        );

        return NextResponse.json({ success: true, data: { insights } });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "AI error" },
            { status: 500 }
        );
    }
}
