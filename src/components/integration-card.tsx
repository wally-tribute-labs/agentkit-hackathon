import type { IntegrationState } from "@/core/types";
import { IntegrationStamp } from "./status-stamp";

export function IntegrationCard({ index, name, state, role, detail, setup }: {
  index: string; name: string; state: IntegrationState; role: string; detail: string; setup: string;
}) {
  return <article className="integration-card">
    <div className="integration-index">{index}</div>
    <div className="integration-title"><div><p>{role}</p><h2>{name}</h2></div><IntegrationStamp state={state} /></div>
    <p>{detail}</p>
    <details><summary>Configuration notes</summary><p>{setup}</p></details>
  </article>;
}
