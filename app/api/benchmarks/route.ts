import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Benchmark } from "@/types";

const BENCHMARK_DATA: Benchmark[] = [
    { category: "Food", peer_avg: 8500, user_amount: 0, percentile: 50, city: "Mumbai", demographic: "Age 20-30" },
    { category: "Transport", peer_avg: 3200, user_amount: 0, percentile: 50, city: "Mumbai", demographic: "Age 20-30" },
    { category: "Entertainment", peer_avg: 2100, user_amount: 0, percentile: 50, city: "Mumbai", demographic: "Age 20-30" },
    { category: "Shopping", peer_avg: 5600, user_amount: 0, percentile: 50, city: "Mumbai", demographic: "Age 20-30" },
    { category: "Health", peer_avg: 1800, user_amount: 0, percentile: 50, city: "Mumbai", demographic: "Age 20-30" },
];

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Benchmark[]>>> {
    try {
        const { searchParams } = new URL(req.url);
        // Accept user's category totals as query params to compute percentile
        const userTotals: Record<string, number> = {};
        for (const cat of BENCHMARK_DATA.map(b => b.category)) {
            const val = searchParams.get(cat.toLowerCase());
            if (val) userTotals[cat] = parseFloat(val);
        }

        const data = BENCHMARK_DATA.map((b) => {
            const userAmt = userTotals[b.category] ?? 0;
            const peerAvg = b.peer_avg;
            let percentile = 50;
            if (userAmt < peerAvg * 0.5) percentile = 85;
            else if (userAmt < peerAvg * 0.75) percentile = 70;
            else if (userAmt < peerAvg) percentile = 60;
            else if (userAmt < peerAvg * 1.25) percentile = 40;
            else if (userAmt < peerAvg * 1.5) percentile = 25;
            else percentile = 15;
            return { ...b, user_amount: userAmt, percentile };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to get benchmarks" }, { status: 500 });
    }
}
