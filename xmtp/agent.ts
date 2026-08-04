import { Agent, getTestUrl } from "@xmtp/agent-sdk";
import { createAgentBuyerFetch } from "../src/integrations/agent-buyer";
import { formatWeatherReport, getHelpText, parseCommand, queryGroundSignal } from "./handlers";

async function main() {
  const integrationMode = process.env.GROUNDSIGNAL_XMTP_MODE === "integration";
  const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
  if (integrationMode && !privateKey) {
    throw new Error("AGENT_PRIVATE_KEY is required when GROUNDSIGNAL_XMTP_MODE=integration.");
  }
  const request = integrationMode && privateKey ? createAgentBuyerFetch(privateKey) : fetch;
  const agent = await Agent.createFromEnv();
  agent.on("start", (context) => {
    console.log("GroundSignal XMTP agent running");
    console.log(`Address: ${context.getClientAddress()}`);
    console.log(`Test URL: ${getTestUrl(context.client)}`);
  });
  agent.on("text", async (context) => {
    const command = parseCommand(context.message.content);
    if (command.type === "help") return context.sendTextReply(getHelpText());
    if (command.type === "error") return context.sendTextReply(command.message);
    try {
      const response = await queryGroundSignal(command, request);
      await context.sendTextReply(formatWeatherReport(response));
    } catch (error) {
      console.error("GroundSignal API request failed:", error instanceof Error ? error.message : "unknown error");
      await context.sendTextReply("GroundSignal could not complete that request. Check the API and integration status, then try again.");
    }
  });
  await agent.start();
}

void main().catch((error) => {
  console.error("GroundSignal XMTP agent failed to start:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});
