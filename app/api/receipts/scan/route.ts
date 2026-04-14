import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiVision } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse, ReceiptData } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ReceiptData>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { image_base64, mime_type } = await req.json();
        if (!image_base64) return NextResponse.json({ success: false, error: "Image required" }, { status: 400 });

        const result = await geminiVision.generateContent([
            { inlineData: { data: image_base64, mimeType: mime_type || "image/jpeg" } },
            PROMPTS.receipt(),
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not parse receipt");
        const receipt: ReceiptData = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ success: true, data: receipt });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Receipt scan failed" }, { status: 500 });
    }
}
