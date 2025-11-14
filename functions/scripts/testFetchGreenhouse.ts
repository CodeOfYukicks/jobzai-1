/* ts-node script to test Greenhouse fetcher */
import { fetchFromATS } from '../src/utils/atsFetchers';
import { ATSProviderConfig } from '../src/types';

async function main() {
  const sources: ATSProviderConfig[] = [
    { provider: 'greenhouse', url: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true' },
  ];
  console.log('[DEBUG] Running Greenhouse test');
  const jobs = await fetchFromATS(sources);
  console.log(`[DEBUG] Greenhouse total jobs=${jobs.length}`);
  console.log('[DEBUG] Sample:', jobs.slice(0, 3));
}

main().catch((e) => {
  console.error('ERROR testFetchGreenhouse', e);
  process.exit(1);
});



