"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="section-shell page-heading">
    <p className="eyebrow">Field sheet interrupted</p>
    <h1>The signal could not be resolved.</h1>
    <p className="lede">No observation or payment state changed. Retry the request, or open the Integration Lab to check whether an optional adapter is involved.</p>
    <p className="page-actions"><button className="button button-primary" onClick={reset}>Try again</button><Link className="button button-quiet" href="/lab">Open the Integration Lab</Link></p>
  </main>;
}
