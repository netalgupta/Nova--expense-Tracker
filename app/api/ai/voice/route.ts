import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiFlash } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse, VoiceExpense } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<VoiceExpense>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { transcript } = await req.json();
        if (!transcript) return NextResponse.json({ success: false, error: "Transcript required" }, { status: 400 });

        const today = new Date().toISOString().split("T")[0];
        const prompt = PROMPTS.voice(transcript).replace("today if not specified", `today is ${today}, use this if not specified`);

        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not parse expense from transcript");

        const expense: VoiceExpense = JSON.parse(jsonMatch[0]);
        if (!expense.date) expense.date = today;

        return NextResponse.json({ success: true, data: expense });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Could not parse voice input" }, { status: 500 });
    }
}
