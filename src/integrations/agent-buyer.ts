import { createAgentkitClient } from "@worldcoin/agentkit";
import { ExactEvmScheme } from "@x402/evm";
import { decodePaymentResponseHeader, wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

export function createAgentBuyerFetch(privateKey: `0x${string}`): typeof fetch {
  const account = privateKeyToAccount(privateKey);
  const agentkit = createAgentkitClient({
    signer: {
      address: account.address,
      chainId: "eip155:84532",
      type: "eip191",
      signMessage: (message) => account.signMessage({ message }),
    },
  });
  return wrapFetchWithPaymentFromConfig(agentkit.fetch, {
    schemes: [{ network: "eip155:84532", client: new ExactEvmScheme(account) }],
  });
}

export function decodeAgentPaymentReceipt(response: Response): unknown | null {
  const receipt = response.headers.get("PAYMENT-RESPONSE");
  return receipt ? decodePaymentResponseHeader(receipt) : null;
}
