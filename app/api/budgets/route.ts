import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiResponse, Budget } from "@/types";

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

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Budget[]>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month") || String(new Date().getMonth() + 1);
        const year = searchParams.get("year") || String(new Date().getFullYear());

        const { data, error } = await svc()
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)
            .eq("month", parseInt(month))
            .eq("year", parseInt(year));

        if (error) throw error;
        return NextResponse.json({ success: true, data: data ?? [] });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to get budgets" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Budget>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { category, amount, month, year } = await req.json();
        if (!category || !amount || !month || !year) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await svc()
            .from("budgets")
            .upsert(
                { user_id: user.id, category, amount: parseFloat(amount), month, year },
                { onConflict: "user_id,category,month,year" }
            )
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to create budget" },
            { status: 500 }
        );
    }
}
