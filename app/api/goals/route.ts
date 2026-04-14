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

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Goal[]>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await svc()
            .from("goals")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data: data ?? [] });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to get goals" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Goal>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { title, target_amount, deadline, icon, color } = await req.json();
        if (!title || !target_amount) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await svc()
            .from("goals")
            .insert({
                user_id: user.id,
                title: title.trim(),
                target_amount: parseFloat(target_amount),
                deadline: deadline || null,
                icon: icon || "🎯",
                color: color || "#7C3AED",
            })
            .select()
            .single();

        if (error) throw error;

        // Award first_goal badge
        await svc().from("badges").upsert({ user_id: user.id, badge_type: "first_goal" }, { onConflict: "user_id,badge_type" });

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to create goal" },
            { status: 500 }
        );
    }
}
