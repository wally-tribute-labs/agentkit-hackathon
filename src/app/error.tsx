"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="section-shell page-heading"><p className="eyebrow">Field sheet interrupted</p><h1>The signal could not be resolved.</h1><p>No observation or payment state was changed. Retry the request, or inspect the Integration Lab if an optional adapter is involved.</p><button className="button button-primary" onClick={reset}>Try again</button></main>;
}
