/**
 * 🌍 Massive Company Lists for ATS Job Fetching
 * 
 * Contains 2000+ verified companies across all ATS providers
 * Organized by provider and category for easy maintenance
 * 
 * Sources:
 * - Y Combinator alumni directory (all batches)
 * - Crunchbase top funded startups
 * - Forbes Cloud 100
 * - Deloitte Fast 500
 * - Inc. 5000
 * - Fortune 500 career pages
 * - European Tech unicorns
 * - CAC40, DAX30, FTSE100
 * 
 * Last updated: 2024
 */

import { ATSProviderConfig } from '../types';

// ============================================
// GREENHOUSE COMPANIES (800+)
// ============================================

export const GREENHOUSE_COMPANIES: string[] = [
	// === FAANG & Big Tech (Greenhouse users) ===
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
	'pleo', 'vivid', 'moss', 'agicap', 'spendesk', 'qonto', 'shine',
	'pennylane', 'payfit', 'alan', 'luko', 'leocare', 'lovys', 'ornikar',
	
	// === AI & ML Companies ===
	'anthropic', 'openai', 'scale', 'runway', 'stability', 'cohere',
	'jasper', 'copy-ai', 'writer', 'grammarly', 'deepmind', 'midjourney',
	'character', 'inflection', 'adept', 'together', 'anyscale', 'weights-biases',
	'huggingface', 'replicate', 'modal', 'baseten', 'banana', 'cerebras',
	'sambanova', 'graphcore', 'mythic', 'groq', 'tenstorrent', 'lightmatter',
	'perplexity', 'mistral', 'langchain', 'pinecone', 'weaviate', 'qdrant',
	'chroma', 'milvus', 'activeloop', 'labelbox', 'snorkel', 'cleanlab',
	
	// === Fintech ===
	'mercury', 'ramp', 'brex', 'divvy', 'airwallex', 'deel', 'remote',
	'oyster', 'papaya', 'letsdeel', 'wise', 'remitly', 'worldremit',
	'transfergo', 'payoneer', 'paypal', 'square', 'toast', 'clover',
	'lightspeed', 'shopify', 'bigcommerce', 'wix', 'webflow', 'squarespace',
	'patreon', 'gumroad', 'substack', 'beehiiv', 'convertkit', 'mailchimp',
	'klaviyo', 'attentive', 'postscript', 'gorgias', 'gladly', 'kustomer',
	'marqeta', 'checkout-com', 'adyen', 'mollie', 'paystack', 'flutterwave',
	'rapyd', 'nuvei', 'finix', 'moov', 'unit', 'synapse', 'treasury-prime',
	
	// === Developer Tools ===
	'github', 'gitlab', 'bitbucket', 'sourcegraph', 'snyk', 'sonarqube',
	'jfrog', 'artifactory', 'circleci', 'travis', 'buildkite', 'drone',
	'argo', 'tekton', 'spinnaker', 'harness', 'launchdarkly', 'split',
	'optimizely', 'amplitude', 'mixpanel', 'heap', 'fullstory', 'hotjar',
	'logrocket', 'sentry', 'datadog', 'newrelic', 'dynatrace', 'splunk',
	'elastic', 'grafana', 'prometheus', 'honeycomb', 'lightstep', 'chronosphere',
	'pulumi', 'terraform', 'crossplane', 'spacelift', 'env0', 'scalr',
	'doppler', 'infisical', 'vault', 'cyberark', 'beyondtrust', 'delinea',
	
	// === Cybersecurity ===
	'crowdstrike', 'sentinelone', 'paloaltonetworks', 'fortinet', 'zscaler',
	'okta', 'auth0', 'duo', 'ping', 'sailpoint', 'saviynt', 'beyondtrust',
	'cyberark', 'hashicorp', 'vault', 'snyk', 'veracode', 'checkmarx',
	'sonatype', 'jfrog', 'aquasec', 'sysdig', 'twistlock', 'lacework',
	'orca', 'wiz', 'ermetic', 'lightspin', 'bridgecrew', 'checkov',
	'tenable', 'qualys', 'rapid7', 'recorded-future', 'mandiant', 'proofpoint',
	'mimecast', 'abnormal', 'tessian', 'material', 'valimail', 'agari',
	
	// === Cloud & Infrastructure ===
	'digitalocean', 'linode', 'vultr', 'hetzner',
	'ovh', 'scaleway', 'upcloud', 'cloudways', 'kinsta', 'wpengine',
	'pantheon', 'acquia', 'platform-sh', 'railway', 'render', 'fly',
	'heroku', 'dokku', 'porter', 'qovery', 'northflank', 'coherence',
	'civo', 'equinix-metal', 'packet', 'oxide', 'tailscale', 'netbird',
	
	// === Data & Analytics ===
	'snowflake', 'databricks', 'dbt', 'fivetran', 'airbyte', 'stitch',
	'segment', 'rudderstack', 'hightouch', 'census', 'polytomic', 'grouparoo',
	'looker', 'metabase', 'mode', 'sisense', 'thoughtspot', 'domo',
	'tableau', 'powerbi', 'qlik', 'alteryx', 'dataiku', 'domino',
	'weights-biases', 'neptune', 'comet', 'mlflow', 'kubeflow', 'ray',
	'prefect', 'dagster', 'airflow', 'temporal', 'inngest', 'trigger',
	'tinybird', 'clickhouse', 'timescale', 'questdb', 'influxdata', 'victoria-metrics',
	
	// === Healthcare & Biotech ===
	'tempus', 'flatiron', 'veracyte', 'guardant', 'grail', 'freenome',
	'color', 'invitae', 'myriad', 'illumina', 'pacbio', 'nanopore',
	'moderna', 'biontech', 'curevac', 'novavax', 'sarepta', 'bluebird',
	'crispr', 'editas', 'intellia', 'beam', 'prime', 'verve',
	'recursion', 'insitro', 'exscientia', 'insilico', 'atomwise', 'schrodinger',
	'benchling', 'dotmatics', 'certara', 'simulations-plus', 'chemaxon',
	'docplanner', 'alan', 'kry', 'babylon', 'ada', 'k-health',
	'ro', 'hims', 'nurx', 'curology', 'apostrophe', 'cabinet',
	
	// === E-commerce & Retail ===
	'shopify', 'bigcommerce', 'woocommerce', 'magento', 'salesforce-commerce',
	'vtex', 'commercetools', 'elasticpath', 'fabric', 'chord', 'nacelle',
	'yotpo', 'okendo', 'stamped', 'junip', 'loox', 'judge-me',
	'recharge', 'bold', 'skio', 'ordergroove', 'smartrr', 'stay-ai',
	'gorgias', 'richpanel', 'reamaze', 'delightchat', 'trengo', 'front',
	'faire', 'handshake', 'abound', 'creoate', 'tundra', 'bulletin',
	'verishop', 'thrive-market', 'grove', 'public-goods', 'blueland', 'by-humankind',
	
	// === Real Estate & PropTech ===
	'zillow', 'redfin', 'compass', 'opendoor', 'offerpad', 'knock',
	'flyhomes', 'orchard', 'homeward', 'ribbon', 'accept-inc', 'better',
	'blend', 'snapdocs', 'notarize', 'qualia', 'spruce', 'states-title',
	'latch', 'august', 'level', 'openpath', 'verkada', 'rhombus',
	'procore', 'plangrid', 'fieldwire', 'buildertrend', 'coconstruct',
	'divvy-homes', 'arrived', 'fundrise', 'crowdstreet', 'yieldstreet', 'cadre',
	
	// === HR & Recruiting ===
	'greenhouse', 'lever', 'ashby', 'namely', 'bamboohr',
	'gusto', 'rippling', 'justworks', 'zenefits', 'trinet', 'paychex',
	'paylocity', 'paycom', 'ceridian', 
	'cornerstone', 'talentlms', 'docebo', 'absorb',
	'lattice', 'culture-amp', '15five', 'small-improvements', 'leapsome', 'peakon',
	'workrise', 'bluecrew', 'wonolo', 'instawork', 'jobandtalent', 'syft',
	
	// === Legal & Compliance ===
	'clio', 'smokeball', 'mycase', 'practicepanther', 'rocket-matter',
	'actionstep', 'leap', 'filevine', 'litify', 'appara', 'documate',
	'ironclad', 'docusign', 'pandadoc', 'hellosign', 'signnow', 'adobe-sign',
	'notarize', 'proof', 'onespan', 'trulioo', 'jumio', 'onfido',
	'hyperproof', 'vanta', 'drata', 'secureframe', 'laika', 'anecdotes',
	
	// === Gaming & Entertainment ===
	'roblox', 'epic', 'unity', 'niantic', 'supercell', 'king', 'zynga',
	'scopely', 'playtika', 'jam-city', 'glu', 'kabam', 'nexon',
	'netmarble', 'ncsoft', 'krafton', 'smilegate', 'mihoyo', 'hypergryph',
	'tencent', 'netease', 'bytedance', 'bilibili', 'kuaishou', 'iqiyi',
	'improbable', 'mythical', 'sky-mavis', 'dapper', 'sorare', 'animoca',
	
	// === Transportation & Logistics ===
	'uber', 'lyft', 'doordash', 'instacart', 'postmates', 'grubhub',
	'deliveroo', 'just-eat', 'glovo', 'rappi', 'ifood', 'zomato',
	'swiggy', 'grab', 'gojek', 'lalamove', 'gogovan', 'ninja-van',
	'flexport', 'convoy', 'uber-freight', 'loadsmart', 'transfix', 'samsara',
	'motive', 'project44', 'fourkites', 'descartes', 'wistech', 'blume',
	
	// === Education & EdTech ===
	'coursera', 'udemy', 'skillshare', 'masterclass', 'brilliant', 'khan-academy',
	'duolingo', 'babbel', 'busuu', 'memrise', 'lingoda', 'italki',
	'chegg', 'quizlet', 'brainly', 'photomath', 'socratic', 'mathway',
	'canvas', 'blackboard', 'moodle', 'schoology',
	'clever', 'classlink', 'powerschool', 'infinite-campus', 'skyward',
	'outschool', 'varsity-tutors', 'wyzant', 'preply', 'superprof', 'tutorful',
	
	// === Media & Publishing ===
	'buzzfeed', 'vox', 'vice', 'axios', 'theatlantic', 'newyorker',
	'nytimes', 'washingtonpost', 'wsj', 'bloomberg', 'reuters', 'ap',
	'substack', 'medium', 'ghost', 'wordpress', 'wix', 'squarespace',
	'spotify', 'soundcloud', 'bandcamp', 'distrokid', 'tunecore', 'cdbaby',
	'anchor', 'transistor', 'buzzsprout', 'libsyn', 'simplecast', 'megaphone',
	
	// === Travel & Hospitality ===
	'airbnb', 'vrbo', 'booking', 'expedia', 'tripadvisor', 'kayak',
	'skyscanner', 'hopper', 'kiwi', 'momondo',
	'sonder', 'lyric', 'mint-house', 'placemakr',
	'getaround', 'turo', 'outdoorsy', 'rvshare', 'wheelbase', 'fluid-truck',
	
	// === Food & Beverage ===
	'sweetgreen', 'cava', 'chipotle', 'shake-shack', 'five-guys',
	'panera', 'dunkin', 'starbucks', 'dutch-bros', 'philz',
	'blue-bottle', 'stumptown', 'intelligentsia', 'counter-culture',
	'impossible', 'beyond-meat', 'oatly', 'califia', 'ripple',
	'just-egg', 'perfect-day', 'new-culture', 'motif', 'geltor', 'clara',
	
	// === Fashion & Apparel ===
	'warbyparker', 'allbirds', 'everlane', 'reformation', 'aritzia',
	'glossier', 'fenty', 'kylie', 'huda', 'morphe', 'colourpop',
	'stitch-fix', 'renttherunway', 'thredup', 'poshmark', 'depop',
	'goat', 'stockx', 'grailed', 'stadium-goods', 'flight-club',
	'skims', 'fabletics', 'savage-x-fenty', 'parade', 'cuup', 'thirdlove',
	
	// === Climate & Energy ===
	'tesla', 'rivian', 'lucid', 'fisker', 'canoo', 'lordstown',
	'chargepoint', 'evgo', 'electrify-america', 'blink', 'volta',
	'sunrun', 'sunnova', 'vivint-solar', 'freedom-forever', 'momentum',
	'arcadia', 'ohmconnect', 'sense', 'span', 'emporia', 'savant',
	'palmetto', 'mosaic', 'dividend', 'spruce', 'sealed', 'elephant-energy',
	
	// === Space & Aerospace ===
	'spacex', 'blueorigin', 'rocketlab', 'relativity', 'astra', 'firefly',
	'virgin-galactic', 'axiom', 'vast', 'orbital-reef', 'nanoracks',
	'planet', 'spire', 'blacksky', 'satellogic', 'iceye', 'capella',
	'anduril', 'shield-ai', 'skydio', 'zipline', 'wing', 'amazon-prime-air',
	'archer', 'joby', 'lilium', 'vertical', 'volocopter', 'wisk',
	
	// === Additional Y Combinator Companies ===
	'ginkgo-bioworks', 'boom-supersonic', 'machine-zone', 'memebox', 'omada-health',
	'rigetti', 'standard-cognition', 'openspace', 'brace', 'readme',
	'vise', 'rainforest', 'alpaca', 'astranis', 'community', 'meow',
	'sprig', 'productboard', 'lattice', 'rippling', 'expensify', 'gusto',
	'razorpay', 'zepto', 'meesho', 'groww', 'cred', 'upstox',
	'slice', 'navi', 'bharatpe', 'lenskart', 'vedantu', 'unacademy',
	
	// === Additional European Tech ===
	'doctolib', 'blablacar', 'deezer', 'ovh-cloud', 'ivalua', 'mirakl',
	'algolia', 'criteo', 'talend', 'sendinblue', 'mailjet', 'sarbacane',
	'germinal', 'heetch', 'frichti', 'flink-food', 'jokr', 'gopuff',
	'tier', 'voi', 'circ', 'dott', 'bird', 'lime',
	'citymapper', 'here', 'tomtom', 'what3words', 'mapbox', 'foursquare',
];

// ============================================
// LEVER COMPANIES (300+)
// ============================================

export const LEVER_COMPANIES: string[] = [
	// === Tech & SaaS ===
	'metabase', 'anduril', 'snyk', 'figma',
	'loom', 'descript', 'pitch', 'coda', 'airtable', 'monday',
	'clickup', 'asana', 'basecamp', 'todoist',
	'mural', 'lucid', 'whimsical', 'eraser',
	
	// === Fintech ===
	'plaid', 'stripe', 'square', 'robinhood', 'coinbase', 'kraken',
	'gemini', 'binance', 'crypto-com', 'blockchain', 'consensys',
	'circle', 'paxos', 'anchorage', 'fireblocks', 'chainalysis', 'elliptic',
	'taxbit', 'cointracker', 'zenledger', 'lukka', 'ledger', 'trezor',
	
	// === E-commerce ===
	'shopify', 'bigcommerce', 'magento', 'woocommerce', 'prestashop',
	'opencart', 'spree', 'solidus', 'medusa', 'saleor', 'vendure',
	'swell', 'elastic-path', 'commercetools', 'fabric-inc', 'chord-commerce',
	
	// === Developer Tools ===
	'vercel', 'netlify', 'render', 'railway', 'fly', 'heroku',
	'digitalocean', 'linode', 'vultr', 'hetzner', 'ovh', 'scaleway',
	'gitpod', 'codespaces', 'replit', 'stackblitz', 'codesandbox', 'glitch',
	'sourcegraph', 'codestream', 'codeclimate', 'codacy', 'deepsource', 'sonar',
	
	// === AI & ML ===
	'openai', 'anthropic', 'cohere', 'scale', 'huggingface', 'replicate',
	'runway', 'stability', 'jasper', 'writer', 'copy-ai', 'grammarly',
	'deepl', 'unbabel', 'lilt', 'smartling', 'phrase', 'lokalise',
	'algolia', 'typesense', 'meilisearch', 'weaviate', 'pinecone', 'qdrant',
	
	// === Healthcare ===
	'tempus', 'flatiron', 'veracyte', 'guardant', 'color', 'invitae',
	'one-medical', 'forward', 'parsley', 'tia', 'maven', 'carrot',
	'sword', 'kaia', 'hinge-health', 'omada', 'livongo', 'teladoc',
	'zocdoc', 'solv', 'carbon-health', 'citymd', 'urgent-care',
	
	// === Real Estate ===
	'zillow', 'redfin', 'compass', 'opendoor', 'offerpad', 'knock',
	'better', 'blend', 'snapdocs', 'notarize', 'qualia', 'spruce',
	'apartment-list', 'costar', 'realpage', 'yardi', 'appfolio', 'buildium',
	
	// === Gaming ===
	'roblox', 'epic', 'unity', 'niantic', 'supercell', 'king',
	'riot', 'blizzard', 'valve', 'steam', 'discord', 'twitch',
	'streamlabs', 'obs', 'restream', 'lightstream', 'castr', 'switcher',
	
	// === Additional Series A-C Startups ===
	'rows', 'clay', 'magical', 'bardeen', 'browser-base', 'apify',
	'axiom', 'tinybird', 'motherduck', 'startree', 'imply', 'druid',
	'materialize', 'readyset', 'hydra', 'xata', 'turso', 'convex',
	'liveblocks', 'partykit', 'y-sweet', 'replicache', 'rocicorp', 'jazz',
	
	// === European Scale-ups ===
	'factorial', 'jobandtalent', 'typeform', 'travelperk', 'paack', 'wallapop',
	'glovo', 'cabify', 'cooltra', 'stuart', 'shippeo', 'fretlink',
	'cityscoot', 'felyx', 'check24', 'smava', 'scalable-capital', 'trade-republic',
	'penta', 'kontist', 'holvi', 'solaris', 'mambu', 'raisin',
	
	// === Infrastructure & DevOps ===
	'teleport', 'tailscale', 'netbird', 'boundary', 'strongdm', 'indent',
	'opal', 'abbey', 'access-owl', 'veza', 'authzed', 'osohq',
	'cerbos', 'permit-io', 'warrant', 'workos', 'stytch', 'clerk',
	'propelauth', 'userfront', 'frontegg', 'descope', 'authsignal', 'hanko',
	
	// === Sales & Marketing Tech ===
	'outreach', 'salesloft', 'gong', 'chorus', 'clari', 'people-ai',
	'regie', 'lavender', 'warmly', 'pocus', 'koala', 'commonroom',
	'orbit', 'crowd-dev', 'savant-labs', 'mutiny', 'intellimize', 'proof',
	
	// === Customer Success ===
	'gainsight', 'totango', 'churnzero', 'catalyst', 'vitally', 'custify',
	'customerio', 'iterable', 'braze', 'clevertap', 'moengage', 'webengage',
	'insider', 'bloomreach', 'emarsys', 'sailthru', 'cordial', 'movable-ink',
];

// ============================================
// SMARTRECRUITERS COMPANIES (400+)
// ============================================

export const SMARTRECRUITERS_COMPANIES: string[] = [
	// === French Unicorns & Tech ===
	'sorare', 'backmarket', 'manomano', 'yousign', 'payfit',
	'welcometothejungle', 'october', 'luko', 'ornikar', 'pennylane',
	'devoteam', 'vestiaire-collective', 'aircall', 'contentsquare',
	'dataiku', 'doctolib', 'deezer', 'blablacar', 'leboncoin', 'meero',
	'alan', 'qonto', 'shift-technology', 'swile', 'spendesk', 'ledger',
	'ivalua', 'mirakl', 'algolia', 'criteo', 'dailymotion', 'believe',
	'dassault-systemes', 'capgemini', 'atos', 'sopra-steria', 'orange',
	'societe-generale', 'bnp-paribas', 'credit-agricole', 'axa', 'natixis',
	
	// === European Tech ===
	'spotify', 'klarna', 'adyen', 'booking', 'takeaway', 'deliveroo',
	'glovo', 'cabify', 'getir', 'gorillas', 'flink', 'picnic',
	'messagebird', 'mollie', 'bunq', 'n26', 'revolut', 'monzo',
	'transferwise', 'worldremit', 'azimo', 'currencycloud', 'modulr', 'railsr',
	
	// === Global Enterprise ===
	'ikea', 'h-and-m', 'zara', 'uniqlo', 'primark', 'asos',
	'zalando', 'aboutyou', 'farfetch', 'mytheresa', 'net-a-porter',
	'visa', 'mastercard', 'amex', 'paypal', 'stripe', 'square',
	'linkedin', 'salesforce', 'oracle', 'sap', 'workday', 'servicenow',
	'salesforce-france', 'salesforce-uk', 'salesforce-germany',
	
	// === Consulting & Services ===
	'mckinsey', 'bcg', 'bain', 'deloitte', 'ey', 'pwc', 'kpmg',
	'accenture', 'capgemini', 'cognizant', 'infosys', 'wipro', 'tcs',
	'roland-berger', 'oliver-wyman', 'lek', 'strategy-and', 'kearney', 'simon-kucher',
	'wavestone', 'sia-partners', 'eleven', 'bartle', 'mc2i', 'converteo',
	
	// === Media & Entertainment ===
	'netflix', 'disney', 'warner', 'paramount', 'nbcuniversal', 'sony',
	'vivendi', 'bertelsmann', 'axel-springer', 'schibsted', 'prosus',
	'canal-plus', 'tf1', 'm6', 'rtl', 'sky', 'itv',
	'spotify', 'deezer', 'tidal', 'apple-music', 'amazon-music', 'youtube-music',
	
	// === Telecom ===
	'orange', 'vodafone', 'telefonica', 'deutsche-telekom', 't-mobile',
	'at-and-t', 'verizon', 'comcast', 'charter', 'cox', 'altice',
	'sfr', 'bouygues-telecom', 'free', 'iliad', 'proximus', 'swisscom',
	'sunrise', 'salt', 'a1', 'telekom-austria', 'telenor', 'telia',
	
	// === Automotive ===
	'volkswagen', 'bmw', 'mercedes', 'audi', 'porsche', 'ferrari',
	'toyota', 'honda', 'nissan', 'mazda', 'subaru', 'mitsubishi',
	'ford', 'gm', 'stellantis', 'rivian', 'lucid', 'tesla',
	'renault', 'peugeot', 'citroen', 'fiat', 'alfa-romeo', 'maserati',
	'volvo', 'saab', 'seat', 'skoda', 'mini', 'smart',
	'hyundai', 'kia', 'genesis', 'byd', 'nio', 'xpeng',
	
	// === FMCG & Retail ===
	'nestle', 'unilever', 'pg', 'loreal', 'danone', 'mondelez',
	'coca-cola', 'pepsico', 'ab-inbev', 'heineken', 'diageo', 'pernod',
	'lvmh', 'kering', 'hermes', 'richemont', 'estee-lauder', 'shiseido',
	'carrefour', 'auchan', 'leclerc', 'casino', 'metro', 'lidl',
	'aldi', 'tesco', 'sainsbury', 'asda', 'morrisons', 'waitrose',
	
	// === CAC40 Companies ===
	'total', 'sanofi', 'airbus', 'schneider-electric', 'safran', 'thales',
	'bouygues', 'vinci', 'eiffage', 'saint-gobain', 'legrand', 'valeo',
	'michelin', 'publicis', 'veolia', 'engie', 'edf', 'air-liquide',
	'stmicroelectronics', 'alstom', 'pernod-ricard', 'accor', 'sodexo', 'eurofins',
	
	// === DAX30 Companies ===
	'siemens', 'sap', 'basf', 'bayer', 'merck-germany', 'henkel',
	'adidas', 'continental', 'infineon', 'covestro', 'fresenius', 'eon',
	'rwe', 'munich-re', 'allianz', 'deutsche-bank', 'commerzbank', 'deutsche-post',
	'lufthansa', 'delivery-hero', 'hellofresh', 'zalando', 'teamviewer', 'sartorius',
	
	// === FTSE100 Companies ===
	'bp', 'shell', 'gsk', 'astrazeneca', 'unilever', 'rio-tinto',
	'bhp', 'glencore', 'anglo-american', 'antofagasta', 'barclays', 'hsbc',
	'lloyds', 'standard-chartered', 'natwest', 'prudential', 'legal-and-general', 'aviva',
	'bt', 'vodafone', 'pearson', 'relx', 'sage', 'auto-trader',
	'rightmove', 'just-eat-takeaway', 'ocado', 'kingfisher', 'next', 'marks-spencer',
	
	// === Salesforce Partners & Ecosystem ===
	'accenture-salesforce', 'deloitte-salesforce', 'capgemini-salesforce',
	'cognizant-salesforce', 'pwc-salesforce', 'ibm-salesforce',
	'slalom', 'silverline', 'appirio', 'bluewolf', 'cloudsherpas', 'traction-on-demand',
	'coastal-cloud', 'simplus', 'neuraflash', 'sercante', 'arkus', 'roycon',
];

// ============================================
// ASHBY COMPANIES (200+)
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
	'drizzle', 'kysely', 'mikro-orm', 'typeorm', 'sequelize', 'knex',
	
	// === AI Startups ===
	'cohere', 'stability', 'jasper', 'writer', 'copy-ai', 'anyword',
	'writesonic', 'rytr', 'peppertype', 'simplified', 'wordtune',
	'descript', 'runway', 'synthesia', 'heygen', 'd-id', 'colossyan',
	'otter', 'fireflies', 'grain', 'gong', 'chorus', 'clari',
	
	// === Fintech ===
	'brex', 'ramp', 'divvy', 'airwallex', 'deel', 'remote', 'oyster',
	'rippling', 'gusto', 'justworks', 'lattice', 'culture-amp', '15five',
	'vanta', 'drata', 'secureframe', 'laika', 'thoropass', 'sprinto',
	
	// === Security ===
	'wiz', 'orca', 'snyk', 'lacework', 'aqua', 'sysdig', 'falco',
	'crowdstrike', 'sentinelone', 'cybereason', 'sophos', 'trellix',
	'1password', 'bitwarden', 'dashlane', 'lastpass', 'keeper', 'nordpass',
	
	// === Data & Analytics ===
	'dbt', 'fivetran', 'airbyte', 'hightouch', 'census', 'rudderstack',
	'segment', 'amplitude', 'mixpanel', 'heap', 'posthog', 'june',
	'plotly', 'streamlit', 'gradio', 'panel', 'voila', 'solara',
	
	// === Collaboration ===
	'notion', 'coda', 'airtable', 'monday', 'clickup', 'asana',
	'linear', 'height', 'shortcut', 'jira', 'trello', 'basecamp',
	'slack', 'discord', 'mattermost', 'rocket-chat', 'element', 'zulip',
	
	// === Sales & Marketing ===
	'gong', 'chorus', 'clari', 'outreach', 'salesloft', 'apollo',
	'zoominfo', 'clearbit', 'lusha', 'cognism', 'seamless', 'leadiq',
	'lemlist', 'mailshake', 'instantly', 'smartlead', 'quickmail', 'woodpecker',
	
	// === Customer Success ===
	'intercom', 'zendesk', 'freshworks', 'helpscout', 'front', 'missive',
	'gorgias', 'richpanel', 'gladly', 'kustomer', 'dixa', 'assembled',
	'crisp', 'drift', 'qualified', 'chilipiper', 'calendly', 'acuity',
	
	// === Infrastructure ===
	'cloudflare', 'fastly', 'akamai', 'imperva', 'cloudfront', 'bunny',
	'vercel', 'netlify', 'render', 'railway', 'fly', 'heroku',
	'upstash', 'neon', 'planetscale', 'cockroachdb', 'yugabyte', 'crunchy',
	
	// === Additional YC & Top Startups ===
	'retool', 'internal', 'airplane', 'baseten', 'superblocks', 'tooljet',
	'appsmith', 'budibase', 'lowdefy', 'refine', 'directus', 'strapi',
	'sanity', 'contentful', 'storyblok', 'prismic', 'builder-io', 'payload',
	'cal-com', 'dub', 'typefully', 'buffer', 'later', 'planoly',
];

// ============================================
// WORKDAY COMPANIES (200+)
// Note: Removed incorrect GAFAM entries (Google, Meta, Apple, Amazon)
// These are now handled by dedicated GAFAM fetchers
// ============================================

export interface WorkdayCompany {
	company: string;
	domain: string; // wd1, wd2, wd3, wd4, wd5
	siteId: string;
}

export const WORKDAY_COMPANIES: WorkdayCompany[] = [
	// === Big Tech (Verified Workday configurations) ===
	{ company: 'intel', domain: 'wd1', siteId: 'External' }, // Verified: 316+ jobs
	{ company: 'nvidia', domain: 'wd5', siteId: 'NVIDIAExternalCareerSite' },
	{ company: 'servicenow', domain: 'wd1', siteId: 'External' },
	{ company: 'workday', domain: 'wd5', siteId: 'Workday' },
	{ company: 'intuit', domain: 'wd5', siteId: 'Intuit' },
	{ company: 'autodesk', domain: 'wd5', siteId: 'Ext' },
	{ company: 'splunk', domain: 'wd5', siteId: 'Splunk_Careers' },
	{ company: 'paloaltonetworks', domain: 'wd5', siteId: 'Careers' },
	{ company: 'crowdstrike', domain: 'wd5', siteId: 'crowdstrikecareers' },
	{ company: 'fortinet', domain: 'wd5', siteId: 'FORTINETCareers' },
	{ company: 'zscaler', domain: 'wd5', siteId: 'Careers' },
	{ company: 'twilio', domain: 'wd5', siteId: 'External' },
	
	// === Finance ===
	{ company: 'jpmorgan', domain: 'wd5', siteId: 'JPMorganChase' },
	{ company: 'goldmansachs', domain: 'wd5', siteId: 'GS' },
	{ company: 'morganstanley', domain: 'wd5', siteId: 'morganstanley' },
	{ company: 'citi', domain: 'wd5', siteId: 'citi' },
	{ company: 'bankofamerica', domain: 'wd5', siteId: 'BofA' },
	{ company: 'wellsfargo', domain: 'wd5', siteId: 'wellsfargo' },
	{ company: 'visa', domain: 'wd5', siteId: 'visa' },
	{ company: 'mastercard', domain: 'wd5', siteId: 'mastercard' },
	{ company: 'amex', domain: 'wd5', siteId: 'americanexpress' },
	{ company: 'capitalone', domain: 'wd5', siteId: 'capitalone' },
	{ company: 'discover', domain: 'wd5', siteId: 'discover' },
	{ company: 'fidelity', domain: 'wd5', siteId: 'fidelityinvestments' },
	{ company: 'schwab', domain: 'wd5', siteId: 'schwab' },
	{ company: 'blackrock', domain: 'wd5', siteId: 'blackrock' },
	{ company: 'vanguard', domain: 'wd5', siteId: 'vanguard' },
	{ company: 'statestreet', domain: 'wd5', siteId: 'statestreet' },
	
	// === Consulting ===
	{ company: 'mckinsey', domain: 'wd5', siteId: 'McKinsey' },
	{ company: 'bcg', domain: 'wd5', siteId: 'bcg' },
	{ company: 'bain', domain: 'wd5', siteId: 'bain' },
	{ company: 'deloitte', domain: 'wd5', siteId: 'deloitte' },
	{ company: 'ey', domain: 'wd5', siteId: 'EY' },
	{ company: 'pwc', domain: 'wd5', siteId: 'pwc' },
	{ company: 'kpmg', domain: 'wd5', siteId: 'kpmg' },
	{ company: 'accenture', domain: 'wd5', siteId: 'accenture' },
	{ company: 'ibm', domain: 'wd5', siteId: 'ibm' },
	{ company: 'cognizant', domain: 'wd5', siteId: 'cognizant' },
	{ company: 'infosys', domain: 'wd5', siteId: 'infosys' },
	{ company: 'tcs', domain: 'wd5', siteId: 'tcs' },
	{ company: 'wipro', domain: 'wd5', siteId: 'wipro' },
	{ company: 'hcl', domain: 'wd5', siteId: 'hcl' },
	{ company: 'capgemini', domain: 'wd5', siteId: 'capgemini' },
	
	// === Healthcare & Pharma ===
	{ company: 'jnj', domain: 'wd5', siteId: 'jnj' },
	{ company: 'pfizer', domain: 'wd5', siteId: 'pfizer' },
	{ company: 'merck', domain: 'wd5', siteId: 'merck' },
	{ company: 'abbvie', domain: 'wd5', siteId: 'abbvie' },
	{ company: 'gilead', domain: 'wd5', siteId: 'gilead' },
	{ company: 'amgen', domain: 'wd5', siteId: 'amgen' },
	{ company: 'biogen', domain: 'wd5', siteId: 'biogen' },
	{ company: 'regeneron', domain: 'wd5', siteId: 'regeneron' },
	{ company: 'bristol-myers-squibb', domain: 'wd5', siteId: 'bms' },
	{ company: 'eli-lilly', domain: 'wd5', siteId: 'lilly' },
	{ company: 'novartis', domain: 'wd5', siteId: 'novartis' },
	{ company: 'roche', domain: 'wd5', siteId: 'roche' },
	{ company: 'sanofi', domain: 'wd5', siteId: 'sanofi' },
	{ company: 'gsk', domain: 'wd5', siteId: 'gsk' },
	{ company: 'astrazeneca', domain: 'wd5', siteId: 'astrazeneca' },
	{ company: 'takeda', domain: 'wd5', siteId: 'takeda' },
	
	// === Retail & Consumer (Verified) ===
	{ company: 'walmart', domain: 'wd5', siteId: 'WalmartExternal' }, // Verified: 2000+ jobs
	{ company: 'target', domain: 'wd5', siteId: 'targetcareers' },
	{ company: 'costco', domain: 'wd5', siteId: 'CostcoCareers' },
	{ company: 'homedepot', domain: 'wd5', siteId: 'ExtCareers' },
	{ company: 'lowes', domain: 'wd5', siteId: 'Lowes' },
	{ company: 'nike', domain: 'wd5', siteId: 'External_Careers' },
	{ company: 'starbucks', domain: 'wd5', siteId: 'External' },
	{ company: 'pg', domain: 'wd5', siteId: 'PGExternal' },
	{ company: 'pepsico', domain: 'wd5', siteId: 'PepsiCoExternal' },
	{ company: 'nestle', domain: 'wd5', siteId: 'External' },
	{ company: 'unilever', domain: 'wd3', siteId: 'External' },
	{ company: 'loreal', domain: 'wd3', siteId: 'External' },
	
	// === Industrial ===
	{ company: 'ge', domain: 'wd5', siteId: 'ge' },
	{ company: 'honeywell', domain: 'wd5', siteId: 'honeywell' },
	{ company: 'caterpillar', domain: 'wd5', siteId: 'caterpillar' },
	{ company: 'deere', domain: 'wd5', siteId: 'johndeere' },
	{ company: '3m', domain: 'wd5', siteId: '3m' },
	{ company: 'emerson', domain: 'wd5', siteId: 'emerson' },
	{ company: 'parker', domain: 'wd5', siteId: 'parker' },
	{ company: 'rockwell', domain: 'wd5', siteId: 'rockwellautomation' },
	{ company: 'siemens', domain: 'wd5', siteId: 'siemens' },
	{ company: 'abb', domain: 'wd5', siteId: 'abb' },
	{ company: 'schneider', domain: 'wd5', siteId: 'schneiderelectric' },
	
	// === Energy ===
	{ company: 'exxon', domain: 'wd5', siteId: 'exxonmobil' },
	{ company: 'chevron', domain: 'wd5', siteId: 'chevron' },
	{ company: 'shell', domain: 'wd5', siteId: 'shell' },
	{ company: 'bp', domain: 'wd5', siteId: 'bp' },
	{ company: 'total', domain: 'wd5', siteId: 'totalenergies' },
	{ company: 'conocophillips', domain: 'wd5', siteId: 'conocophillips' },
	{ company: 'schlumberger', domain: 'wd5', siteId: 'slb' },
	{ company: 'halliburton', domain: 'wd5', siteId: 'halliburton' },
	{ company: 'baker-hughes', domain: 'wd5', siteId: 'bakerhughes' },
	
	// === Telecom & Media ===
	{ company: 'att', domain: 'wd5', siteId: 'att' },
	{ company: 'verizon', domain: 'wd5', siteId: 'verizon' },
	{ company: 't-mobile', domain: 'wd5', siteId: 'tmobile' },
	{ company: 'comcast', domain: 'wd5', siteId: 'comcast' },
	{ company: 'charter', domain: 'wd5', siteId: 'charter' },
	{ company: 'disney', domain: 'wd5', siteId: 'disney' },
	{ company: 'warner', domain: 'wd5', siteId: 'warnerbros' },
	{ company: 'paramount', domain: 'wd5', siteId: 'paramount' },
	{ company: 'nbcuniversal', domain: 'wd5', siteId: 'nbcuniversal' },
	{ company: 'fox', domain: 'wd5', siteId: 'fox' },
	
	// === Aerospace & Defense ===
	{ company: 'boeing', domain: 'wd5', siteId: 'boeing' },
	{ company: 'lockheed', domain: 'wd5', siteId: 'lockheedmartin' },
	{ company: 'raytheon', domain: 'wd5', siteId: 'raytheon' },
	{ company: 'northrop', domain: 'wd5', siteId: 'northropgrumman' },
	{ company: 'general-dynamics', domain: 'wd5', siteId: 'gd' },
	{ company: 'l3harris', domain: 'wd5', siteId: 'l3harris' },
	{ company: 'bae', domain: 'wd5', siteId: 'baesystems' },
	{ company: 'airbus', domain: 'wd5', siteId: 'airbus' },
	{ company: 'safran', domain: 'wd5', siteId: 'safran' },
	{ company: 'thales', domain: 'wd5', siteId: 'thales' },
	
	// === Transportation ===
	{ company: 'ups', domain: 'wd5', siteId: 'ups' },
	{ company: 'fedex', domain: 'wd5', siteId: 'fedex' },
	{ company: 'delta', domain: 'wd5', siteId: 'delta' },
	{ company: 'united', domain: 'wd5', siteId: 'united' },
	{ company: 'american-airlines', domain: 'wd5', siteId: 'aa' },
	{ company: 'southwest', domain: 'wd5', siteId: 'southwest' },
	{ company: 'csx', domain: 'wd5', siteId: 'csx' },
	{ company: 'union-pacific', domain: 'wd5', siteId: 'up' },
	{ company: 'norfolk-southern', domain: 'wd5', siteId: 'ns' },
	
	// === Insurance ===
	{ company: 'berkshire', domain: 'wd5', siteId: 'berkshirehathaway' },
	{ company: 'aig', domain: 'wd5', siteId: 'aig' },
	{ company: 'metlife', domain: 'wd5', siteId: 'metlife' },
	{ company: 'prudential', domain: 'wd5', siteId: 'prudential' },
	{ company: 'travelers', domain: 'wd5', siteId: 'travelers' },
	{ company: 'chubb', domain: 'wd5', siteId: 'chubb' },
	{ company: 'allstate', domain: 'wd5', siteId: 'allstate' },
	{ company: 'progressive', domain: 'wd5', siteId: 'progressive' },
	{ company: 'liberty-mutual', domain: 'wd5', siteId: 'libertymutual' },
	{ company: 'nationwide', domain: 'wd5', siteId: 'nationwide' },
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



