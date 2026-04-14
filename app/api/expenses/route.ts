import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiResponse, Expense } from "@/types";

function getServiceRoleClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await getServiceRoleClient().auth.getUser(token);
    return user;
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Expense[]>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const supabase = getServiceRoleClient();
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        const category = searchParams.get("category");

        let query = supabase
            .from("expenses")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false });

        if (month && year) {
            const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
            query = query.gte("date", startDate).lte("date", endDate);
        }

        if (category) query = query.eq("category", category);

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({ success: true, data: data ?? [] });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Expense>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, amount, category, subcategory, mood, note, receipt_url, is_recurring, recurring_interval, date } = body;

        if (!title || !amount || !category || !date) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const supabase = getServiceRoleClient();
        const { data, error } = await supabase
            .from("expenses")
            .insert({
                user_id: user.id,
                title: title.trim(),
                amount: parseFloat(amount),
                category,
                subcategory: subcategory || null,
                mood: mood || null,
                note: note?.trim() || null,
                receipt_url: receipt_url || null,
                is_recurring: is_recurring ?? false,
                recurring_interval: recurring_interval || null,
                date,
            })
            .select()
            .single();

        if (error) throw error;

        // Update streak
        await fetch(`${req.nextUrl.origin}/api/streak`, {
            method: "POST",
            headers: { Authorization: req.headers.get("Authorization") ?? "" },
        }).catch(() => { });

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to create expense" },
            { status: 500 }
        );
    }
}
