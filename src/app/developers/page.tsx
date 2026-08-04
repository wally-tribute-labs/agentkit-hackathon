import type { Metadata } from "next";
import Link from "next/link";
import { DeveloperConsole } from "@/components/developer-console";

export const metadata: Metadata = { title: "Agent API" };

export default function DevelopersPage() {
  return <main id="main-content" className="section-shell developers-page">
    <header className="page-heading developer-heading"><div><p className="eyebrow">Agent interface / v1.0</p><h1>Ask for the signal, not another forecast.</h1></div><Link className="button button-quiet" href="/api/v1/openapi">OpenAPI 3.1 ↗</Link></header>
    <DeveloperConsole />
  </main>;
}
