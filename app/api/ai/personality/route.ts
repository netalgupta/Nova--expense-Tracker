import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiFlash } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse, FinancialPersonality } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<FinancialPersonality>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Get 3 months of data
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const { data: expenses } = await svc()
            .from("expenses")
            .select("category, amount, date")
            .eq("user_id", user.id)
            .gte("date", threeMonthsAgo.toISOString().split("T")[0]);

        const summary: Record<string, number> = {};
        for (const e of expenses ?? []) {
            summary[e.category] = (summary[e.category] || 0) + parseFloat(e.amount);
        }

        const result = await geminiFlash.generateContent(PROMPTS.personality(JSON.stringify(summary)));
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const personality: FinancialPersonality = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { type: "Balanced Spender", emoji: "⚖️", traits: ["Analytical", "Consistent", "Mindful"], description: "You maintain a balanced approach to spending." };

        // Save to profile
        await svc().from("profiles").update({ financial_personality: `${personality.emoji} ${personality.type}`, personality_score: personality }).eq("id", user.id);

        return NextResponse.json({ success: true, data: personality });
    } catch (error) {
        return NextResponse.json({ success: false, error: "AI error" }, { status: 500 });
    }
}
