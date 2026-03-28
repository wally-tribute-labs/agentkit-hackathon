import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Human-Verified Weather Oracle',
    version: '1.0.0',
    description:
      'Consensus-scored weather observations from World ID-verified humans. ' +
      'Priced dynamically by signal strength tier via x402 micropayments (USDC on Base Sepolia). ' +
      'solo=$0.001, corroborated=$0.005, strong=$0.01, ground_truth=$0.02',
  },
  servers: [{ url: '/api/v1', description: 'Weather Oracle API' }],
  paths: {
    '/weather': {
      get: {
        summary: 'Get consensus weather for a location',
        description:
          'Returns human-verified weather consensus, Open-Meteo model baseline, and the ' +
          'delta between them. Requires x402 payment header (USDC on Base Sepolia). ' +
          'Price varies by signal strength: the more verified humans in the area, the higher the price and data quality.',
        operationId: 'getWeather',
        parameters: [
          {
            name: 'lat',
            in: 'query',
            required: true,
            schema: { type: 'number', example: 37.7749 },
            description: 'Latitude of the query location',
          },
          {
            name: 'lon',
            in: 'query',
            required: true,
            schema: { type: 'number', example: -122.4194 },
            description: 'Longitude of the query location',
          },
          {
            name: 'radius',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1000, minimum: 100, maximum: 50000 },
            description: 'Search radius in meters around the query location',
          },
        ],
        responses: {
          '200': {
            description: 'Consensus weather response with human observations and model baseline',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentQueryResponse' },
              },
            },
          },
          '400': {
            description: 'Missing or invalid lat/lon parameters',
          },
          '402': {
            description:
              'Payment required. Send an x402 payment header with USDC on Base Sepolia. ' +
              'Price is dynamic based on signal strength in the queried area.',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      AgentQueryResponse: {
        type: 'object',
        description: 'Full response from the weather oracle including consensus and model comparison',
        properties: {
          consensus: {
            oneOf: [
              { $ref: '#/components/schemas/ConsensusCell' },
              { type: 'null' },
            ],
            description: 'Human consensus data, null if no observations exist for this area',
          },
          modelBaseline: {
            oneOf: [
              { $ref: '#/components/schemas/OpenMeteoBaseline' },
              { type: 'null' },
            ],
            description: 'Open-Meteo model prediction for this location',
          },
          delta: {
            oneOf: [
              { $ref: '#/components/schemas/WeatherDelta' },
              { type: 'null' },
            ],
            description: 'Comparison between model prediction and human consensus',
          },
          signalStrength: {
            oneOf: [
              { $ref: '#/components/schemas/SignalStrength' },
              { type: 'null' },
            ],
          },
          radius: {
            type: 'integer',
            description: 'Search radius used in meters',
          },
          queryLat: {
            type: 'number',
            description: 'Latitude of the query',
          },
          queryLon: {
            type: 'number',
            description: 'Longitude of the query',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp of when this response was generated',
          },
        },
      },
      ConsensusCell: {
        type: 'object',
        description: 'Aggregated consensus from World ID-verified human observers in an H3 hex cell',
        properties: {
          h3Index: {
            type: 'string',
            description: 'H3 hex cell identifier at resolution 7 (~500m cells)',
            example: '872830828ffffff',
          },
          timeWindow: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 start of the 30-minute observation window',
          },
          condition: {
            $ref: '#/components/schemas/WeatherCondition',
          },
          agreementRate: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Fraction of humans reporting the dominant condition (0-1)',
            example: 0.92,
          },
          humanCount: {
            type: 'integer',
            minimum: 1,
            description: 'Number of unique World ID-verified humans in this cell+window',
            example: 12,
          },
          signalStrength: {
            $ref: '#/components/schemas/SignalStrength',
          },
        },
      },
      OpenMeteoBaseline: {
        type: 'object',
        description: 'Weather model prediction from Open-Meteo at time of query',
        properties: {
          temperature: {
            type: 'number',
            description: 'Temperature in Celsius',
          },
          condition: {
            type: 'string',
            description: 'Human-readable WMO weather code description',
            example: 'Clear sky',
          },
          humidity: {
            type: 'number',
            description: 'Relative humidity percentage',
          },
          windSpeed: {
            type: 'number',
            description: 'Wind speed in km/h',
          },
          weatherCode: {
            type: 'integer',
            description: 'WMO weather interpretation code',
          },
        },
      },
      WeatherDelta: {
        type: 'object',
        description: 'The delta between model prediction and human consensus — the core value of this oracle',
        properties: {
          modelCondition: {
            type: 'string',
            nullable: true,
            description: 'What the model predicted',
            example: 'Clear sky',
          },
          humanCondition: {
            oneOf: [{ $ref: '#/components/schemas/WeatherCondition' }, { type: 'null' }],
            description: 'What verified humans reported',
          },
          agreementRate: {
            type: 'number',
            nullable: true,
            description: 'Fraction of humans agreeing on the human condition',
          },
          modelAgrees: {
            type: 'boolean',
            nullable: true,
            description: 'Whether the model prediction matches human consensus',
          },
        },
      },
      WeatherCondition: {
        type: 'string',
        enum: ['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm', 'windy', 'haze'],
        description: 'Standardized weather condition reported by humans',
      },
      SignalStrength: {
        type: 'string',
        enum: ['solo', 'corroborated', 'strong', 'ground_truth'],
        description:
          'Data quality tier based on unique human count. ' +
          'solo=1 human ($0.001), corroborated=3+ ($0.005), strong=5+ ($0.01), ground_truth=10+ ($0.02)',
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
