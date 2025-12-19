import { useState } from 'react';
import { Link } from 'react-router-dom';

const pricingTiers = [
  {
    name: 'Free',
    price: { monthly: 0, biMonthly: 0 },
    description: 'Perfect for trying out the basics of Cubbbe',
    features: [
      '20 Credits / month',
      'Basic AI Application Templates',
      'Standard CV Analysis',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
    cta: 'Try for Free',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Plus',
    price: { monthly: 19, biMonthly: 34 },
    description: 'Ideal for serious job seekers',
    features: [
      '200 Credits / month',
      'Full CV Rewrite AI',
      '5 Mock Interviews / month',
      'Unlimited Tracking',
      'Priority Support',
    ],
    cta: 'Get started',
    popular: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Pro',
    price: { monthly: 39, biMonthly: 69 },
    description: 'The ultimate advantage for power users',
    features: [
      'Unlimited Credits',
      'AutoPilot Campaigns',
      'Advanced Career Insights',
      'Unlimited Mock Interviews',
      '24/7 Priority Support',
    ],
    cta: 'Get started',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PricingSection() {
  const [isBiMonthly, setIsBiMonthly] = useState(false);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            One tool for your whole career.
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center mt-10">
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
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className="bg-[#f6f5f4] rounded-xl p-8 flex flex-col relative"
            >
              {tier.popular && (
                <div className="absolute top-6 right-6">
                  <span className="px-2.5 py-0.5 bg-[#0275de] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-900 mb-6 border border-gray-100">
                  {tier.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">
                    €{isBiMonthly ? tier.price.biMonthly : tier.price.monthly}
                  </span>
                  {tier.name !== 'Free' && (
                    <span className="text-gray-500 text-sm font-medium">
                      {isBiMonthly ? '/2 months' : '/month'}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to="/signup"
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all text-center mb-8 ${tier.popular
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm'
                  }`}
              >
                {tier.name === 'Free' ? 'Sign up' : 'Get started'}
              </Link>

              <div className="space-y-4">
                <p className="text-[13px] font-bold text-gray-900">
                  {tier.name === 'Free' ? 'Includes' : `Everything in ${pricingTiers[pricingTiers.indexOf(tier) - 1].name} +`}
                </p>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[14px] text-gray-700 leading-tight">
                      <span className="text-gray-900 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                      <span>{feature}</span>
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
