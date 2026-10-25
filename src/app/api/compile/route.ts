import { NextRequest, NextResponse } from "next/server";
import { compileNaturalLanguageQuery } from "@/lib/tipping-point-compiler";

const BACKEND_URL = process.env.CATALYST_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = String(body.query || "Buy NVDA when AI news is bullish");
    const environment = body.environment === "LIVE" ? "LIVE" : "PAPER";
    const overridePlatformId = body.override_platform_id || undefined;
    const overrideNotionalUsd = body.override_notional_usd || undefined;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      const upstream = await fetch(`${BACKEND_URL}/api/v1/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          environment,
          override_platform_id: overridePlatformId,
          override_notional_usd: overrideNotionalUsd,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (upstream.ok) {
        const data = await upstream.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to deterministic local compiler when FastAPI is not running separately
    }

    const compiled = compileNaturalLanguageQuery(
      query,
      environment,
      overridePlatformId,
      overrideNotionalUsd
    );
    return NextResponse.json(compiled);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compile natural-language query", detail: String(err) },
      { status: 400 }
    );
  }
}
