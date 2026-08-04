import { permanentRedirect } from "next/navigation";

export default function DashboardRedirect() {
  permanentRedirect("/demo?panel=evidence");
}
