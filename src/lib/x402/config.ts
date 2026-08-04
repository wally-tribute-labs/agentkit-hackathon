import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { AgentWeatherResponse } from "@/core/types";
import { formatTestUsdc } from "@/core/pricing";
import { getRuntimeMode } from "@/server/config";

const BASE_SEPOLIA = "eip155:84532" as const;

interface X402Config {
  facilitatorUrl: string;
  payTo: `0x${string}`;
  network: typeof BASE_SEPOLIA;
}

export function readX402Config(): X402Config | null {
  const facilitatorUrl = process.env.X402_FACILITATOR_URL;
  const payTo = process.env.X402_PAY_TO;
  const network = process.env.X402_NETWORK;
  if (!facilitatorUrl || !payTo || !network) return null;
  if (facilitatorUrl !== "https://x402.org/facilitator") {
    throw new Error("X402_FACILITATOR_URL must be https://x402.org/facilitator for v1.");
  }
  if (network !== BASE_SEPOLIA) throw new Error("X402_NETWORK must be eip155:84532 (Base Sepolia).");
  if (!/^0x[a-fA-F0-9]{40}$/.test(payTo) || /^0x0{40}$/i.test(payTo)) {
    throw new Error("X402_PAY_TO must be a non-zero EVM address.");
  }
  return { facilitatorUrl, payTo: payTo as `0x${string}`, network: BASE_SEPOLIA };
}

export async function protectWeatherHandler(
  response: AgentWeatherResponse,
  priceMicroUsdc: number,
  request: NextRequest,
): Promise<NextResponse> {
  const config = readX402Config();
  if (!config) throw new Error("X402_DISABLED");
  const [core, evm, next, agentkit] = await Promise.all([
    import("@x402/core/server"),
    import("@x402/evm/exact/server"),
    import("@x402/next"),
    import("@worldcoin/agentkit"),
  ]);
  const server = new core.x402ResourceServer(
    new core.HTTPFacilitatorClient({ url: config.facilitatorUrl }),
  ).register(config.network, new evm.ExactEvmScheme())
    .registerExtension(agentkit.agentkitResourceServerExtension);

  const routeConfig = {
    accepts: {
      scheme: "exact",
      price: formatTestUsdc(priceMicroUsdc).replace(" test USDC", ""),
      network: config.network,
      payTo: config.payTo,
      maxTimeoutSeconds: 60,
    },
    description: "GroundSignal consensus-scored weather observation",
    mimeType: "application/json",
    extensions: agentkit.declareAgentkitExtension({ mode: { type: "free-trial", uses: 3 } }),
  };
  const httpServer = new core.x402HTTPResourceServer(server, { "/api/v1/weather": routeConfig });

  if (process.env.AGENTKIT_ENABLED === "true" && getRuntimeMode() === "sqlite") {
    const { SQLiteAgentKitUsageRepository } = await import("@/server/db/repositories");
    const hooks = agentkit.createAgentkitHooks({
      agentBook: agentkit.createAgentBookVerifier({ rpcUrl: process.env.WORLD_CHAIN_RPC_URL }),
      mode: { type: "free-trial", uses: 3 },
      storage: new SQLiteAgentKitUsageRepository(),
      rpcUrl: process.env.WORLD_CHAIN_RPC_URL,
    });
    httpServer.onProtectedRequest(hooks.requestHook);
  }

  await httpServer.initialize();
  const handler = async () => NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  return next.withX402FromHTTPServer(handler, httpServer, undefined, undefined, false)(request);
}
