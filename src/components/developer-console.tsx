"use client";

import { useEffect, useMemo, useState } from "react";

type ConsoleTab = "demo" | "x402";

export function DeveloperConsole() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [tab, setTab] = useState<ConsoleTab>("demo");
  const [response, setResponse] = useState<string>("Select Run request to call the real endpoint.");
  const [status, setStatus] = useState<string>("READY");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setBaseUrl(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const endpoint = tab === "demo"
    ? "/api/demo/weather?scenario=sf-rain-v1"
    : "/api/v1/weather?lat=37.7749&lon=-122.4194&radius=1000&scenario=sf-rain-v1";
  const curl = useMemo(() => `curl --request GET \\\n  --url '${baseUrl}${endpoint}' \\\n  --header 'Accept: application/json'`, [baseUrl, endpoint]);

  async function run() {
    setStatus("REQUESTING");
    try {
      const result = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
      const headers = Object.fromEntries([...result.headers.entries()].filter(([key]) => key.startsWith("payment") || key === "content-type"));
      const body = await result.json();
      setResponse(JSON.stringify({ status: result.status, headers, body }, null, 2));
      setStatus(result.ok ? "200 OK" : `${result.status} ${result.statusText}`);
    } catch (error) {
      setResponse(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }, null, 2));
      setStatus("FAILED");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <div className="developer-console">
      <div className="console-tabs" role="tablist" aria-label="API mode">
        <button role="tab" aria-selected={tab === "demo"} onClick={() => setTab("demo")}>Demo API <small>FREE</small></button>
        <button role="tab" aria-selected={tab === "x402"} onClick={() => setTab("x402")}>x402 Testnet <small>OPTIONAL</small></button>
      </div>
      <div className="console-grid">
        <section className="request-builder">
          <div className="panel-heading"><span>REQUEST</span><strong>GET</strong></div>
          <label>Endpoint<input readOnly value={endpoint} /></label>
          <div className="code-block"><pre>{curl}</pre><button onClick={() => void copy()}>{copied ? "Copied" : "Copy cURL"}</button></div>
          <div className="request-notice">{tab === "demo" ? <><b>Immutable server fixture.</b> This does not include your browser-local observation.</> : <><b>Base Sepolia only.</b> Unconfigured environments return a controlled 503 before any facilitator call.</>}</div>
          <button className="button button-primary" onClick={() => void run()}>Run request</button>
        </section>
        <section className="response-inspector">
          <div className="panel-heading"><span>RESPONSE</span><strong>{status}</strong></div>
          <pre aria-live="polite">{response}</pre>
        </section>
      </div>
      <div className="contract-notes">
        <article><span>01</span><div><h3>One response contract</h3><p>Free fixtures and paid SQLite queries return the same <code>AgentWeatherResponse</code> shape.</p></div></article>
        <article><span>02</span><div><h3>Validate before payment</h3><p>Bad coordinates fail with a typed 400 before x402 can issue a challenge.</p></div></article>
        <article><span>03</span><div><h3>Settle after success</h3><p>The route wrapper settles only after the protected handler returns a successful response.</p></div></article>
      </div>
    </div>
  );
}
