/* ts-node script to test all configured ATS sources */
import { fetchFromATS } from '../src/utils/atsFetchers';
import { ATS_SOURCES } from '../src/config';

async function main() {
  console.log('[DEBUG] Running ATS test with sources:', ATS_SOURCES);
  const jobs = await fetchFromATS(ATS_SOURCES);
  console.log(`[DEBUG] All sources total jobs=${jobs.length}`);
  const byAts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.ats] = (acc[j.ats] || 0) + 1;
    return acc;
  }, {});
  console.log('[DEBUG] Counts by ATS:', byAts);
  console.log('[DEBUG] Sample:', jobs.slice(0, 5));
}

main().catch((e) => {
  console.error('ERROR testAllSources', e);
  process.exit(1);
});




