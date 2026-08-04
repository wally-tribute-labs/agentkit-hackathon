import { DEMO_SCENARIOS } from "@/core/scenario";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    scenarios: DEMO_SCENARIOS.map(({ id, version, title, summary, locationLabel, durationMs, featured }) => ({
      id, version, title, summary, locationLabel, durationMs, featured,
    })),
  }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" } });
}
