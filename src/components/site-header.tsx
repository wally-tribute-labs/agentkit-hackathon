"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SkyCover } from "./sky-cover";

const links = [
  ["Field test", "/demo"],
  ["Observe", "/observe"],
  ["Developers", "/developers"],
  ["Integration lab", "/lab"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner section-shell">
        <Link className="wordmark" href="/" aria-label="GroundSignal home">
          <SkyCover fraction={0.75} size={21} tone="ground" />
          <span>GroundSignal</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <span className="header-reading"><i aria-hidden="true" /> deterministic demo</span>
      </div>
    </header>
  );
}
