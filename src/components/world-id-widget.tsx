"use client";

import { useEffect, useState } from "react";
import { IDKitRequestWidget, orbLegacy, type IDKitResult, type RpContext } from "@worldcoin/idkit";

interface ContextResponse {
  app_id: `app_${string}`;
  action: string;
  rp_context: RpContext;
}

export default function WorldIdWidget({ onVerified }: { onVerified: () => void }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<ContextResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insideWorldApp, setInsideWorldApp] = useState(false);

  useEffect(() => {
    void import("@worldcoin/minikit-js").then(({ MiniKit }) => setInsideWorldApp(MiniKit.isInstalled()));
  }, []);

  async function begin() {
    setError(null);
    const response = await fetch("/api/verify/world-id/context", { cache: "no-store" });
    if (!response.ok) {
      setError("World ID setup is incomplete for this environment.");
      return;
    }
    setContext(await response.json() as ContextResponse);
    setOpen(true);
  }

  async function verify(result: IDKitResult) {
    if (!context) throw new Error("Missing World ID context");
    const response = await fetch("/api/verify/world-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rp_id: context.rp_context.rp_id, idkitResponse: result }),
    });
    if (!response.ok) throw new Error("World ID verification failed");
  }

  return (
    <>
      <button className="button button-quiet" type="button" onClick={() => void begin()}>
        {insideWorldApp ? "Continue in World App" : "Verify with World ID"}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {context ? <IDKitRequestWidget
        open={open}
        onOpenChange={setOpen}
        app_id={context.app_id}
        action={context.action}
        rp_context={context.rp_context}
        allow_legacy_proofs={true}
        environment="production"
        preset={orbLegacy()}
        handleVerify={verify}
        onSuccess={onVerified}
        onError={() => setError("World ID did not complete verification.")}
      /> : null}
    </>
  );
}
