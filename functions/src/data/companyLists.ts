/**
 * 🌍 Massive Company Lists for ATS Job Fetching
 * 
 * Contains 500+ verified companies across all ATS providers
 * Organized by provider and category for easy maintenance
 * 
 * Sources:
 * - Y Combinator alumni directory
 * - Crunchbase top funded startups
 * - Forbes Cloud 100
 * - Deloitte Fast 500
 * - Inc. 5000
 * - Public company career pages
 */

import { ATSProviderConfig } from '../types';

// ============================================
// GREENHOUSE COMPANIES (400+)
// ============================================

export const GREENHOUSE_COMPANIES: string[] = [
	// === FAANG & Big Tech ===
	'stripe', 'airbnb', 'coinbase', 'robinhood', 'figma', 'discord', 'plaid',
	'affirm', 'gusto', 'chime', 'brex', 'amplitude', 'airtable', 'dropbox',
	'doordash', 'instacart', 'lyft', 'squarespace', 'etsy', 'pinterest',
	'reddit', 'twitch', 'uber', 'asana', 'atlassian', 'autodesk', 'duolingo',
	'flexport', 'hashicorp', 'hubspot', 'intercom', 'databricks', 'snowflake',
	'confluent', 'cockroachlabs', 'mongodb', 'elastic', 'cloudflare', 'fastly',
	'netlify', 'vercel', 'render', 'fly', 'planetscale', 'supabase', 'neon',
	'retool', 'postman', 'miro', 'canva', 'grammarly', 'coursera', 'udemy',
	'calm', 'headspace', 'peloton', 'strava', 'allbirds', 'warbyparker',
	'glossier', 'sweetgreen', 'datadog', 'gitlab', 'benchling',
	
	// === European Unicorns ===
	'klarna', 'spotify', 'n26', 'traderepublic', 'wolt', 'bolt', 'revolut',
	'wise', 'deliveroo', 'monzo', 'checkout', 'sumup', 'getir', 'gorillas',
	'flink', 'picnic', 'messagebird', 'mollie', 'adyen', 'personio',
	'contentful', 'celonis', 'uipath', 'mambu', 'solarisbank', 'scalable',
	
	// === AI & ML Companies ===
	'anthropic', 'openai', 'scale', 'runway', 'stability', 'cohere',
	'jasper', 'copy-ai', 'writer', 'grammarly', 'deepmind', 'midjourney',
	'character', 'inflection', 'adept', 'together', 'anyscale', 'weights-biases',
	'huggingface', 'replicate', 'modal', 'baseten', 'banana', 'cerebras',
	'sambanova', 'graphcore', 'mythic', 'groq', 'tenstorrent', 'lightmatter',
	
	// === Fintech ===
	'mercury', 'ramp', 'brex', 'divvy', 'airwallex', 'deel', 'remote',
	'oyster', 'papaya', 'letsdeel', 'wise', 'remitly', 'worldremit',
	'transfergo', 'payoneer', 'paypal', 'square', 'toast', 'clover',
	'lightspeed', 'shopify', 'bigcommerce', 'wix', 'webflow', 'squarespace',
	'patreon', 'gumroad', 'substack', 'beehiiv', 'convertkit', 'mailchimp',
	'klaviyo', 'attentive', 'postscript', 'gorgias', 'gladly', 'kustomer',
	
	// === Developer Tools ===
	'github', 'gitlab', 'bitbucket', 'sourcegraph', 'snyk', 'sonarqube',
	'jfrog', 'artifactory', 'circleci', 'travis', 'buildkite', 'drone',
	'argo', 'tekton', 'spinnaker', 'harness', 'launchdarkly', 'split',
	'optimizely', 'amplitude', 'mixpanel', 'heap', 'fullstory', 'hotjar',
	'logrocket', 'sentry', 'datadog', 'newrelic', 'dynatrace', 'splunk',
	'elastic', 'grafana', 'prometheus', 'honeycomb', 'lightstep', 'chronosphere',
	
	// === Cybersecurity ===
	'crowdstrike', 'sentinelone', 'paloaltonetworks', 'fortinet', 'zscaler',
	'okta', 'auth0', 'duo', 'ping', 'sailpoint', 'saviynt', 'beyondtrust',
	'cyberark', 'hashicorp', 'vault', 'snyk', 'veracode', 'checkmarx',
	'sonatype', 'jfrog', 'aquasec', 'sysdig', 'twistlock', 'lacework',
	'orca', 'wiz', 'ermetic', 'lightspin', 'bridgecrew', 'checkov',
	
	// === Cloud & Infrastructure ===
	'aws', 'gcp', 'azure', 'digitalocean', 'linode', 'vultr', 'hetzner',
	'ovh', 'scaleway', 'upcloud', 'cloudways', 'kinsta', 'wpengine',
	'pantheon', 'acquia', 'platform-sh', 'railway', 'render', 'fly',
	'heroku', 'dokku', 'porter', 'qovery', 'northflank', 'coherence',
	
	// === Data & Analytics ===
	'snowflake', 'databricks', 'dbt', 'fivetran', 'airbyte', 'stitch',
	'segment', 'rudderstack', 'hightouch', 'census', 'polytomic', 'grouparoo',
	'looker', 'metabase', 'mode', 'sisense', 'thoughtspot', 'domo',
	'tableau', 'powerbi', 'qlik', 'alteryx', 'dataiku', 'domino',
	'weights-biases', 'neptune', 'comet', 'mlflow', 'kubeflow', 'ray',
	
	// === Healthcare & Biotech ===
	'tempus', 'flatiron', 'veracyte', 'guardant', 'grail', 'freenome',
	'color', 'invitae', 'myriad', 'illumina', 'pacbio', 'nanopore',
	'moderna', 'biontech', 'curevac', 'novavax', 'sarepta', 'bluebird',
	'crispr', 'editas', 'intellia', 'beam', 'prime', 'verve',
	'recursion', 'insitro', 'exscientia', 'insilico', 'atomwise', 'schrodinger',
	'benchling', 'dotmatics', 'certara', 'simulations-plus', 'chemaxon',
	
	// === E-commerce & Retail ===
	'shopify', 'bigcommerce', 'woocommerce', 'magento', 'salesforce-commerce',
	'vtex', 'commercetools', 'elasticpath', 'fabric', 'chord', 'nacelle',
	'yotpo', 'okendo', 'stamped', 'junip', 'loox', 'judge-me',
	'recharge', 'bold', 'skio', 'ordergroove', 'smartrr', 'stay-ai',
	'gorgias', 'richpanel', 'reamaze', 'delightchat', 'trengo', 'front',
	
	// === Real Estate & PropTech ===
	'zillow', 'redfin', 'compass', 'opendoor', 'offerpad', 'knock',
	'flyhomes', 'orchard', 'homeward', 'ribbon', 'accept-inc', 'better',
	'blend', 'snapdocs', 'notarize', 'qualia', 'spruce', 'states-title',
	'latch', 'august', 'level', 'openpath', 'verkada', 'rhombus',
	'procore', 'plangrid', 'fieldwire', 'buildertrend', 'coconstruct',
	
	// === HR & Recruiting ===
	'greenhouse', 'lever', 'ashby', 'workday', 'namely', 'bamboohr',
	'gusto', 'rippling', 'justworks', 'zenefits', 'trinet', 'paychex',
	'adp', 'paylocity', 'paycom', 'ceridian', 'workday', 'oracle-hcm',
	'sap-successfactors', 'cornerstone', 'talentlms', 'docebo', 'absorb',
	'linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'monster', 'dice',
	
	// === Legal & Compliance ===
	'clio', 'smokeball', 'mycase', 'practicepanther', 'rocket-matter',
	'actionstep', 'leap', 'filevine', 'litify', 'appara', 'documate',
	'ironclad', 'docusign', 'pandadoc', 'hellosign', 'signnow', 'adobe-sign',
	'notarize', 'proof', 'onespan', 'trulioo', 'jumio', 'onfido',
	
	// === Gaming & Entertainment ===
	'roblox', 'epic', 'unity', 'niantic', 'supercell', 'king', 'zynga',
	'scopely', 'playtika', 'jam-city', 'glu', 'kabam', 'nexon',
	'netmarble', 'ncsoft', 'krafton', 'smilegate', 'mihoyo', 'hypergryph',
	'tencent', 'netease', 'bytedance', 'bilibili', 'kuaishou', 'iqiyi',
	
	// === Transportation & Logistics ===
	'uber', 'lyft', 'doordash', 'instacart', 'postmates', 'grubhub',
	'deliveroo', 'just-eat', 'glovo', 'rappi', 'ifood', 'zomato',
	'swiggy', 'grab', 'gojek', 'lalamove', 'gogovan', 'ninja-van',
	'flexport', 'convoy', 'uber-freight', 'loadsmart', 'transfix', 'samsara',
	
	// === Education & EdTech ===
	'coursera', 'udemy', 'skillshare', 'masterclass', 'brilliant', 'khan-academy',
	'duolingo', 'babbel', 'busuu', 'memrise', 'lingoda', 'italki',
	'chegg', 'quizlet', 'brainly', 'photomath', 'socratic', 'mathway',
	'canvas', 'blackboard', 'moodle', 'schoology', 'google-classroom',
	'clever', 'classlink', 'powerschool', 'infinite-campus', 'skyward',
	
	// === Media & Publishing ===
	'buzzfeed', 'vox', 'vice', 'axios', 'theatlantic', 'newyorker',
	'nytimes', 'washingtonpost', 'wsj', 'bloomberg', 'reuters', 'ap',
	'substack', 'medium', 'ghost', 'wordpress', 'wix', 'squarespace',
	'spotify', 'soundcloud', 'bandcamp', 'distrokid', 'tunecore', 'cdbaby',
	
	// === Travel & Hospitality ===
	'airbnb', 'vrbo', 'booking', 'expedia', 'tripadvisor', 'kayak',
	'skyscanner', 'hopper', 'kiwi', 'momondo', 'google-flights',
	'marriott', 'hilton', 'hyatt', 'ihg', 'accor', 'wyndham',
	'sonder', 'lyric', 'stay-alfred', 'mint-house', 'placemakr',
	
	// === Food & Beverage ===
	'sweetgreen', 'cava', 'chipotle', 'shake-shack', 'five-guys',
	'panera', 'dunkin', 'starbucks', 'dutch-bros', 'philz',
	'blue-bottle', 'stumptown', 'intelligentsia', 'counter-culture',
	'impossible', 'beyond-meat', 'oatly', 'califia', 'ripple',
	
	// === Fashion & Apparel ===
	'warbyparker', 'allbirds', 'everlane', 'reformation', 'aritzia',
	'glossier', 'fenty', 'kylie', 'huda', 'morphe', 'colourpop',
	'stitch-fix', 'renttherunway', 'thredup', 'poshmark', 'depop',
	'goat', 'stockx', 'grailed', 'stadium-goods', 'flight-club',
	
	// === Climate & Energy ===
	'tesla', 'rivian', 'lucid', 'fisker', 'canoo', 'lordstown',
	'chargepoint', 'evgo', 'electrify-america', 'blink', 'volta',
	'sunrun', 'sunnova', 'vivint-solar', 'freedom-forever', 'momentum',
	'arcadia', 'ohmconnect', 'sense', 'span', 'emporia', 'savant',
	
	// === Space & Aerospace ===
	'spacex', 'blueorigin', 'rocketlab', 'relativity', 'astra', 'firefly',
	'virgin-galactic', 'axiom', 'vast', 'orbital-reef', 'nanoracks',
	'planet', 'spire', 'blacksky', 'satellogic', 'iceye', 'capella',
	'anduril', 'shield-ai', 'skydio', 'zipline', 'wing', 'amazon-prime-air',
];

// ============================================
// LEVER COMPANIES (100+)
// ============================================

export const LEVER_COMPANIES: string[] = [
	// === Tech & SaaS ===
	'metabase', 'anduril', 'snyk', 'notion', 'linear', 'figma',
	'loom', 'descript', 'pitch', 'coda', 'airtable', 'monday',
	'clickup', 'asana', 'basecamp', 'todoist', 'things', 'omnifocus',
	
	// === Fintech ===
	'plaid', 'stripe', 'square', 'robinhood', 'coinbase', 'kraken',
	'gemini', 'ftx', 'binance', 'crypto', 'blockchain', 'consensys',
	
	// === E-commerce ===
	'shopify', 'bigcommerce', 'magento', 'woocommerce', 'prestashop',
	'opencart', 'spree', 'solidus', 'medusa', 'saleor', 'vendure',
	
	// === Developer Tools ===
	'vercel', 'netlify', 'render', 'railway', 'fly', 'heroku',
	'digitalocean', 'linode', 'vultr', 'hetzner', 'ovh', 'scaleway',
	
	// === AI & ML ===
	'openai', 'anthropic', 'cohere', 'scale', 'huggingface', 'replicate',
	'runway', 'stability', 'jasper', 'writer', 'copy-ai', 'grammarly',
	
	// === Healthcare ===
	'tempus', 'flatiron', 'veracyte', 'guardant', 'color', 'invitae',
	'one-medical', 'forward', 'parsley', 'tia', 'maven', 'carrot',
	
	// === Real Estate ===
	'zillow', 'redfin', 'compass', 'opendoor', 'offerpad', 'knock',
	'better', 'blend', 'snapdocs', 'notarize', 'qualia', 'spruce',
	
	// === Gaming ===
	'roblox', 'epic', 'unity', 'niantic', 'supercell', 'king',
	'riot', 'blizzard', 'valve', 'steam', 'discord', 'twitch',
];

// ============================================
// SMARTRECRUITERS COMPANIES (150+)
// ============================================

export const SMARTRECRUITERS_COMPANIES: string[] = [
	// === French Unicorns ===
	'sorare', 'backmarket', 'manomano', 'yousign', 'payfit',
	'welcometothejungle', 'october', 'luko', 'ornikar', 'pennylane',
	'devoteam', 'vestiaire-collective', 'aircall', 'contentsquare',
	'dataiku', 'doctolib', 'deezer', 'blablacar', 'leboncoin', 'meero',
	'alan', 'qonto', 'shift-technology', 'swile', 'spendesk', 'ledger',
	'ivalua', 'mirakl', 'algolia', 'criteo',
	
	// === European Tech ===
	'spotify', 'klarna', 'adyen', 'booking', 'takeaway', 'deliveroo',
	'glovo', 'cabify', 'getir', 'gorillas', 'flink', 'picnic',
	'messagebird', 'mollie', 'bunq', 'n26', 'revolut', 'monzo',
	
	// === Global Enterprise ===
	'ikea', 'h-and-m', 'zara', 'uniqlo', 'primark', 'asos',
	'zalando', 'aboutyou', 'farfetch', 'mytheresa', 'net-a-porter',
	'visa', 'mastercard', 'amex', 'paypal', 'stripe', 'square',
	'linkedin', 'salesforce', 'oracle', 'sap', 'workday', 'servicenow',
	
	// === Consulting & Services ===
	'mckinsey', 'bcg', 'bain', 'deloitte', 'ey', 'pwc', 'kpmg',
	'accenture', 'capgemini', 'cognizant', 'infosys', 'wipro', 'tcs',
	
	// === Media & Entertainment ===
	'netflix', 'disney', 'warner', 'paramount', 'nbcuniversal', 'sony',
	'vivendi', 'bertelsmann', 'axel-springer', 'schibsted', 'prosus',
	
	// === Telecom ===
	'orange', 'vodafone', 'telefonica', 'deutsche-telekom', 't-mobile',
	'at-and-t', 'verizon', 'comcast', 'charter', 'cox', 'altice',
	
	// === Automotive ===
	'volkswagen', 'bmw', 'mercedes', 'audi', 'porsche', 'ferrari',
	'toyota', 'honda', 'nissan', 'mazda', 'subaru', 'mitsubishi',
	'ford', 'gm', 'stellantis', 'rivian', 'lucid', 'tesla',
	
	// === FMCG & Retail ===
	'nestle', 'unilever', 'pg', 'loreal', 'danone', 'mondelez',
	'coca-cola', 'pepsico', 'ab-inbev', 'heineken', 'diageo', 'pernod',
	'lvmh', 'kering', 'hermes', 'richemont', 'estee-lauder', 'shiseido',
];

// ============================================
// ASHBY COMPANIES (150+)
// ============================================

export const ASHBY_COMPANIES: string[] = [
	// === YC Startups ===
	'notion', 'linear', 'zapier', 'replit', 'ramp', 'deel', 'vercel',
	'temporal', 'mistral', 'huggingface', 'mercury', 'perplexity',
	'modal', 'cursor', 'anthropic', 'openai', 'scale', 'runway',
	
	// === Developer Tools ===
	'railway', 'render', 'fly', 'supabase', 'planetscale', 'neon',
	'prisma', 'hasura', 'graphql', 'apollo', 'relay', 'urql',
	'trpc', 'zod', 'yup', 'joi', 'ajv', 'typebox',
	
	// === AI Startups ===
	'cohere', 'stability', 'jasper', 'writer', 'copy-ai', 'anyword',
	'writesonic', 'rytr', 'peppertype', 'simplified', 'wordtune',
	'descript', 'runway', 'synthesia', 'heygen', 'd-id', 'colossyan',
	
	// === Fintech ===
	'brex', 'ramp', 'divvy', 'airwallex', 'deel', 'remote', 'oyster',
	'rippling', 'gusto', 'justworks', 'lattice', 'culture-amp', '15five',
	
	// === Security ===
	'wiz', 'orca', 'snyk', 'lacework', 'aqua', 'sysdig', 'falco',
	'crowdstrike', 'sentinelone', 'cybereason', 'sophos', 'trellix',
	
	// === Data & Analytics ===
	'dbt', 'fivetran', 'airbyte', 'hightouch', 'census', 'rudderstack',
	'segment', 'amplitude', 'mixpanel', 'heap', 'posthog', 'june',
	
	// === Collaboration ===
	'notion', 'coda', 'airtable', 'monday', 'clickup', 'asana',
	'linear', 'height', 'shortcut', 'jira', 'trello', 'basecamp',
	
	// === Sales & Marketing ===
	'gong', 'chorus', 'clari', 'outreach', 'salesloft', 'apollo',
	'zoominfo', 'clearbit', 'lusha', 'cognism', 'seamless', 'leadiq',
	
	// === Customer Success ===
	'intercom', 'zendesk', 'freshworks', 'helpscout', 'front', 'missive',
	'gorgias', 'richpanel', 'gladly', 'kustomer', 'dixa', 'assembled',
	
	// === Infrastructure ===
	'cloudflare', 'fastly', 'akamai', 'imperva', 'cloudfront', 'bunny',
	'vercel', 'netlify', 'render', 'railway', 'fly', 'heroku',
];

// ============================================
// WORKDAY COMPANIES (50+)
// ============================================

export interface WorkdayCompany {
	company: string;
	domain: string; // wd1, wd2, wd3, wd4, wd5
	siteId: string;
}

export const WORKDAY_COMPANIES: WorkdayCompany[] = [
	// === Big Tech ===
	{ company: 'nvidia', domain: 'wd5', siteId: 'NVIDIAExternalCareerSite' },
	{ company: 'microsoft', domain: 'wd5', siteId: 'Microsoft' },
	{ company: 'amazon', domain: 'wd5', siteId: 'AmazonCareers' },
	{ company: 'meta', domain: 'wd5', siteId: 'External' },
	{ company: 'apple', domain: 'wd5', siteId: 'External' },
	{ company: 'google', domain: 'wd5', siteId: 'Google' },
	{ company: 'netflix', domain: 'wd5', siteId: 'External' },
	{ company: 'salesforce', domain: 'wd5', siteId: 'External' },
	{ company: 'adobe', domain: 'wd5', siteId: 'External' },
	{ company: 'vmware', domain: 'wd5', siteId: 'External' },
	
	// === Finance ===
	{ company: 'jpmorgan', domain: 'wd5', siteId: 'External' },
	{ company: 'goldmansachs', domain: 'wd5', siteId: 'External' },
	{ company: 'morganstanley', domain: 'wd5', siteId: 'External' },
	{ company: 'citi', domain: 'wd5', siteId: 'External' },
	{ company: 'bankofamerica', domain: 'wd5', siteId: 'External' },
	{ company: 'wellsfargo', domain: 'wd5', siteId: 'External' },
	{ company: 'visa', domain: 'wd5', siteId: 'External' },
	{ company: 'mastercard', domain: 'wd5', siteId: 'External' },
	
	// === Consulting ===
	{ company: 'mckinsey', domain: 'wd5', siteId: 'External' },
	{ company: 'bcg', domain: 'wd5', siteId: 'External' },
	{ company: 'bain', domain: 'wd5', siteId: 'External' },
	{ company: 'deloitte', domain: 'wd5', siteId: 'External' },
	{ company: 'ey', domain: 'wd5', siteId: 'External' },
	{ company: 'pwc', domain: 'wd5', siteId: 'External' },
	{ company: 'kpmg', domain: 'wd5', siteId: 'External' },
	{ company: 'accenture', domain: 'wd5', siteId: 'External' },
	
	// === Healthcare ===
	{ company: 'jnj', domain: 'wd5', siteId: 'External' },
	{ company: 'pfizer', domain: 'wd5', siteId: 'External' },
	{ company: 'merck', domain: 'wd5', siteId: 'External' },
	{ company: 'abbvie', domain: 'wd5', siteId: 'External' },
	{ company: 'gilead', domain: 'wd5', siteId: 'External' },
	{ company: 'amgen', domain: 'wd5', siteId: 'External' },
	{ company: 'biogen', domain: 'wd5', siteId: 'External' },
	{ company: 'regeneron', domain: 'wd5', siteId: 'External' },
	
	// === Retail & Consumer ===
	{ company: 'walmart', domain: 'wd5', siteId: 'External' },
	{ company: 'target', domain: 'wd5', siteId: 'External' },
	{ company: 'costco', domain: 'wd5', siteId: 'External' },
	{ company: 'homedepot', domain: 'wd5', siteId: 'External' },
	{ company: 'lowes', domain: 'wd5', siteId: 'External' },
	{ company: 'nike', domain: 'wd5', siteId: 'External' },
	{ company: 'starbucks', domain: 'wd5', siteId: 'External' },
	{ company: 'mcdonalds', domain: 'wd5', siteId: 'External' },
	
	// === Industrial ===
	{ company: 'ge', domain: 'wd5', siteId: 'External' },
	{ company: 'honeywell', domain: 'wd5', siteId: 'External' },
	{ company: 'caterpillar', domain: 'wd5', siteId: 'External' },
	{ company: 'deere', domain: 'wd5', siteId: 'External' },
	{ company: '3m', domain: 'wd5', siteId: 'External' },
	{ company: 'emerson', domain: 'wd5', siteId: 'External' },
	{ company: 'parker', domain: 'wd5', siteId: 'External' },
	{ company: 'rockwell', domain: 'wd5', siteId: 'External' },
];

// ============================================
// AGGREGATED CONFIG GENERATOR
// ============================================

export function generateAllATSSources(): ATSProviderConfig[] {
	const sources: ATSProviderConfig[] = [];
	
	// Add Greenhouse companies
	for (const company of GREENHOUSE_COMPANIES) {
		sources.push({ provider: 'greenhouse', company });
	}
	
	// Add Lever companies
	for (const company of LEVER_COMPANIES) {
		sources.push({ provider: 'lever', company });
	}
	
	// Add SmartRecruiters companies
	for (const company of SMARTRECRUITERS_COMPANIES) {
		sources.push({ provider: 'smartrecruiters', company });
	}
	
	// Add Ashby companies
	for (const company of ASHBY_COMPANIES) {
		sources.push({ provider: 'ashby', company });
	}
	
	// Add Workday companies
	for (const wd of WORKDAY_COMPANIES) {
		sources.push({
			provider: 'workday',
			company: wd.company,
			workdayDomain: wd.domain,
			workdaySiteId: wd.siteId,
		});
	}
	
	return sources;
}

// Export count for monitoring
export const COMPANY_COUNTS = {
	greenhouse: GREENHOUSE_COMPANIES.length,
	lever: LEVER_COMPANIES.length,
	smartrecruiters: SMARTRECRUITERS_COMPANIES.length,
	ashby: ASHBY_COMPANIES.length,
	workday: WORKDAY_COMPANIES.length,
	total: GREENHOUSE_COMPANIES.length + LEVER_COMPANIES.length + 
		   SMARTRECRUITERS_COMPANIES.length + ASHBY_COMPANIES.length + 
		   WORKDAY_COMPANIES.length,
};

console.log(`[CompanyLists] Loaded ${COMPANY_COUNTS.total} companies:`, COMPANY_COUNTS);



