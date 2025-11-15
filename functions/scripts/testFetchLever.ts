/* ts-node script to test Lever fetcher */
import { fetchFromATS } from '../src/utils/atsFetchers';
import { ATSProviderConfig } from '../src/types';

async function main() {
  const sources: ATSProviderConfig[] = [
    { provider: 'lever', company: 'brex' },
  ];
  console.log('[DEBUG] Running Lever test');
  const jobs = await fetchFromATS(sources);
  console.log(`[DEBUG] Lever total jobs=${jobs.length}`);
  console.log('[DEBUG] Sample:', jobs.slice(0, 3));
}

main().catch((e) => {
  console.error('ERROR testFetchLever', e);
  process.exit(1);
});




