/**
 * Script to seed Firestore emulator with test job data
 * 
 * IMPORTANT: Start emulators first!
 * Run: firebase emulators:start
 * 
 * Then in another terminal:
 * Run: npm run seed:emulator
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin for EMULATORS
if (!admin.apps.length) {
	admin.initializeApp({
		projectId: 'jobzai-39f7e',
	});
}

// Point to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

// Sample test jobs with realistic data
const testJobs = [
	{
		title: 'Senior Software Engineer',
		company: 'Stripe',
		companyLogo: 'https://logo.clearbit.com/stripe.com',
		location: 'San Francisco, CA',
		description: 'We are looking for a Senior Software Engineer to join our payments platform team. You will work on building scalable systems that process billions of dollars in transactions. Experience with distributed systems, Go, and payment processing is preferred.',
		skills: ['Go', 'Distributed Systems', 'Payment Processing', 'PostgreSQL', 'Kubernetes'],
		applyUrl: 'https://stripe.com/jobs/12345',
		ats: 'greenhouse',
		externalId: 'stripe_12345',
		postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
	},
	{
		title: 'Full Stack Engineer',
		company: 'Notion',
		companyLogo: 'https://logo.clearbit.com/notion.so',
		location: 'Remote',
		description: 'Join Notion to build the next generation of productivity tools. We are looking for a Full Stack Engineer with experience in React, TypeScript, and Node.js. You will work on features that millions of users rely on daily.',
		skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
		applyUrl: 'https://notion.so/jobs/67890',
		ats: 'lever',
		externalId: 'notion_67890',
		postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
	},
	{
		title: 'Software Engineer - Backend',
		company: 'Datadog',
		companyLogo: 'https://logo.clearbit.com/datadoghq.com',
		location: 'New York, NY',
		description: 'Datadog is looking for a Backend Engineer to help build our monitoring and observability platform. You will work on high-throughput systems that process millions of metrics per second. Experience with Python, Go, or Java required.',
		skills: ['Python', 'Go', 'Kafka', 'PostgreSQL', 'Docker'],
		applyUrl: 'https://datadoghq.com/jobs/11111',
		ats: 'greenhouse',
		externalId: 'datadog_11111',
		postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
	},
	{
		title: 'Frontend Engineer',
		company: 'Airbnb',
		companyLogo: 'https://logo.clearbit.com/airbnb.com',
		location: 'San Francisco, CA',
		description: 'Airbnb is seeking a Frontend Engineer to join our host experience team. You will build beautiful, responsive interfaces using React and TypeScript. Experience with design systems and accessibility is a plus.',
		skills: ['React', 'TypeScript', 'CSS', 'Design Systems', 'Accessibility'],
		applyUrl: 'https://airbnb.com/jobs/22222',
		ats: 'greenhouse',
		externalId: 'airbnb_22222',
		postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
	},
	{
		title: 'DevOps Engineer',
		company: 'Microsoft',
		companyLogo: 'https://logo.clearbit.com/microsoft.com',
		location: 'Seattle, WA',
		description: 'Microsoft Azure is looking for a DevOps Engineer to help manage our cloud infrastructure. You will work on automation, CI/CD pipelines, and infrastructure as code. Experience with Azure, Kubernetes, and Terraform preferred.',
		skills: ['Azure', 'Kubernetes', 'Terraform', 'CI/CD', 'Python'],
		applyUrl: 'https://microsoft.com/jobs/33333',
		ats: 'workday',
		externalId: 'microsoft_33333',
		postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
	},
	{
		title: 'Machine Learning Engineer',
		company: 'Google',
		companyLogo: 'https://logo.clearbit.com/google.com',
		location: 'Mountain View, CA',
		description: 'Google Research is seeking a Machine Learning Engineer to work on cutting-edge AI projects. You will develop and deploy ML models at scale. Experience with TensorFlow, PyTorch, and distributed training required.',
		skills: ['TensorFlow', 'PyTorch', 'Python', 'Distributed Systems', 'MLOps'],
		applyUrl: 'https://google.com/jobs/44444',
		ats: 'workday',
		externalId: 'google_44444',
		postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
	},
	{
		title: 'Product Engineer',
		company: 'Brex',
		companyLogo: 'https://logo.clearbit.com/brex.com',
		location: 'Remote',
		description: 'Brex is looking for a Product Engineer to build financial products for startups. You will work across the stack, from React frontends to Go backends. Strong product sense and engineering skills required.',
		skills: ['React', 'Go', 'TypeScript', 'PostgreSQL', 'Product Engineering'],
		applyUrl: 'https://brex.com/jobs/55555',
		ats: 'lever',
		externalId: 'brex_55555',
		postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
	},
	{
		title: 'Senior Backend Engineer',
		company: 'Zapier',
		companyLogo: 'https://logo.clearbit.com/zapier.com',
		location: 'Remote',
		description: 'Zapier is seeking a Senior Backend Engineer to help build our automation platform. You will work on APIs, integrations, and scalable infrastructure. Experience with Python, Django, and API design required.',
		skills: ['Python', 'Django', 'PostgreSQL', 'API Design', 'AWS'],
		applyUrl: 'https://zapier.com/jobs/66666',
		ats: 'lever',
		externalId: 'zapier_66666',
		postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
	},
	{
		title: 'Software Engineer - Platform',
		company: 'Monday',
		companyLogo: 'https://logo.clearbit.com/monday.com',
		location: 'Tel Aviv, Israel',
		description: 'Monday.com is looking for a Platform Engineer to build our core infrastructure. You will work on scalability, performance, and developer experience. Experience with Node.js, TypeScript, and microservices preferred.',
		skills: ['Node.js', 'TypeScript', 'Microservices', 'PostgreSQL', 'Redis'],
		applyUrl: 'https://monday.com/jobs/77777',
		ats: 'greenhouse',
		externalId: 'monday_77777',
		postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
	},
	{
		title: 'Engineering Manager',
		company: 'Rippling',
		companyLogo: 'https://logo.clearbit.com/rippling.com',
		location: 'San Francisco, CA',
		description: 'Rippling is seeking an Engineering Manager to lead a team of engineers building HR and payroll software. You will manage a team of 5-8 engineers and work closely with product and design. Previous management experience required.',
		skills: ['Engineering Management', 'Python', 'React', 'Team Leadership', 'Product Strategy'],
		applyUrl: 'https://rippling.com/jobs/88888',
		ats: 'greenhouse',
		externalId: 'rippling_88888',
		postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
	},
	{
		title: 'Senior Frontend Engineer',
		company: 'Aircall',
		companyLogo: 'https://logo.clearbit.com/aircall.com',
		location: 'Paris, France',
		description: 'Aircall is looking for a Senior Frontend Engineer to build our communication platform. You will work on React applications that handle real-time voice and video calls. Experience with WebRTC and real-time systems preferred.',
		skills: ['React', 'TypeScript', 'WebRTC', 'Real-time Systems', 'WebSockets'],
		applyUrl: 'https://aircall.com/jobs/99999',
		ats: 'smartrecruiters',
		externalId: 'aircall_99999',
		postedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
	},
	{
		title: 'Data Engineer',
		company: 'Intuit',
		companyLogo: 'https://logo.clearbit.com/intuit.com',
		location: 'Mountain View, CA',
		description: 'Intuit is seeking a Data Engineer to build our data infrastructure. You will work on ETL pipelines, data warehouses, and analytics platforms. Experience with Spark, Airflow, and data modeling required.',
		skills: ['Spark', 'Airflow', 'Python', 'SQL', 'Data Warehousing'],
		applyUrl: 'https://intuit.com/jobs/10101',
		ats: 'workday',
		externalId: 'intuit_10101',
		postedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
	},
	{
		title: 'Security Engineer',
		company: 'Devoteam',
		companyLogo: 'https://logo.clearbit.com/devoteam.com',
		location: 'Paris, France',
		description: 'Devoteam is looking for a Security Engineer to help secure our cloud infrastructure and applications. You will work on security audits, penetration testing, and security tooling. Experience with AWS security, OWASP, and security frameworks required.',
		skills: ['Security', 'AWS', 'Penetration Testing', 'OWASP', 'Compliance'],
		applyUrl: 'https://devoteam.com/jobs/20202',
		ats: 'smartrecruiters',
		externalId: 'devoteam_20202',
		postedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
	},
	{
		title: 'Mobile Engineer - iOS',
		company: 'Vestiaire Collective',
		companyLogo: 'https://logo.clearbit.com/vestiaire-collective.com',
		location: 'Paris, France',
		description: 'Vestiaire Collective is seeking an iOS Engineer to build our mobile shopping experience. You will work on Swift and SwiftUI to create beautiful, performant mobile apps. Experience with iOS development and e-commerce preferred.',
		skills: ['Swift', 'SwiftUI', 'iOS', 'Mobile Development', 'E-commerce'],
		applyUrl: 'https://vestiaire-collective.com/jobs/30303',
		ats: 'smartrecruiters',
		externalId: 'vestiaire_30303',
		postedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
	},
];

async function seedEmulator() {
	const db = admin.firestore();
	
	console.log('🌱 Seeding Firestore Emulator with Test Jobs\n');
	console.log('⚠️  Make sure emulators are running: firebase emulators:start');
	console.log('='.repeat(60));
	
	try {
		// Check if emulator is running
		console.log('\n1️⃣  Checking emulator connection...');
		await db.collection('_test').doc('ping').set({ ping: true });
		await db.collection('_test').doc('ping').delete();
		console.log('   ✅ Emulator connection successful');
		
		// Clear existing jobs (optional - comment out if you want to keep existing data)
		console.log('\n2️⃣  Clearing existing jobs collection...');
		const existingJobs = await db.collection('jobs').limit(100).get();
		if (!existingJobs.empty) {
			const batch = db.batch();
			existingJobs.docs.forEach(doc => {
				batch.delete(doc.ref);
			});
			await batch.commit();
			console.log(`   ✓ Cleared ${existingJobs.size} existing jobs`);
		} else {
			console.log('   ✓ No existing jobs to clear');
		}
		
		// Add test jobs
		console.log('\n3️⃣  Adding test jobs...');
		const batch = db.bulkWriter();
		let success = 0;
		let failed = 0;
		
		for (const job of testJobs) {
			const docId = job.externalId || `${job.ats}_${hashString([job.title, job.company, job.applyUrl].join('|'))}`;
			const ref = db.collection('jobs').doc(docId);
			
			const jobDoc = {
				title: job.title,
				company: job.company,
				companyLogo: job.companyLogo || null,
				location: job.location,
				description: job.description,
				skills: job.skills || [],
				applyUrl: job.applyUrl,
				ats: job.ats,
				externalId: job.externalId,
				postedAt: admin.firestore.Timestamp.fromDate(job.postedAt),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};
			
			try {
				batch.set(ref, jobDoc, { merge: true });
				success++;
			} catch (e) {
				failed++;
				console.error(`   ✗ Failed to add job: ${job.title}`, e);
			}
		}
		
		await batch.close();
		console.log(`   ✅ Successfully added ${success} jobs`);
		if (failed > 0) {
			console.log(`   ⚠️  Failed to add ${failed} jobs`);
		}
		
		// Verify seeding
		console.log('\n4️⃣  Verifying seeded data...');
		const verifySnapshot = await db.collection('jobs').get();
		console.log(`   ✅ Total jobs in emulator: ${verifySnapshot.size}`);
		
		// Show sample
		if (verifySnapshot.size > 0) {
			console.log('\n   Sample jobs:');
			verifySnapshot.docs.slice(0, 5).forEach((doc, idx) => {
				const data = doc.data();
				console.log(`   ${idx + 1}. ${data.title} @ ${data.company}`);
				console.log(`      Location: ${data.location}`);
				console.log(`      ATS: ${data.ats}`);
				console.log(`      Posted: ${data.postedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}`);
				console.log('');
			});
		}
		
		console.log('\n' + '='.repeat(60));
		console.log('✅ Seeding complete!');
		console.log('   → You can now test JobBoardPage with these jobs');
		console.log('   → Open http://localhost:5178 and navigate to Job Board');
		
	} catch (error: any) {
		console.error('\n❌ Error seeding emulator:', error);
		console.error('   → Make sure emulators are running: firebase emulators:start');
		console.error('   → Check FIRESTORE_EMULATOR_HOST is set correctly');
		process.exit(1);
	}
}

seedEmulator()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});

