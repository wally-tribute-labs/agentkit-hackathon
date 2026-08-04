import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { SF_RAIN_SCENARIO, createScenarioResponse } from "@/core/scenario";

const mockState = vi.hoisted(() => ({ initialized: 0, settled: 0, failed: 0 }));

vi.mock("server-only", () => ({}));
vi.mock("@x402/core/server", () => ({
  HTTPFacilitatorClient: class { constructor(public options: unknown) {} },
  x402ResourceServer: class {
    register() { return this; }
    registerExtension() { return this; }
  },
  x402HTTPResourceServer: class {
    onProtectedRequest() { return this; }
    async initialize() { mockState.initialized += 1; }
  },
}));
vi.mock("@x402/evm/exact/server", () => ({ ExactEvmScheme: class {} }));
vi.mock("@worldcoin/agentkit", () => ({
  agentkitResourceServerExtension: {},
  declareAgentkitExtension: () => ({ info: { version: "mock" } }),
  createAgentkitHooks: () => ({ requestHook: vi.fn() }),
  createAgentBookVerifier: vi.fn(),
}));
vi.mock("@x402/next", () => ({
  withX402FromHTTPServer: (handler: () => Promise<NextResponse>) => async (request: NextRequest) => {
    if (!request.headers.get("PAYMENT-SIGNATURE")) {
      return NextResponse.json({ error: "payment_required" }, {
        status: 402,
        headers: { "PAYMENT-REQUIRED": "mock-base-sepolia-challenge" },
      });
    }
    const response = await handler();
    if (request.headers.get("x-mock-settlement") === "fail") {
      mockState.failed += 1;
      return NextResponse.json({ error: "settlement_failed" }, { status: 502 });
    }
    if (response.ok) {
      mockState.settled += 1;
      response.headers.set("PAYMENT-RESPONSE", "mock-settlement-receipt");
    }
    return response;
  },
}));

describe("x402 route integration", () => {
  beforeEach(() => {
    process.env.X402_FACILITATOR_URL = "https://x402.org/facilitator";
    process.env.X402_NETWORK = "eip155:84532";
    process.env.X402_PAY_TO = "0x1111111111111111111111111111111111111111";
    process.env.GROUNDSIGNAL_MODE = "demo";
    mockState.initialized = 0;
    mockState.settled = 0;
    mockState.failed = 0;
  });

  afterEach(() => {
    delete process.env.X402_FACILITATOR_URL;
    delete process.env.X402_NETWORK;
    delete process.env.X402_PAY_TO;
  });

  it("returns a mocked payment challenge without settling", async () => {
    const { protectWeatherHandler } = await import("./config");
    const request = new NextRequest("http://localhost/api/v1/weather");
    const response = await protectWeatherHandler(createScenarioResponse(SF_RAIN_SCENARIO), 20_000, request);
    expect(response.status).toBe(402);
    expect(response.headers.get("PAYMENT-REQUIRED")).toBe("mock-base-sepolia-challenge");
    expect(mockState).toMatchObject({ initialized: 1, settled: 0, failed: 0 });
  });

  it("returns the official response header after mocked settlement", async () => {
    const { protectWeatherHandler } = await import("./config");
    const request = new NextRequest("http://localhost/api/v1/weather", {
      headers: { "PAYMENT-SIGNATURE": "mock-paid-request" },
    });
    const response = await protectWeatherHandler(createScenarioResponse(SF_RAIN_SCENARIO), 20_000, request);
    expect(response.status).toBe(200);
    expect(response.headers.get("PAYMENT-RESPONSE")).toBe("mock-settlement-receipt");
    expect(mockState.settled).toBe(1);
  });

  it("does not deliver data when mocked settlement fails", async () => {
    const { protectWeatherHandler } = await import("./config");
    const request = new NextRequest("http://localhost/api/v1/weather", {
      headers: { "PAYMENT-SIGNATURE": "mock-paid-request", "x-mock-settlement": "fail" },
    });
    const response = await protectWeatherHandler(createScenarioResponse(SF_RAIN_SCENARIO), 20_000, request);
    expect(response.status).toBe(502);
    expect(mockState).toMatchObject({ settled: 0, failed: 1 });
  });

  it("rejects a zero payment address", async () => {
    process.env.X402_PAY_TO = "0x0000000000000000000000000000000000000000";
    const { readX402Config } = await import("./config");
    expect(() => readX402Config()).toThrow(/non-zero EVM address/);
  });
});
