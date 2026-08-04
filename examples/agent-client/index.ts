import { createAgentBuyerFetch, decodeAgentPaymentReceipt } from "../../src/integrations/agent-buyer";

const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
const apiUrl = process.env.GROUNDSIGNAL_API_URL;
if (!privateKey || !apiUrl) throw new Error("Set AGENT_PRIVATE_KEY and GROUNDSIGNAL_API_URL.");

const fetchWithPayment = createAgentBuyerFetch(privateKey);
const response = await fetchWithPayment(`${apiUrl}/api/v1/weather?lat=37.7749&lon=-122.4194&radius=1000`);
if (!response.ok) throw new Error(`GroundSignal returned ${response.status}`);
console.log(JSON.stringify({ data: await response.json(), receipt: decodeAgentPaymentReceipt(response) }, null, 2));
