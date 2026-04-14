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

// ✅ FIXED PUT
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Expense>>> {
    try {
        const { id } = await context.params;

        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from("expenses")
            .update({
                title: body.title?.trim(),
                amount: body.amount ? parseFloat(body.amount) : undefined,
                category: body.category,
                subcategory: body.subcategory || null,
                mood: body.mood || null,
                note: body.note?.trim() || null,
                is_recurring: body.is_recurring,
                recurring_interval: body.recurring_interval || null,
                date: body.date,
            })
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to update expense" },
            { status: 500 }
        );
    }
}

// ✅ FIXED DELETE
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
    try {
        const { id } = await context.params;

        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from("expenses")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true, data: null });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to delete expense" },
            { status: 500 }
        );
    }
}