import { useState } from 'react';
import { Link } from 'react-router-dom';

// Minimalist coin icon component
const CoinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Feature descriptions for tooltips
const featureDescriptions: Record<string, string> = {
  'Basic page access': 'Access core features to explore the platform and start your job search.',
  'Access to Job Board': 'Browse thousands of job listings from top companies, updated daily.',
  'Application Tracking': 'Keep track of all your applications in one organized dashboard.',
  'Calendar Follow-up View': 'Never miss a follow-up with integrated calendar reminders.',
  'Full Interview Prep': 'Access comprehensive interview preparation materials and tips.',
  '1 Resume Analysis / month': 'Get AI-powered feedback to improve your resume.',
  '4 Resume Templates': 'Choose from professionally designed resume templates.',
  'Professional Profile': 'Build a compelling professional profile to showcase your skills.',
  'Analytics Dashboard': 'Track your job search performance with detailed analytics.',
  'Personalized Job Board': 'Get job recommendations tailored to your skills and preferences.',
  'Track Applications + Outreach': 'Manage both job applications and networking outreach in one place.',
  '2 Mock Interviews / month': 'Practice with AI-powered mock interviews to build confidence.',
  '10 Resume Analyses / month': 'Get unlimited AI feedback to perfect your resume.',
  'Premium Resume Templates': 'Access exclusive premium resume designs.',
  '2 Campaigns (200 contacts)': 'Launch targeted outreach campaigns to hiring managers.',
  'AI Recommendations': 'Receive smart suggestions to optimize your job search strategy.',
  'Priority Support': 'Get faster responses from our dedicated support team.',
  'AI Interview Coaching': 'Personalized AI coaching to ace any interview question.',
  '5 Mock Interviews / month': 'More practice sessions to master your interview skills.',
  '20 Resume Analyses / month': 'Comprehensive resume optimization for every application.',
  '5 Campaigns (500 contacts)': 'Scale your outreach with larger campaign capacity.',
};

const pricingTiers = [
  {
    name: 'Free',
    price: { monthly: 0, biMonthly: 0 },
    credits: '10 credits',
    description: 'Start your job search journey with essential tools',
    features: [
      'Basic page access',
      '1 Resume Analysis / month',
    ],
    cta: 'Sign up',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Premium',
    price: { monthly: 39, biMonthly: 75 },
    credits: '250 credits',
    description: 'Supercharge your applications with AI power',
    features: [
      'Personalized Job Board',
      'Track Applications + Outreach',
      'Calendar Follow-up View',
      'Full Interview Prep',
      '2 Mock Interviews / month',
      '10 Resume Analyses / month',
      'Premium Resume Templates',
      '2 Campaigns (200 contacts)',
      'AI Recommendations',
      'Priority Support',
    ],
    cta: 'Get started',
    popular: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Pro',
    price: { monthly: 79, biMonthly: 139 },
    credits: '500 credits',
    description: 'The ultimate toolkit for ambitious professionals',
    features: [
      'Personalized Job Board',
      'Track Applications + Outreach',
      'Calendar Follow-up View',
      'AI Interview Coaching',
      '5 Mock Interviews / month',
      '20 Resume Analyses / month',
      'Premium Resume Templates',
      '5 Campaigns (500 contacts)',
      'AI Recommendations',
      'Priority Support',
    ],
    cta: 'Get started',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PricingSection() {
  const [isBiMonthly, setIsBiMonthly] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            One tool for your whole career.
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center mt-12">
            <div className="inline-flex items-center bg-[#f0f0f0] p-1 rounded-full">
              <button
                onClick={() => setIsBiMonthly(false)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${!isBiMonthly
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Pay monthly
              </button>
              <button
                onClick={() => setIsBiMonthly(true)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 flex items-center gap-2 ${isBiMonthly
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>Pay every 2 months</span>
                <span className="text-[#0275de] font-medium">save ~10%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              className="bg-[#f6f5f4] rounded-xl p-8 relative transition-all duration-300 hover:scale-[1.02] grid"
              style={{ gridTemplateRows: 'auto auto auto auto 1fr' }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Row 1: Title + Description (fixed height) */}
              <div className="h-[72px]">
                <h3 className="text-xl font-bold mb-1 text-gray-900">
                  {tier.name} Cubbber
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {tier.description}
                </p>
              </div>

              {/* Row 3: Price + Credits */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black text-gray-900">
                    €{isBiMonthly ? tier.price.biMonthly : tier.price.monthly}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    {tier.price.monthly === 0 ? '/forever' : isBiMonthly ? '/2 months' : '/month'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#001d3d] text-white">
                  <CoinIcon className="w-4 h-4" />
                  <span>{tier.credits}/month</span>
                </div>
              </div>

              {/* Row 4: CTA Button */}
              <Link
                to="/signup"
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all text-center mb-6 ${tier.popular
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm'
                  }`}
              >
                {tier.cta}
              </Link>

              {/* Row 5: Features list (takes remaining space) */}
              <div className="space-y-4">
                <p className="text-[13px] font-bold text-gray-900">
                  {index === 0 ? 'Includes:' : `Everything in ${pricingTiers[index - 1].name} +`}
                </p>
                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="group relative flex items-start gap-2.5 text-[14px] leading-tight text-gray-600 cursor-help">
                      <span className="mt-1 flex-shrink-0 text-[#ffc300]">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="border-b border-dashed border-gray-300 group-hover:border-gray-500 transition-colors">{feature}</span>
                      {/* Tooltip */}
                      {featureDescriptions[feature] && (
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64">
                          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                            {featureDescriptions[feature]}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
