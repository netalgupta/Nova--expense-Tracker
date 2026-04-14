import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiResponse, ExpenseSummary } from "@/types";

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

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ExpenseSummary[]>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month") || String(new Date().getMonth() + 1);
        const year = searchParams.get("year") || String(new Date().getFullYear());

        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

        const { data, error } = await svc()
            .from("expenses")
            .select("category, amount")
            .eq("user_id", user.id)
            .gte("date", startDate)
            .lte("date", endDate);

        if (error) throw error;

        const summary: Record<string, ExpenseSummary> = {};
        for (const row of data ?? []) {
            if (!summary[row.category]) {
                summary[row.category] = { category: row.category, total: 0, count: 0 };
            }
            summary[row.category].total += parseFloat(row.amount);
            summary[row.category].count++;
        }

        return NextResponse.json({ success: true, data: Object.values(summary) });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to get summary" },
            { status: 500 }
        );
    }
}
