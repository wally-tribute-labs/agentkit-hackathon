import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"], variable: "--font-plex-sans", display: "swap", weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"], variable: "--font-plex-mono", display: "swap", weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "GroundSignal — Human witness data for agents", template: "%s · GroundSignal" },
  description: "An open-source reference implementation for consensus-scored, proof-of-human physical-world observations.",
  applicationName: "GroundSignal",
  keywords: ["open source", "AI agents", "World ID", "x402", "weather", "consensus"],
  openGraph: {
    title: "GroundSignal",
    description: "When the model says clear, ask the ground.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#F1EBDD", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <span>GroundSignal / open field protocol</span>
          <span>Weather data attributed to <a href="https://open-meteo.com/" rel="noreferrer">Open-Meteo</a></span>
          <span>MIT licensed · v1 reference implementation</span>
        </footer>
      </body>
    </html>
  );
}
