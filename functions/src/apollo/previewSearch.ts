import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Apollo API types (simplified for preview)
interface ApolloSearchParams {
    person_titles?: string[];
    person_locations?: string[];
    person_seniorities?: string[];
    organization_num_employees_ranges?: string[];
    organization_industries?: string[];
    q_organization_name?: string;
    per_page?: number;
    page?: number;
}

interface ApolloResponse {
    pagination: {
        total_entries: number;
        total_pages: number;
    };
}

// Map seniority values to Apollo format
const SENIORITY_MAPPING: Record<string, string> = {
    'entry': 'entry',
    'senior': 'senior',
    'manager': 'manager',
    'director': 'director',
    'vp': 'vp',
    'c_suite': 'c_suite'
};

// Map company size to Apollo ranges
const COMPANY_SIZE_MAPPING: Record<string, string> = {
    '1-10': '1,10',
    '11-50': '11,50',
    '51-200': '51,200',
    '201-500': '201,500',
    '501-1000': '501,1000',
    '1001-5000': '1001,5000',
    '5001+': '5001,10000'
};

/**
 * Preview Apollo search results (count only, no contacts)
 * This is a lightweight endpoint to estimate prospects before creating a campaign
 */
export const previewApolloSearch = onRequest(
    {
        region: 'us-central1',
        cors: true,
        maxInstances: 10,
        timeoutSeconds: 30,
        invoker: 'public' // Allow public access - important for Firebase Hosting rewrites
    },
    async (req, res) => {
        console.log('🔍 previewApolloSearch called - v1.0.1'); // Version tag for tracking
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        try {
            // Get auth token from header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
                return;
            }

            const idToken = authHeader.split('Bearer ')[1];
            try {
                await admin.auth().verifyIdToken(idToken);
            } catch (error) {
                res.status(401).json({ error: 'Unauthorized - Invalid token' });
                return;
            }

            const { targeting } = req.body;

            if (!targeting) {
                res.status(400).json({ error: 'Missing targeting' });
                return;
            }

            // Need at least personTitles and personLocations for a valid preview
            if (!targeting.personTitles?.length || !targeting.personLocations?.length) {
                res.status(200).json({
                    success: true,
                    totalAvailable: 0,
                    isLowVolume: true,
                    message: 'Add job titles and locations to see estimated prospects'
                });
                return;
            }

            // Get Apollo API key from settings
            const settingsDoc = await db.collection('settings').doc('apollo').get();
            if (!settingsDoc.exists) {
                res.status(500).json({ error: 'Apollo API key not configured' });
                return;
            }

            const apiKey = settingsDoc.data()?.API_KEY;
            if (!apiKey) {
                res.status(500).json({ error: 'Apollo API key is empty' });
                return;
            }

            // Build Apollo search params (minimal - just for count)
            const searchParams: ApolloSearchParams = {
                per_page: 1, // Only need pagination info
                page: 1
            };

            // Map targeting to Apollo params
            if (targeting.personTitles?.length > 0) {
                searchParams.person_titles = targeting.personTitles;
            }

            if (targeting.personLocations?.length > 0) {
                searchParams.person_locations = targeting.personLocations;
            }

            if (targeting.seniorities?.length > 0) {
                searchParams.person_seniorities = targeting.seniorities.map(
                    (s: string) => SENIORITY_MAPPING[s] || s
                );
            }

            if (targeting.companySizes?.length > 0) {
                searchParams.organization_num_employees_ranges = targeting.companySizes.map(
                    (s: string) => COMPANY_SIZE_MAPPING[s] || s
                );
            }

            if (targeting.industries?.length > 0) {
                searchParams.organization_industries = targeting.industries;
            }

            // Add target companies if specified
            if (targeting.targetCompanies?.length > 0) {
                searchParams.q_organization_name = targeting.targetCompanies.join(' OR ');
            }

            console.log('Apollo preview params:', JSON.stringify(searchParams));

            // Call Apollo People Search API (minimal request)
            const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'X-Api-Key': apiKey
                },
                body: JSON.stringify(searchParams)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Apollo API error:', response.status, errorText);
                res.status(500).json({ error: `Apollo API error: ${response.status}` });
                return;
            }

            const data: ApolloResponse = await response.json();
            const totalAvailable = data.pagination?.total_entries || 0;
            const isLowVolume = totalAvailable < 20;

            console.log('Apollo preview result:', totalAvailable, 'prospects');

            res.status(200).json({
                success: true,
                totalAvailable,
                isLowVolume,
                message: isLowVolume
                    ? 'Low prospect volume. Consider broadening your search.'
                    : undefined
            });

        } catch (error: any) {
            console.error('Error previewing Apollo search:', error);
            res.status(500).json({ error: 'Failed to preview search', details: error.message });
        }
    }
);
