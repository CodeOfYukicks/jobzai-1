import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

// Types
export interface ApolloTargeting {
  personTitles: string[];
  personLocations: string[];
  seniorities: string[];
  companySizes: string[];
  industries: string[];
  excludedCompanies: string[];
}

export interface ApolloContactPreview {
  fullName: string;
  title: string;
  company: string | null;
  hasEmail: boolean;
}

export interface SearchApolloResult {
  success: boolean;
  contactsFound: number;
  totalAvailable: number;
  contacts: ApolloContactPreview[];
}

export interface ApolloRecipient {
  id: string;
  apolloId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  company: string | null;
  companyWebsite: string | null;
  companyIndustry: string | null;
  companySize: number | null;
  location: string | null;
  status: 'pending' | 'email_generated' | 'sent' | 'opened' | 'replied';
  emailGenerated: boolean;
  emailContent: string | null;
  emailSubject: string | null;
}

// Backend URL - use environment variable or default to localhost for dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : '');

// ============ DEMO MODE: Fake TV/Movie Characters ============
const DEMO_CONTACTS = [
  // The Office
  { firstName: 'Michael', lastName: 'Scott', title: 'Regional Manager', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Dwight', lastName: 'Schrute', title: 'Assistant to the Regional Manager', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Jim', lastName: 'Halpert', title: 'Sales Representative', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Pam', lastName: 'Beesly', title: 'Office Administrator', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Andy', lastName: 'Bernard', title: 'Sales Manager', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Stanley', lastName: 'Hudson', title: 'Senior Sales Representative', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Kevin', lastName: 'Malone', title: 'Accountant', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Angela', lastName: 'Martin', title: 'Head of Accounting', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Oscar', lastName: 'Martinez', title: 'Senior Accountant', company: 'Dunder Mifflin', location: 'Scranton, PA', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },
  { firstName: 'Ryan', lastName: 'Howard', title: 'VP of Innovation', company: 'Dunder Mifflin', location: 'New York, NY', industry: 'Paper & Packaging', companySize: 250, companyWebsite: 'dundermifflin.com' },

  // Breaking Bad
  { firstName: 'Walter', lastName: 'White', title: 'CEO & Founder', company: 'Gray Matter Technologies', location: 'Albuquerque, NM', industry: 'Chemicals', companySize: 500, companyWebsite: 'graymatter.com' },
  { firstName: 'Jesse', lastName: 'Pinkman', title: 'Operations Manager', company: 'Vamonos Pest', location: 'Albuquerque, NM', industry: 'Services', companySize: 15, companyWebsite: 'vamonospest.com' },
  { firstName: 'Saul', lastName: 'Goodman', title: 'Managing Partner', company: 'Goodman & Associates', location: 'Albuquerque, NM', industry: 'Legal Services', companySize: 25, companyWebsite: 'bettercallsaul.com' },
  { firstName: 'Gus', lastName: 'Fring', title: 'CEO', company: 'Los Pollos Hermanos', location: 'Albuquerque, NM', industry: 'Food & Beverage', companySize: 450, companyWebsite: 'lospolloshermanos.com' },
  { firstName: 'Mike', lastName: 'Ehrmantraut', title: 'Head of Security', company: 'Madrigal Electromotive', location: 'Albuquerque, NM', industry: 'Industrial', companySize: 2000, companyWebsite: 'madrigal.com' },

  // Game of Thrones
  { firstName: 'Jon', lastName: 'Snow', title: 'Commander', company: 'Night\'s Watch Defense', location: 'The Wall, Westeros', industry: 'Defense', companySize: 1000, companyWebsite: 'nightswatch.io' },
  { firstName: 'Daenerys', lastName: 'Targaryen', title: 'CEO', company: 'Dragon Ventures', location: 'Dragonstone, Westeros', industry: 'Energy', companySize: 800, companyWebsite: 'dragonventures.com' },
  { firstName: 'Tyrion', lastName: 'Lannister', title: 'Chief Advisor', company: 'Lannister Holdings', location: 'King\'s Landing, Westeros', industry: 'Finance', companySize: 5000, companyWebsite: 'lannisterholdings.com' },
  { firstName: 'Cersei', lastName: 'Lannister', title: 'Chairwoman', company: 'Lannister Holdings', location: 'King\'s Landing, Westeros', industry: 'Finance', companySize: 5000, companyWebsite: 'lannisterholdings.com' },
  { firstName: 'Arya', lastName: 'Stark', title: 'Head of Covert Operations', company: 'Stark Industries', location: 'Winterfell, Westeros', industry: 'Security', companySize: 300, companyWebsite: 'starkindustries.io' },
  { firstName: 'Sansa', lastName: 'Stark', title: 'Managing Director', company: 'Stark Industries', location: 'Winterfell, Westeros', industry: 'Security', companySize: 300, companyWebsite: 'starkindustries.io' },

  // Suits
  { firstName: 'Harvey', lastName: 'Specter', title: 'Senior Partner', company: 'Pearson Specter Litt', location: 'New York, NY', industry: 'Legal Services', companySize: 200, companyWebsite: 'pearsonspecterlitt.com' },
  { firstName: 'Mike', lastName: 'Ross', title: 'Associate Attorney', company: 'Pearson Specter Litt', location: 'New York, NY', industry: 'Legal Services', companySize: 200, companyWebsite: 'pearsonspecterlitt.com' },
  { firstName: 'Jessica', lastName: 'Pearson', title: 'Managing Partner', company: 'Pearson Specter Litt', location: 'New York, NY', industry: 'Legal Services', companySize: 200, companyWebsite: 'pearsonspecterlitt.com' },
  { firstName: 'Louis', lastName: 'Litt', title: 'Senior Partner', company: 'Pearson Specter Litt', location: 'New York, NY', industry: 'Legal Services', companySize: 200, companyWebsite: 'pearsonspecterlitt.com' },
  { firstName: 'Donna', lastName: 'Paulsen', title: 'COO', company: 'Pearson Specter Litt', location: 'New York, NY', industry: 'Legal Services', companySize: 200, companyWebsite: 'pearsonspecterlitt.com' },

  // Parks and Recreation
  { firstName: 'Leslie', lastName: 'Knope', title: 'Deputy Director', company: 'Pawnee Parks Department', location: 'Pawnee, IN', industry: 'Government', companySize: 50, companyWebsite: 'pawneeparks.gov' },
  { firstName: 'Ron', lastName: 'Swanson', title: 'Director', company: 'Pawnee Parks Department', location: 'Pawnee, IN', industry: 'Government', companySize: 50, companyWebsite: 'pawneeparks.gov' },
  { firstName: 'Ben', lastName: 'Wyatt', title: 'City Manager', company: 'City of Pawnee', location: 'Pawnee, IN', industry: 'Government', companySize: 150, companyWebsite: 'pawnee.gov' },
  { firstName: 'Tom', lastName: 'Haverford', title: 'Founder & CEO', company: 'Tom\'s Bistro', location: 'Pawnee, IN', industry: 'Hospitality', companySize: 30, companyWebsite: 'tomsbistro.com' },
  { firstName: 'April', lastName: 'Ludgate', title: 'Executive Assistant', company: 'Pawnee Parks Department', location: 'Pawnee, IN', industry: 'Government', companySize: 50, companyWebsite: 'pawneeparks.gov' },

  // Brooklyn Nine-Nine
  { firstName: 'Jake', lastName: 'Peralta', title: 'Detective', company: 'NYPD 99th Precinct', location: 'Brooklyn, NY', industry: 'Law Enforcement', companySize: 100, companyWebsite: 'nypd.gov' },
  { firstName: 'Amy', lastName: 'Santiago', title: 'Sergeant', company: 'NYPD 99th Precinct', location: 'Brooklyn, NY', industry: 'Law Enforcement', companySize: 100, companyWebsite: 'nypd.gov' },
  { firstName: 'Raymond', lastName: 'Holt', title: 'Captain', company: 'NYPD 99th Precinct', location: 'Brooklyn, NY', industry: 'Law Enforcement', companySize: 100, companyWebsite: 'nypd.gov' },
  { firstName: 'Rosa', lastName: 'Diaz', title: 'Detective', company: 'NYPD 99th Precinct', location: 'Brooklyn, NY', industry: 'Law Enforcement', companySize: 100, companyWebsite: 'nypd.gov' },
  { firstName: 'Terry', lastName: 'Jeffords', title: 'Lieutenant', company: 'NYPD 99th Precinct', location: 'Brooklyn, NY', industry: 'Law Enforcement', companySize: 100, companyWebsite: 'nypd.gov' },

  // Mad Men
  { firstName: 'Don', lastName: 'Draper', title: 'Creative Director', company: 'Sterling Cooper Draper Pryce', location: 'New York, NY', industry: 'Advertising', companySize: 150, companyWebsite: 'sterlingcooper.com' },
  { firstName: 'Peggy', lastName: 'Olson', title: 'Copy Chief', company: 'Sterling Cooper Draper Pryce', location: 'New York, NY', industry: 'Advertising', companySize: 150, companyWebsite: 'sterlingcooper.com' },
  { firstName: 'Roger', lastName: 'Sterling', title: 'Partner', company: 'Sterling Cooper Draper Pryce', location: 'New York, NY', industry: 'Advertising', companySize: 150, companyWebsite: 'sterlingcooper.com' },
  { firstName: 'Joan', lastName: 'Harris', title: 'Partner', company: 'Sterling Cooper Draper Pryce', location: 'New York, NY', industry: 'Advertising', companySize: 150, companyWebsite: 'sterlingcooper.com' },
  { firstName: 'Pete', lastName: 'Campbell', title: 'Account Executive', company: 'Sterling Cooper Draper Pryce', location: 'New York, NY', industry: 'Advertising', companySize: 150, companyWebsite: 'sterlingcooper.com' },

  // Succession
  { firstName: 'Logan', lastName: 'Roy', title: 'CEO & Chairman', company: 'Waystar Royco', location: 'New York, NY', industry: 'Media', companySize: 25000, companyWebsite: 'waystarroyco.com' },
  { firstName: 'Kendall', lastName: 'Roy', title: 'President', company: 'Waystar Royco', location: 'New York, NY', industry: 'Media', companySize: 25000, companyWebsite: 'waystarroyco.com' },
  { firstName: 'Siobhan', lastName: 'Roy', title: 'VP of Communications', company: 'Waystar Royco', location: 'New York, NY', industry: 'Media', companySize: 25000, companyWebsite: 'waystarroyco.com' },
  { firstName: 'Roman', lastName: 'Roy', title: 'COO', company: 'Waystar Royco', location: 'New York, NY', industry: 'Media', companySize: 25000, companyWebsite: 'waystarroyco.com' },
  { firstName: 'Tom', lastName: 'Wambsgans', title: 'CEO ATN', company: 'Waystar Royco', location: 'New York, NY', industry: 'Media', companySize: 25000, companyWebsite: 'waystarroyco.com' },

  // Silicon Valley
  { firstName: 'Richard', lastName: 'Hendricks', title: 'CEO & Founder', company: 'Pied Piper', location: 'Palo Alto, CA', industry: 'Technology', companySize: 50, companyWebsite: 'piedpiper.com' },
  { firstName: 'Erlich', lastName: 'Bachman', title: 'Chief Evangelist', company: 'Pied Piper', location: 'Palo Alto, CA', industry: 'Technology', companySize: 50, companyWebsite: 'piedpiper.com' },
  { firstName: 'Dinesh', lastName: 'Chugtai', title: 'Lead Engineer', company: 'Pied Piper', location: 'Palo Alto, CA', industry: 'Technology', companySize: 50, companyWebsite: 'piedpiper.com' },
  { firstName: 'Bertram', lastName: 'Gilfoyle', title: 'CTO', company: 'Pied Piper', location: 'Palo Alto, CA', industry: 'Technology', companySize: 50, companyWebsite: 'piedpiper.com' },
  { firstName: 'Gavin', lastName: 'Belson', title: 'CEO', company: 'Hooli', location: 'Mountain View, CA', industry: 'Technology', companySize: 50000, companyWebsite: 'hooli.com' },

  // The Wire
  { firstName: 'Jimmy', lastName: 'McNulty', title: 'Detective', company: 'Baltimore PD Homicide', location: 'Baltimore, MD', industry: 'Law Enforcement', companySize: 200, companyWebsite: 'baltimorepd.gov' },
  { firstName: 'Stringer', lastName: 'Bell', title: 'VP of Operations', company: 'B&B Enterprises', location: 'Baltimore, MD', industry: 'Real Estate', companySize: 100, companyWebsite: 'bbenterprises.com' },
  { firstName: 'Omar', lastName: 'Little', title: 'Independent Contractor', company: 'Self-Employed', location: 'Baltimore, MD', industry: 'Consulting', companySize: 1, companyWebsite: 'freelance.io' },
  { firstName: 'Lester', lastName: 'Freamon', title: 'Senior Detective', company: 'Baltimore PD', location: 'Baltimore, MD', industry: 'Law Enforcement', companySize: 200, companyWebsite: 'baltimorepd.gov' },
  { firstName: 'Marlo', lastName: 'Stanfield', title: 'CEO', company: 'Stanfield Holdings', location: 'Baltimore, MD', industry: 'Investment', companySize: 50, companyWebsite: 'stanfieldholdings.com' },

  // Arrested Development
  { firstName: 'Michael', lastName: 'Bluth', title: 'CEO', company: 'Bluth Company', location: 'Newport Beach, CA', industry: 'Real Estate', companySize: 100, companyWebsite: 'bluthcompany.com' },
  { firstName: 'George', lastName: 'Bluth Sr.', title: 'Founder', company: 'Bluth Company', location: 'Newport Beach, CA', industry: 'Real Estate', companySize: 100, companyWebsite: 'bluthcompany.com' },
  { firstName: 'Gob', lastName: 'Bluth', title: 'President', company: 'Bluth Company', location: 'Newport Beach, CA', industry: 'Real Estate', companySize: 100, companyWebsite: 'bluthcompany.com' },
  { firstName: 'Tobias', lastName: 'Funke', title: 'Chief Analyst', company: 'Blue Man Group', location: 'Los Angeles, CA', industry: 'Entertainment', companySize: 25, companyWebsite: 'blueman.com' },
  { firstName: 'Lucille', lastName: 'Bluth', title: 'Chairwoman', company: 'Bluth Company', location: 'Newport Beach, CA', industry: 'Real Estate', companySize: 100, companyWebsite: 'bluthcompany.com' },

  // Peaky Blinders
  { firstName: 'Thomas', lastName: 'Shelby', title: 'Managing Director', company: 'Shelby Company Limited', location: 'Birmingham, UK', industry: 'Import/Export', companySize: 300, companyWebsite: 'shelbycompany.co.uk' },
  { firstName: 'Arthur', lastName: 'Shelby', title: 'Operations Director', company: 'Shelby Company Limited', location: 'Birmingham, UK', industry: 'Import/Export', companySize: 300, companyWebsite: 'shelbycompany.co.uk' },
  { firstName: 'Polly', lastName: 'Gray', title: 'CFO', company: 'Shelby Company Limited', location: 'Birmingham, UK', industry: 'Import/Export', companySize: 300, companyWebsite: 'shelbycompany.co.uk' },
  { firstName: 'John', lastName: 'Shelby', title: 'Regional Manager', company: 'Shelby Company Limited', location: 'Birmingham, UK', industry: 'Import/Export', companySize: 300, companyWebsite: 'shelbycompany.co.uk' },
  { firstName: 'Michael', lastName: 'Gray', title: 'Director of US Operations', company: 'Shelby Company Limited', location: 'New York, NY', industry: 'Import/Export', companySize: 300, companyWebsite: 'shelbycompany.co.uk' },

  // Stranger Things
  { firstName: 'Jim', lastName: 'Hopper', title: 'Chief of Police', company: 'Hawkins Police Department', location: 'Hawkins, IN', industry: 'Law Enforcement', companySize: 25, companyWebsite: 'hawkinspd.gov' },
  { firstName: 'Steve', lastName: 'Harrington', title: 'Store Manager', company: 'Scoops Ahoy', location: 'Hawkins, IN', industry: 'Retail', companySize: 50, companyWebsite: 'scoopsahoy.com' },
  { firstName: 'Joyce', lastName: 'Byers', title: 'Sales Associate', company: 'Melvald\'s General Store', location: 'Hawkins, IN', industry: 'Retail', companySize: 15, companyWebsite: 'melvalds.com' },
  { firstName: 'Dustin', lastName: 'Henderson', title: 'Jr. Tech Lead', company: 'Hawkins AV Club', location: 'Hawkins, IN', industry: 'Education', companySize: 10, companyWebsite: 'hawkinsav.edu' },
  { firstName: 'Sam', lastName: 'Owens', title: 'Director', company: 'Hawkins National Laboratory', location: 'Hawkins, IN', industry: 'Research', companySize: 500, companyWebsite: 'hawkinslab.gov' },

  // Money Heist (La Casa de Papel)
  { firstName: 'Sergio', lastName: 'Marquina', title: 'Chief Strategist', company: 'The Resistance Group', location: 'Madrid, Spain', industry: 'Consulting', companySize: 15, companyWebsite: 'resistance.es' },
  { firstName: 'Berlin', lastName: 'Fonollosa', title: 'VP Operations', company: 'The Resistance Group', location: 'Madrid, Spain', industry: 'Consulting', companySize: 15, companyWebsite: 'resistance.es' },
  { firstName: 'Tokyo', lastName: 'Silene', title: 'Lead Field Agent', company: 'The Resistance Group', location: 'Madrid, Spain', industry: 'Consulting', companySize: 15, companyWebsite: 'resistance.es' },
  { firstName: 'Nairobi', lastName: 'Agata', title: 'Production Manager', company: 'The Resistance Group', location: 'Madrid, Spain', industry: 'Manufacturing', companySize: 15, companyWebsite: 'resistance.es' },
  { firstName: 'Denver', lastName: 'Daniel', title: 'Field Specialist', company: 'The Resistance Group', location: 'Madrid, Spain', industry: 'Consulting', companySize: 15, companyWebsite: 'resistance.es' },

  // Ted Lasso
  { firstName: 'Ted', lastName: 'Lasso', title: 'Head Coach', company: 'AFC Richmond', location: 'Richmond, UK', industry: 'Sports', companySize: 100, companyWebsite: 'afcrichmond.co.uk' },
  { firstName: 'Rebecca', lastName: 'Welton', title: 'Owner & CEO', company: 'AFC Richmond', location: 'Richmond, UK', industry: 'Sports', companySize: 100, companyWebsite: 'afcrichmond.co.uk' },
  { firstName: 'Roy', lastName: 'Kent', title: 'Assistant Coach', company: 'AFC Richmond', location: 'Richmond, UK', industry: 'Sports', companySize: 100, companyWebsite: 'afcrichmond.co.uk' },
  { firstName: 'Keeley', lastName: 'Jones', title: 'Founder & CEO', company: 'KJPR', location: 'London, UK', industry: 'Public Relations', companySize: 25, companyWebsite: 'kjpr.co.uk' },
  { firstName: 'Jamie', lastName: 'Tartt', title: 'Professional Athlete', company: 'AFC Richmond', location: 'Richmond, UK', industry: 'Sports', companySize: 100, companyWebsite: 'afcrichmond.co.uk' },

  // Schitt's Creek
  { firstName: 'Johnny', lastName: 'Rose', title: 'Former CEO', company: 'Rose Video', location: 'Schitt\'s Creek, ON', industry: 'Retail', companySize: 5000, companyWebsite: 'rosevideo.com' },
  { firstName: 'Moira', lastName: 'Rose', title: 'Creative Director', company: 'Sunrise Bay Productions', location: 'Schitt\'s Creek, ON', industry: 'Entertainment', companySize: 50, companyWebsite: 'sunrisebay.tv' },
  { firstName: 'David', lastName: 'Rose', title: 'Owner', company: 'Rose Apothecary', location: 'Schitt\'s Creek, ON', industry: 'Retail', companySize: 5, companyWebsite: 'roseapothecary.ca' },
  { firstName: 'Alexis', lastName: 'Rose', title: 'PR Consultant', company: 'Alexis Rose Communications', location: 'New York, NY', industry: 'Public Relations', companySize: 3, companyWebsite: 'alexisrose.com' },
  { firstName: 'Patrick', lastName: 'Brewer', title: 'Co-Owner', company: 'Rose Apothecary', location: 'Schitt\'s Creek, ON', industry: 'Retail', companySize: 5, companyWebsite: 'roseapothecary.ca' },

  // Friends
  { firstName: 'Rachel', lastName: 'Green', title: 'VP of Fashion', company: 'Ralph Lauren', location: 'New York, NY', industry: 'Fashion', companySize: 25000, companyWebsite: 'ralphlauren.com' },
  { firstName: 'Ross', lastName: 'Geller', title: 'Professor of Paleontology', company: 'NYU', location: 'New York, NY', industry: 'Education', companySize: 10000, companyWebsite: 'nyu.edu' },
  { firstName: 'Monica', lastName: 'Geller', title: 'Head Chef', company: 'Javu Restaurant', location: 'New York, NY', industry: 'Hospitality', companySize: 50, companyWebsite: 'javunyc.com' },
  { firstName: 'Chandler', lastName: 'Bing', title: 'VP of Data Processing', company: 'Bing & Associates', location: 'New York, NY', industry: 'Technology', companySize: 200, companyWebsite: 'bingassociates.com' },
  { firstName: 'Joey', lastName: 'Tribbiani', title: 'Lead Actor', company: 'Days of Our Lives', location: 'Los Angeles, CA', industry: 'Entertainment', companySize: 500, companyWebsite: 'daysofourlives.com' },
  { firstName: 'Phoebe', lastName: 'Buffay', title: 'Owner & Lead Therapist', company: 'Healing Hands Massage', location: 'New York, NY', industry: 'Wellness', companySize: 3, companyWebsite: 'healinghandsmassage.com' },

  // The Mandalorian / Star Wars
  { firstName: 'Din', lastName: 'Djarin', title: 'Independent Contractor', company: 'Mandalorian Guild', location: 'Outer Rim Territories', industry: 'Security', companySize: 100, companyWebsite: 'mandolorian.io' },
  { firstName: 'Greef', lastName: 'Karga', title: 'Magistrate', company: 'Nevarro Trade Federation', location: 'Nevarro', industry: 'Government', companySize: 250, companyWebsite: 'nevarro.gov' },
  { firstName: 'Cara', lastName: 'Dune', title: 'Marshal', company: 'New Republic', location: 'Nevarro', industry: 'Law Enforcement', companySize: 5000, companyWebsite: 'newrepublic.gov' },
  { firstName: 'Bo-Katan', lastName: 'Kryze', title: 'Leader', company: 'Mandalore Restoration', location: 'Mandalore', industry: 'Government', companySize: 500, companyWebsite: 'mandalore.gov' },
  { firstName: 'Moff', lastName: 'Gideon', title: 'Director', company: 'Imperial Remnant', location: 'Unknown Regions', industry: 'Defense', companySize: 1000, companyWebsite: 'empire.mil' },
];

/**
 * Generate a color based on company name for initials logo
 */
function getCompanyColor(companyName: string): string {
  const colors = [
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#A855F7', // Purple
  ];

  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get company initials for logo
 */
function getCompanyInitials(companyName: string): string {
  return companyName
    .split(' ')
    .filter(word => word.length > 0 && !['and', 'the', '&'].includes(word.toLowerCase()))
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}

/**
 * Create demo recipients in Firestore
 */
async function createDemoRecipients(campaignId: string): Promise<SearchApolloResult> {
  const recipientsRef = collection(db, 'campaigns', campaignId, 'recipients');

  const shuffled = [...DEMO_CONTACTS].sort(() => Math.random() - 0.5);
  const contacts = shuffled.slice(0, 100);

  // Create recipients in parallel batches
  const batchSize = 10;
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    await Promise.all(batch.map(async (contact) => {
      const emailDomain = contact.companyWebsite || 'example.com';
      const email = `${contact.firstName.toLowerCase()}.${contact.lastName.toLowerCase()}@${emailDomain}`;
      const linkedinUrl = `https://linkedin.com/in/${contact.firstName.toLowerCase()}-${contact.lastName.toLowerCase()}-demo`;

      const initialsLogo = {
        initials: getCompanyInitials(contact.company),
        color: getCompanyColor(contact.company)
      };

      await addDoc(recipientsRef, {
        apolloId: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: `${contact.firstName} ${contact.lastName}`,
        title: contact.title,
        email: email,
        linkedinUrl: linkedinUrl,
        company: contact.company,
        companyWebsite: contact.companyWebsite,
        companyIndustry: contact.industry,
        companySize: contact.companySize,
        companyInitialsLogo: initialsLogo,
        location: contact.location,
        status: 'pending',
        emailGenerated: false,
        emailSubject: null,
        emailContent: null,
        sentAt: null,
        openedAt: null,
        repliedAt: null,
        createdAt: serverTimestamp(),
        isDemo: true
      });
    }));
  }

  // Update campaign status
  await updateDoc(doc(db, 'campaigns', campaignId), {
    status: 'contacts_fetched',
    'stats.contactsFound': contacts.length,
    updatedAt: serverTimestamp()
  });

  return {
    success: true,
    contactsFound: contacts.length,
    totalAvailable: DEMO_CONTACTS.length,
    contacts: contacts.map(c => ({
      fullName: `${c.firstName} ${c.lastName}`,
      title: c.title,
      company: c.company,
      hasEmail: true
    }))
  };
}

/**
 * Check if this is a demo request
 */
function isDemoMode(targeting: ApolloTargeting): boolean {
  return targeting.personTitles.some(title => title.includes('#1'));
}

/**
 * Get auth token for API calls
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
}

/**
 * Search Apollo for contacts matching the campaign targeting criteria
 * Calls the Express backend endpoint
 * 
 * If '#1' is in the personTitles, generates 100 fake demo contacts instead
 */
export async function searchApolloContacts(
  campaignId: string,
  targeting: ApolloTargeting,
  maxResults: number = 50
): Promise<SearchApolloResult> {
  // Check for demo mode
  if (isDemoMode(targeting)) {
    console.log('🎬 Demo mode activated! Creating fake TV/Movie contacts...');
    return await createDemoRecipients(campaignId);
  }

  const token = await getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/apollo/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ campaignId, targeting, maxResults })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Enrich a single Apollo contact to get their email
 */
export async function enrichApolloContact(apolloId: string): Promise<{
  success: boolean;
  email: string | null;
  linkedinUrl: string | null;
}> {
  const token = await getAuthToken();

  const response = await fetch(`${BACKEND_URL}/api/apollo/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ apolloId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Build a preview query description from targeting
 */
export function buildTargetingDescription(targeting: ApolloTargeting): string {
  const parts: string[] = [];

  if (targeting.personTitles.length > 0) {
    parts.push(targeting.personTitles.slice(0, 2).join(', '));
  }

  if (targeting.personLocations.length > 0) {
    parts.push(`in ${targeting.personLocations.slice(0, 2).join(', ')}`);
  }

  if (targeting.seniorities.length > 0) {
    const seniorityLabels: Record<string, string> = {
      'entry': 'Entry Level',
      'senior': 'Senior',
      'manager': 'Manager',
      'director': 'Director',
      'vp': 'VP',
      'c_suite': 'C-Suite'
    };
    const labels = targeting.seniorities.map(s => seniorityLabels[s] || s);
    parts.push(`(${labels.slice(0, 2).join(', ')})`);
  }

  if (targeting.industries.length > 0) {
    parts.push(`· ${targeting.industries.slice(0, 2).join(', ')}`);
  }

  return parts.join(' ') || 'No targeting defined';
}

/**
 * Estimate the number of contacts that will be found
 * This is a rough estimate based on targeting breadth
 */
export function estimateContactCount(targeting: ApolloTargeting): {
  estimate: string;
  confidence: 'low' | 'medium' | 'high';
} {
  let score = 0;

  // More titles = more contacts
  score += targeting.personTitles.length * 2;

  // More locations = more contacts
  score += targeting.personLocations.length * 3;
  if (targeting.personLocations.includes('Remote')) {
    score += 5; // Remote dramatically increases pool
  }

  // More seniorities = more contacts
  score += targeting.seniorities.length * 2;

  // More industries = more contacts
  score += targeting.industries.length * 2;

  // Company size filters
  score += targeting.companySizes.length;

  // Exclusions reduce contacts
  score -= targeting.excludedCompanies.length * 2;

  // Convert to estimate
  if (score < 5) {
    return { estimate: '10-50', confidence: 'low' };
  } else if (score < 10) {
    return { estimate: '50-200', confidence: 'medium' };
  } else if (score < 20) {
    return { estimate: '200-500', confidence: 'medium' };
  } else {
    return { estimate: '500+', confidence: 'high' };
  }
}
