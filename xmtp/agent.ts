import { Agent, getTestUrl } from '@xmtp/agent-sdk';
import { initSchema } from '../src/lib/db/schema';
import { parseWeatherQuery, queryWeather, formatWeatherReport, getHelpText } from './handlers';

// Ensure SQLite schema exists before handling any messages
initSchema();

async function main() {
  const agent = await Agent.createFromEnv();

  agent.on('start', (ctx) => {
    console.log(`Weather Oracle agent running`);
    console.log(`Address: ${ctx.getClientAddress()}`);
    console.log(`Test URL: ${getTestUrl(ctx.client)}`);
    console.log(`Send "weather <lat>,<lon>" to get human-verified weather`);
  });

  agent.on('text', async (ctx) => {
    const text = ctx.message.content;
    const result = parseWeatherQuery(text);

    if (result.type === 'help') {
      await ctx.sendTextReply(getHelpText());
      return;
    }

    if (result.type === 'error') {
      await ctx.sendTextReply(result.message);
      return;
    }

    // Weather query
    try {
      const response = await queryWeather(result.lat, result.lon);
      const report = formatWeatherReport(response);
      await ctx.sendTextReply(report);
    } catch (err) {
      console.error('Weather query failed:', err);
      await ctx.sendTextReply(`Sorry, failed to fetch weather data. Please try again.`);
    }
  });

  await agent.start();
}

main().catch((err) => {
  console.error('Agent failed to start:', err);
  process.exit(1);
});
