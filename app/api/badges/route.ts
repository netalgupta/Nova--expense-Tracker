import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiResponse, Badge } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Badge[]>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { data, error } = await svc().from("badges").select("*").eq("user_id", user.id).order("earned_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json({ success: true, data: data ?? [] });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to get badges" }, { status: 500 });
    }
}
