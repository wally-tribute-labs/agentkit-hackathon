import type { Metadata } from "next";
import { DemoExperience } from "@/components/demo-experience";
import { SF_RAIN_SCENARIO } from "@/core/scenario";

export const metadata: Metadata = { title: "Field test" };

export default function DemoPage() {
  return <main id="main-content"><DemoExperience scenario={SF_RAIN_SCENARIO} /></main>;
}
