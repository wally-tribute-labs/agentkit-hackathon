import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["", "/demo", "/observe", "/developers", "/lab"].map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly", priority: path ? 0.8 : 1 }));
}
