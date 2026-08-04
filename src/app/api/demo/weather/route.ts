import { createScenarioResponse, getScenario } from "@/core/scenario";
import { demoWeatherQuerySchema } from "@/core/schemas";
import { apiError } from "@/server/errors";

export function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = demoWeatherQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "INVALID_QUERY", "Scenario and step parameters are invalid.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  const scenario = getScenario(parsed.data.scenario);
  if (!scenario) return apiError(404, "SCENARIO_NOT_FOUND", "The requested demo scenario does not exist.");
  if (parsed.data.step !== undefined && parsed.data.step >= scenario.events.length) {
    return apiError(400, "INVALID_STEP", `Step must be between 0 and ${scenario.events.length - 1}.`);
  }
  return Response.json(createScenarioResponse(scenario, parsed.data.step), {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" },
  });
}
