import type { Metadata, Viewport } from "next";
import { Archivo, Azeret_Mono, Instrument_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"], variable: "--font-archivo", display: "swap", axes: ["wdth"],
});
const instrumentSans = Instrument_Sans({
  subsets: ["latin"], variable: "--font-instrument-sans", display: "swap",
});
const azeretMono = Azeret_Mono({
  subsets: ["latin"], variable: "--font-azeret-mono", display: "swap",
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

export const viewport: Viewport = { themeColor: "#101D22", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${archivo.variable} ${instrumentSans.variable} ${azeretMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner section-shell">
            <span className="footer-mark">GroundSignal · open field protocol</span>
            <span>Weather data from <a href="https://open-meteo.com/" rel="noreferrer">Open-Meteo</a></span>
            <span>MIT licensed · v1 reference implementation</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
