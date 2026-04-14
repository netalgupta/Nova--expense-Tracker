import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiResponse, StreakData } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<StreakData>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await svc().from("profiles").select("streak_days, last_logged_date").eq("id", user.id).single();
        if (!profile) return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });

        // Get last 7 days activity
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7.push(d.toISOString().split("T")[0]);
        }
        const { data: expenses } = await svc()
            .from("expenses")
            .select("date")
            .eq("user_id", user.id)
            .gte("date", last7[0]);

        const activeDays = new Set((expenses ?? []).map((e: { date: string }) => e.date));
        const last_7_days = last7.map((d) => activeDays.has(d));

        return NextResponse.json({
            success: true,
            data: { streak_days: profile.streak_days, last_logged_date: profile.last_logged_date, last_7_days },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to get streak" }, { status: 500 });
    }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ streak_days: number }>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const today = new Date().toISOString().split("T")[0];
        const supabase = svc();
        const { data: profile } = await supabase.from("profiles").select("streak_days, last_logged_date").eq("id", user.id).single();
        if (!profile) return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });

        if (profile.last_logged_date === today) {
            return NextResponse.json({ success: true, data: { streak_days: profile.streak_days } });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const newStreak = profile.last_logged_date === yesterdayStr ? profile.streak_days + 1 : 1;
        await supabase.from("profiles").update({ streak_days: newStreak, last_logged_date: today }).eq("id", user.id);

        // Award streak badges
        if (newStreak === 7) await supabase.from("badges").upsert({ user_id: user.id, badge_type: "streak_7" }, { onConflict: "user_id,badge_type" });
        if (newStreak === 30) await supabase.from("badges").upsert({ user_id: user.id, badge_type: "streak_30" }, { onConflict: "user_id,badge_type" });

        return NextResponse.json({ success: true, data: { streak_days: newStreak } });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update streak" }, { status: 500 });
    }
}
