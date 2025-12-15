#!/usr/bin/env ts-node
/**
 * Manual Test Script for Job Enrichment V4.1
 * 
 * Run with: npx ts-node scripts/test-enrichment-v4.1.ts
 */

import { 
    extractWorkLocation, 
    extractEmploymentType,
    extractExperienceLevel,
    JobDoc 
} from '../functions/src/utils/jobEnrichment';

// Test cases
const testCases = [
    {
        name: '✅ Remote: Explicit in title',
        job: {
            id: 'test-1',
            title: 'Senior Engineer (Remote)',
            description: 'Join our team as a senior software engineer.'
        },
        expectedRemote: true,
        expectedContract: false
    },
    {
        name: '✅ Remote: Fully remote',
        job: {
            id: 'test-2',
            title: 'Backend Developer',
            description: 'This is a fully remote position. Work from anywhere in the world.'
        },
        expectedRemote: true,
        expectedContract: false
    },
    {
        name: '❌ Remote: False positive - "remotely review"',
        job: {
            id: 'test-3',
            title: 'Engineer - Paris Office',
            description: 'We will remotely review your application and get back to you.',
            location: 'Paris, France'
        },
        expectedRemote: false,
        expectedContract: false
    },
    {
        name: '❌ Remote: Office-based',
        job: {
            id: 'test-4',
            title: 'Marketing Manager',
            description: 'Office-based position in downtown London.',
            location: 'London, UK'
        },
        expectedRemote: false,
        expectedContract: false
    },
    {
        name: '✅ Hybrid: Explicit hybrid',
        job: {
            id: 'test-5',
            title: 'Product Designer',
            description: 'Hybrid role - 2 days in office, 3 days remote.'
        },
        expectedRemote: false, // Should be hybrid, not remote
        expectedContract: false
    },
    {
        name: '✅ Contract: Explicit contract position',
        job: {
            id: 'test-6',
            title: 'Contract Software Engineer',
            description: 'Looking for a contractor for a 6-month project.'
        },
        expectedRemote: false,
        expectedContract: true
    },
    {
        name: '✅ Contract: Freelance',
        job: {
            id: 'test-7',
            title: 'Freelance Designer',
            description: 'Freelance opportunity for experienced designers.'
        },
        expectedRemote: false,
        expectedContract: true
    },
    {
        name: '❌ Contract: False positive - "contract negotiations"',
        job: {
            id: 'test-8',
            title: 'Full-time Account Manager',
            description: 'You will be responsible for contract negotiations with clients and managing relationships.'
        },
        expectedRemote: false,
        expectedContract: false
    },
    {
        name: '❌ Contract: False positive - "contract management"',
        job: {
            id: 'test-9',
            title: 'Permanent Operations Manager',
            description: 'Responsibilities include contract management and vendor relations.'
        },
        expectedRemote: false,
        expectedContract: false
    },
    {
        name: '✅ Full-time: Permanent position',
        job: {
            id: 'test-10',
            title: 'Permanent Software Engineer',
            description: 'Full-time permanent position with benefits.'
        },
        expectedRemote: false,
        expectedContract: false
    }
];

console.log('\n🧪 Testing Job Enrichment V4.1\n');
console.log('='.repeat(60));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
    console.log(`\n[${index + 1}/${testCases.length}] ${testCase.name}`);
    console.log('-'.repeat(60));
    
    const job = testCase.job as JobDoc;
    const workLocations = extractWorkLocation(job);
    const experienceLevels = extractExperienceLevel(job);
    const employmentTypes = extractEmploymentType(job, experienceLevels);
    
    console.log(`📋 Title: "${job.title}"`);
    console.log(`📝 Description: "${job.description?.substring(0, 60)}..."`);
    console.log(`📍 Work Locations: ${workLocations.join(', ')}`);
    console.log(`💼 Employment Types: ${employmentTypes.join(', ')}`);
    console.log(`📈 Experience: ${experienceLevels.join(', ')}`);
    
    // Check remote expectation
    const isRemote = workLocations.includes('remote');
    const remoteMatch = isRemote === testCase.expectedRemote;
    
    // Check contract expectation
    const isContract = employmentTypes.includes('contract');
    const contractMatch = isContract === testCase.expectedContract;
    
    const passed = remoteMatch && contractMatch;
    
    if (passed) {
        console.log('✅ PASS');
        passedTests++;
    } else {
        console.log('❌ FAIL');
        if (!remoteMatch) {
            console.log(`   Expected remote=${testCase.expectedRemote}, got ${isRemote}`);
        }
        if (!contractMatch) {
            console.log(`   Expected contract=${testCase.expectedContract}, got ${isContract}`);
        }
        failedTests++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passedTests}/${testCases.length} passed, ${failedTests}/${testCases.length} failed`);

if (failedTests === 0) {
    console.log('\n🎉 All tests passed! V4.1 improvements working as expected.\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Review the output above.\n');
    process.exit(1);
}





