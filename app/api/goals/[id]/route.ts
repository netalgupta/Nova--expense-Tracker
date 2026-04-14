import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiResponse, Goal } from "@/types";

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

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Goal>>> {
    try {
        const { id } = await context.params;
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { amount_to_add, saved_amount } = await req.json();
        const supabase = svc();

        let newSavedAmount: number;
        if (saved_amount !== undefined) {
            newSavedAmount = parseFloat(saved_amount);
        } else if (amount_to_add !== undefined) {
            const { data: goal } = await supabase
                .from("goals")
                .select("saved_amount, target_amount")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (!goal) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });
            newSavedAmount = parseFloat(goal.saved_amount) + parseFloat(amount_to_add);

            // Award badge if goal achieved
            if (newSavedAmount >= parseFloat(goal.target_amount)) {
                await supabase.from("badges").upsert(
                    { user_id: user.id, badge_type: "goal_achieved" },
                    { onConflict: "user_id,badge_type" }
                );
            }
        } else {
            return NextResponse.json({ success: false, error: "amount_to_add or saved_amount required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("goals")
            .update({ saved_amount: newSavedAmount })
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to update goal" },
            { status: 500 }
        );
    }
}
