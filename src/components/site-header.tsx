import Link from "next/link";

const links = [
  ["Field test", "/demo"],
  ["Observe", "/observe"],
  ["Developers", "/developers"],
  ["Integration lab", "/lab"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="GroundSignal home">
        <span className="wordmark-mark" aria-hidden="true">GS</span>
        <span>GroundSignal</span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <span className="header-status"><i aria-hidden="true" /> deterministic demo</span>
    </header>
  );
}
