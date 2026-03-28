import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { latLngToCell, gridDisk } from 'h3-js';
import { server, NETWORK, EVM_ADDRESS } from '@/lib/x402/config';
import { getConsensusWeather, getSignalStrength, getTimeWindow } from '@/lib/weather/consensus';
import { fetchOpenMeteoBaseline, wmoCodeToWeatherCondition } from '@/lib/weather/openmeteo';
import { SIGNAL_PRICES } from '@/types/weather';
import type { AgentQueryResponse } from '@/types/weather';
import db from '@/lib/db';
import { initSchema } from '@/lib/db/schema';
import type { HTTPRequestContext } from '@x402/core/server';
import { declareAgentkitExtension } from '@worldcoin/agentkit';

initSchema();

// Lightweight count query used by the dynamic price function
function getHumanCountForPricing(lat: number, lon: number): number {
  const centerCell = latLngToCell(lat, lon, 7);
  const cells = gridDisk(centerCell, 1);
  const now = new Date();
  const currentWindow = getTimeWindow(now.toISOString());
  const prevWindow = new Date(new Date(currentWindow).getTime() - 30 * 60 * 1000).toISOString();
  const placeholders = cells.map(() => '?').join(',');
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT nullifier_hash) AS cnt
       FROM observations
       WHERE h3_index IN (${placeholders}) AND timestamp >= ?`,
    )
    .get([...cells, prevWindow]) as { cnt: number } | undefined;
  return row?.cnt ?? 0;
}

const handler = async (request: NextRequest): Promise<NextResponse<AgentQueryResponse>> => {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const radius = parseInt(searchParams.get('radius') ?? '1000', 10);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      {
        consensus: null,
        modelBaseline: null,
        delta: null,
        signalStrength: null,
        radius,
        queryLat: lat,
        queryLon: lon,
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const [consensus, modelBaseline] = await Promise.all([
    getConsensusWeather(lat, lon, radius),
    fetchOpenMeteoBaseline(lat, lon),
  ]);

  let delta: AgentQueryResponse['delta'] = null;
  if (consensus && modelBaseline) {
    const modelWeatherCondition = wmoCodeToWeatherCondition(modelBaseline.weatherCode);
    delta = {
      modelCondition: modelBaseline.condition,
      humanCondition: consensus.condition,
      agreementRate: consensus.agreementRate,
      modelAgrees: modelWeatherCondition === consensus.condition,
    };
  }

  return NextResponse.json({
    consensus,
    modelBaseline,
    delta,
    signalStrength: consensus?.signalStrength ?? null,
    radius,
    queryLat: lat,
    queryLon: lon,
    timestamp: new Date().toISOString(),
  });
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: 'exact',
      payTo: EVM_ADDRESS,
      network: NETWORK,
      price: (context: HTTPRequestContext) => {
        const latParam = context.adapter.getQueryParam?.('lat');
        const lonParam = context.adapter.getQueryParam?.('lon');
        const lat = parseFloat(Array.isArray(latParam) ? latParam[0] : (latParam ?? ''));
        const lon = parseFloat(Array.isArray(lonParam) ? lonParam[0] : (lonParam ?? ''));
        if (isNaN(lat) || isNaN(lon)) return SIGNAL_PRICES.solo;
        const humanCount = getHumanCountForPricing(lat, lon);
        const signal = getSignalStrength(humanCount);
        return SIGNAL_PRICES[signal];
      },
    },
    description: 'Consensus-scored weather observations from World ID-verified humans',
    extensions: declareAgentkitExtension({
      statement: 'This API serves human-verified weather observations from World ID-verified reporters.',
    }),
  },
  server,
);
