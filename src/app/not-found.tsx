import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="section-shell page-heading">
    <p className="eyebrow">404 · outside the survey boundary</p>
    <h1>No field sheet exists here.</h1>
    <p className="lede">This route is not part of the GroundSignal v1 protocol surface. The field test, the observer sheet, and the agent API are all reachable from the home page.</p>
    <p className="page-actions"><Link className="button button-primary" href="/">Go to the home page</Link><Link className="button button-quiet" href="/demo">Run the field test</Link></p>
  </main>;
}
