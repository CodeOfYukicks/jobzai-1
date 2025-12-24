import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Apollo API types
interface ApolloSearchParams {
  person_titles?: string[];
  person_locations?: string[];
  person_seniorities?: string[];
  organization_num_employees_ranges?: string[];
  organization_industry_tag_ids?: string[];
  organization_not_ids?: string[];
  organization_industries?: string[];  // Industry names as strings
  q_organization_name?: string;  // For target companies search
  per_page?: number;
  page?: number;
}

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  email: string | null;
  linkedin_url: string | null;
  organization: {
    id: string;
    name: string;
    website_url: string | null;
    industry: string | null;
    estimated_num_employees: number | null;
  } | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface ApolloResponse {
  people: ApolloPerson[];
  pagination: {
    page: number;
    per_page: number;
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
 * Search Apollo for contacts matching the campaign targeting criteria
 * Using onRequest with cors: true to avoid CORS issues (same pattern as other functions)
 */
export const searchApolloContacts = onRequest(
  {
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60
  },
  async (req, res) => {
    // Only allow POST
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
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return;
      }

      const userId = decodedToken.uid;
      const { campaignId, targeting, maxResults = 50, expandTitles = true } = req.body;

      if (!campaignId || !targeting) {
        res.status(400).json({ error: 'Missing campaignId or targeting' });
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

      // Import and apply title expansion if enabled
      let personTitles = targeting.personTitles || [];
      if (expandTitles && personTitles.length > 0) {
        const { expandJobTitles } = await import('../data/jobTitleSynonyms');
        const originalCount = personTitles.length;
        personTitles = expandJobTitles(personTitles);
        console.log(`Title expansion: ${originalCount} → ${personTitles.length} titles`);
      }

      // Build Apollo search params
      const searchParams: ApolloSearchParams = {
        per_page: Math.min(maxResults, 100),
        page: 1
      };

      // Map targeting to Apollo params
      if (personTitles.length > 0) {
        searchParams.person_titles = personTitles;
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

      // Map industries to Apollo
      if (targeting.industries?.length > 0) {
        searchParams.organization_industries = targeting.industries;
      }

      console.log('Apollo search params:', JSON.stringify(searchParams));

      // Helper function to call Apollo API
      async function callApolloSearch(params: ApolloSearchParams): Promise<ApolloPerson[]> {
        const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Api-Key': apiKey
          },
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Apollo API error:', response.status, errorText);
          throw new Error(`Apollo API error: ${response.status}`);
        }

        const data: ApolloResponse = await response.json();
        return data.people || [];
      }

      let allPeople: ApolloPerson[] = [];

      // Check if we have target companies (priority blending)
      const targetCompanies = targeting.targetCompanies || [];

      if (targetCompanies.length > 0) {
        console.log('Priority companies specified:', targetCompanies);

        // 1. Search WITH target companies filter (get ~40% = 40 contacts)
        const targetParams: ApolloSearchParams = {
          ...searchParams,
          q_organization_name: targetCompanies.join(' OR '),
          per_page: 40
        };

        console.log('Searching target companies:', targetCompanies.join(', '));
        const targetPeople = await callApolloSearch(targetParams);
        console.log(`Found ${targetPeople.length} people from target companies`);

        // 2. Search WITHOUT company filter (get ~60% = 60 contacts)
        const generalParams: ApolloSearchParams = {
          ...searchParams,
          per_page: 60
        };

        console.log('Searching general prospects...');
        const generalPeople = await callApolloSearch(generalParams);
        console.log(`Found ${generalPeople.length} general prospects`);

        // 3. Merge and dedupe (prioritize target companies)
        const seenIds = new Set<string>();

        // Add target company people first
        for (const person of targetPeople) {
          if (!seenIds.has(person.id)) {
            seenIds.add(person.id);
            allPeople.push(person);
          }
        }

        // Add general people (avoiding duplicates)
        for (const person of generalPeople) {
          if (!seenIds.has(person.id)) {
            seenIds.add(person.id);
            allPeople.push(person);
          }
        }

        console.log(`Total merged: ${allPeople.length} people (${targetPeople.length} from target, ${allPeople.length - targetPeople.length} general)`);

      } else {
        // Standard search (no target companies)
        allPeople = await callApolloSearch(searchParams);
        console.log('Apollo returned', allPeople.length, 'people');
      }

      // Filter out excluded companies
      const excludedCompanies = targeting.excludedCompanies || [];
      const excludedLower = excludedCompanies.map((c: string) => c.toLowerCase());

      let filteredPeople = allPeople.filter(person => {
        if (!person.organization?.name) return true;
        return !excludedLower.some(excluded =>
          person.organization!.name.toLowerCase().includes(excluded)
        );
      });

      // Limit to maxResults
      filteredPeople = filteredPeople.slice(0, maxResults);

      // Store contacts in campaign recipients subcollection
      const batch = db.batch();
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const recipientsRef = campaignRef.collection('recipients');

      const contacts = filteredPeople.map(person => ({
        apolloId: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        fullName: person.name,
        title: person.title,
        email: person.email,
        linkedinUrl: person.linkedin_url,
        company: person.organization?.name || null,
        companyWebsite: person.organization?.website_url || null,
        companyIndustry: person.organization?.industry || null,
        companySize: person.organization?.estimated_num_employees || null,
        location: [person.city, person.state, person.country].filter(Boolean).join(', ') || null,
        status: 'pending',
        emailGenerated: false,
        emailContent: null,
        emailSubject: null,
        sentAt: null,
        openedAt: null,
        repliedAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Mark if from target company
        isTargetCompany: targetCompanies.length > 0 && person.organization?.name
          ? targetCompanies.some(tc =>
            person.organization!.name.toLowerCase().includes(tc.toLowerCase())
          )
          : false
      }));

      // Add each contact to batch
      contacts.forEach(contact => {
        const docRef = recipientsRef.doc();
        batch.set(docRef, contact);
      });

      // Update campaign stats
      batch.update(campaignRef, {
        'stats.contactsFound': contacts.length,
        status: 'contacts_fetched',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      res.status(200).json({
        success: true,
        contactsFound: contacts.length,
        totalAvailable: contacts.length,
        contacts: contacts.map(c => ({
          fullName: c.fullName,
          title: c.title,
          company: c.company,
          hasEmail: !!c.email,
          isTargetCompany: c.isTargetCompany
        }))
      });

    } catch (error: any) {
      console.error('Error searching Apollo:', error);
      res.status(500).json({ error: 'Failed to search Apollo contacts', details: error.message });
    }
  }
);

/**
 * Get Apollo contact email (some emails require enrichment)
 */
export const enrichApolloContact = onRequest(
  {
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Get auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(idToken);

      const { apolloId } = req.body;

      if (!apolloId) {
        res.status(400).json({ error: 'Missing apolloId' });
        return;
      }

      // Get Apollo API key
      const settingsDoc = await db.collection('settings').doc('apollo').get();
      const apiKey = settingsDoc.data()?.API_KEY;

      if (!apiKey) {
        res.status(500).json({ error: 'Apollo API key not configured' });
        return;
      }

      // Call Apollo People Enrichment API
      const response = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify({
          id: apolloId,
          reveal_personal_emails: false
        })
      });

      if (!response.ok) {
        res.status(500).json({ error: 'Failed to enrich contact' });
        return;
      }

      const data = await response.json();

      res.status(200).json({
        success: true,
        email: data.person?.email || null,
        linkedinUrl: data.person?.linkedin_url || null
      });

    } catch (error: any) {
      console.error('Error enriching Apollo contact:', error);
      res.status(500).json({ error: 'Failed to enrich contact', details: error.message });
    }
  }
);
