import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const errorParam = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (errorParam) {
        const message = errorDescription ?? errorParam;
        return NextResponse.redirect(
            new URL(`/?error=oauth&message=${encodeURIComponent(message)}`, request.url)
        );
    }

    const code = requestUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/?error=auth", request.url));
    }

    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.session) {
        const message = error?.message ?? "auth";
        return NextResponse.redirect(
            new URL(`/?error=auth&message=${encodeURIComponent(message)}`, request.url)
        );
    }

    return response;
}