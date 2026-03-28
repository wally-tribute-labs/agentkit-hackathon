// Phase 2: x402 route configuration and server setup
// Uses @x402/next with withX402 wrapper pattern.

import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { agentkitResourceServerExtension } from '@worldcoin/agentkit';

const facilitatorClient = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL ?? 'https://x402-facilitator.cdp.coinbase.com',
});

const NETWORK_VALUE = (process.env.X402_NETWORK ?? 'eip155:84532') as `${string}:${string}`;

export const server = new x402ResourceServer(facilitatorClient)
  .register(NETWORK_VALUE, new ExactEvmScheme())
  .registerExtension(agentkitResourceServerExtension);

export const NETWORK = (process.env.X402_NETWORK ?? 'eip155:84532') as `${string}:${string}`;
export const EVM_ADDRESS = process.env.EVM_ADDRESS ?? '0x0000000000000000000000000000000000000000';
