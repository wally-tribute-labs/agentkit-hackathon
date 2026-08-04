import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="section-shell page-heading"><p className="eyebrow">404 / outside survey boundary</p><h1>No field sheet exists here.</h1><p>The requested route is not part of the GroundSignal v1 protocol surface.</p><Link className="button button-primary" href="/">Return to GroundSignal</Link></main>;
}
