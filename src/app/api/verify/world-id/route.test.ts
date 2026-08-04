import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setCookie: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: mocks.setCookie }),
}));

describe("World ID verifier route", () => {
  beforeEach(() => {
    process.env.GROUNDSIGNAL_MODE = "sqlite";
    process.env.WORLD_ID_RP_ID = "rp_groundsignal_test";
    process.env.OBSERVER_SESSION_SECRET = "groundsignal-test-secret-with-at-least-32-bytes";
    mocks.setCookie.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GROUNDSIGNAL_MODE;
    delete process.env.WORLD_ID_RP_ID;
    delete process.env.OBSERVER_SESSION_SECRET;
  });

  it("verifies the fixed action and returns only a pseudonymous observer", async () => {
    const verifier = vi.fn(async () => Response.json({
      success: true,
      responses: [{ nullifier: "raw-world-id-nullifier" }],
    }));
    vi.stubGlobal("fetch", verifier);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/verify/world-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rp_id: "rp_groundsignal_test",
        idkitResponse: { action: "groundsignal-observation", proof: "mock-proof" },
      }),
    }));

    expect(response.status).toBe(200);
    const serialized = JSON.stringify(await response.json());
    expect(serialized).toContain("observer_");
    expect(serialized).not.toContain("raw-world-id-nullifier");
    expect(verifier).toHaveBeenCalledWith(
      "https://developer.world.org/api/v4/verify/rp_groundsignal_test",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(mocks.setCookie).toHaveBeenCalledWith(
      "groundsignal_observer",
      expect.not.stringContaining("raw-world-id-nullifier"),
      expect.objectContaining({ httpOnly: true, sameSite: "lax", maxAge: 1_800 }),
    );
  });

  it("rejects an unknown action before calling the verifier", async () => {
    const verifier = vi.fn();
    vi.stubGlobal("fetch", verifier);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/verify/world-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rp_id: "rp_groundsignal_test",
        idkitResponse: { action: "wrong-action", proof: "mock-proof" },
      }),
    }));
    expect(response.status).toBe(400);
    expect(verifier).not.toHaveBeenCalled();
  });
});
