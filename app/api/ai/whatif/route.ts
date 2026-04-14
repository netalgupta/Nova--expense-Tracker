import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiFlash } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse, WhatIfResult, Category } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<WhatIfResult>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { category, reduction_percent } = await req.json() as { category: Category; reduction_percent: number };

        const now = new Date();
        const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const { data: expenses } = await svc()
            .from("expenses")
            .select("category, amount")
            .eq("user_id", user.id)
            .gte("date", startDate);

        const summary: Record<string, number> = {};
        for (const e of expenses ?? []) {
            summary[e.category] = (summary[e.category] || 0) + parseFloat(e.amount);
        }

        const categorySpend = summary[category] || 0;
        const monthly_savings = categorySpend * (reduction_percent / 100);

        const result = await geminiFlash.generateContent(
            PROMPTS.whatif(category, reduction_percent, JSON.stringify(summary))
        );
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        const data: WhatIfResult = {
            category,
            reduction_percent,
            monthly_savings: aiResult.monthly_savings ?? monthly_savings,
            savings_3_months: aiResult.savings_3_months ?? monthly_savings * 3,
            savings_6_months: aiResult.savings_6_months ?? monthly_savings * 6,
            savings_12_months: aiResult.savings_12_months ?? monthly_savings * 12,
            insight: aiResult.insight ?? `Reducing ${category} by ${reduction_percent}% saves ₹${Math.round(monthly_savings)}/month`,
        };

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "AI error" }, { status: 500 });
    }
}
