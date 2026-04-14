import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geminiFlash } from "@/lib/gemini/client";
import { PROMPTS } from "@/lib/gemini/prompts";
import { ApiResponse, Category } from "@/types";

function svc() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { data: { user } } = await svc().auth.getUser(token);
    return user;
}

const cache = new Map<string, Category>();

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ category: Category }>>> {
    try {
        const user = await getAuthUser(req);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { title } = await req.json();
        if (!title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

        const cacheKey = title.toLowerCase().trim();
        if (cache.has(cacheKey)) {
            return NextResponse.json({ success: true, data: { category: cache.get(cacheKey)! } });
        }

        const result = await geminiFlash.generateContent(PROMPTS.categorize(title));
        const category = result.response.text().trim() as Category;
        const validCategories: Category[] = ["Food", "Transport", "Entertainment", "Shopping", "Health", "Education", "Rent", "Utilities", "Travel", "Other"];
        const finalCategory = validCategories.includes(category) ? category : "Other";

        cache.set(cacheKey, finalCategory);
        return NextResponse.json({ success: true, data: { category: finalCategory } });
    } catch (error) {
        return NextResponse.json({ success: false, error: "AI error" }, { status: 500 });
    }
}
