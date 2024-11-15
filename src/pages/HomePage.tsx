import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, BrainCog, Mail, Lock } from 'lucide-react';
import Hero from '../components/Hero';
import WordRotator from '../components/WordRotator';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';
import RainbowButton from '../components/RainbowButton';
import FirebaseImage from '../components/FirebaseImage';

const tiers = [
  {
    name: 'Free',
    price: '€0',
    period: 'month',
    description: 'Perfect for trying out the basics of Jobz.ai',
    features: [
      '25 Credits / month',
      'Access to Basic Job Application Templates',
      'AI-Powered Cover Letter Assistance',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
    cta: 'Try Free',
    href: '/signup',
  },
  {
    name: 'Standard',
    price: '€39',
    period: 'month',
    description: 'Ideal for regular job seekers who need more credits.',
    features: [
      '500 Credits / month',
      'All Free Features, plus:',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Email Support',
    ],
    cta: 'Get Started',
    href: '/signup',
    mostPopular: true,
  },
  {
    name: 'Premium',
    price: '€69',
    period: 'month',
    description: 'Designed for power users needing high-volume applications.',
    features: [
      'Unlimited Credits',
      'Premium AI Templates',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
    cta: 'Get Started',
    href: '/signup',
    isDark: true,
  },
];

const features = [
  {
    title: 'Dashboard Analytics',
    description: 'Track your job applications with real-time insights on opens, responses, and campaign performance.',
    icon: 'images/dashboard-icon.png',
  },
  {
    title: 'Credit-Based System',
    description: 'Manage your applications with flexible credits tailored to your job search intensity. 1 credit = 1 application',
    icon: 'images/credit-icon.png',
  },
  {
    title: 'Automated Tracking',
    description: 'Keep tabs on all applications sent, avoiding duplicates and managing follow-ups easily.',
    icon: 'images/tracking-icon.png',
  },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      <Hero />

      {/* 5 Steps Section */}
      <div id="how-it-works" className="bg-[#8D75E6] text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">5 steps to get your dream job</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step1.png" alt="Discover & Sign Up" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Discover & Sign Up</h3>
              <p className="text-sm text-gray-100">Alex learns about Jobz.ai and signs up, ready to make job searching faster and easier.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step2.png" alt="Set Your Goals" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Set Your Goals</h3>
              <p className="text-sm text-gray-100">Alex customizes job preferences, choosing industry, location, and job type for a focused search.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step3.png" alt="Launch Your Campaign" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Launch Your Campaign</h3>
              <p className="text-sm text-gray-100">With one click, Jobz.ai's AI creates and sends personalized applications, all tailored to Alex's profile.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step4.png" alt="Track & Improve" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Track & Improve</h3>
              <p className="text-sm text-gray-100">Alex checks the dashboard to see progress and gets tips to boost response rates and refine the search.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step5.png" alt="Celebrate Progress" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Celebrate Progress</h3>
              <p className="text-sm text-gray-100">With interviews rolling in, Alex is closer than ever to the dream job, thanks to Jobz.ai's smart strategy.</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="btn-primary"
            >
              TRY FOR FREE
            </Link>
            <p className="mt-4 text-sm text-gray-100">25 credits offered</p>
          </div>
        </div>
      </div>

      {/* Innovation Section */}
      <section id="features" className="py-24 bg-[#8D75E6] relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <div className="grid grid-cols-6 h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-l border-gray-300/30 h-full">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="border-t border-gray-300/30 h-[calc(100%/6)]" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl font-bold text-[#4D3E78] leading-tight">
                Innovation<br />that flows
              </h2>
              <div className="mt-8">
                <FirebaseImage 
                  path="images/innovation-preview.png"
                  alt="Innovation Preview" 
                  className="w-full rounded-3xl"
                />
              </div>
            </div>
            <div className="space-y-12">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Seamless Access to the Hidden Job Market
                </h3>
                <p className="text-white text-base">
                  Jobz.ai allows you to <span className="font-semibold">apply to job opportunities not publicly advertised</span>,
                  giving you an <span className="font-semibold">edge in a competitive market</span>. Our AI reaches hiring
                  managers directly, ensuring your application is seen by the right people.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Effortless Application Process
                </h3>
                <p className="text-white text-base">
                  With just a few clicks, Jobz.ai automates your job applications by <span className="font-semibold">generating
                  personalized emails</span> based on your profile and preferences. You focus on what matters,
                  while we handle the heavy lifting.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Smart Campaign Management and Insights
                </h3>
                <p className="text-white text-base">
                  Our intuitive dashboard gives you <span className="font-semibold">real-time feedback on your
                  applications</span>, showing which messages are opened and which generate responses. You can easily track
                  and optimize your job search strategy for better results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#8D75E6] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <FirebaseImage
                  path={feature.icon}
                  alt={feature.title}
                  className="w-16 h-16 mx-auto mb-6"
                />
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-100">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="btn-primary"
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-[#4D3E78]"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-gray-600"
            >
              Choose the plan that best fits your needs
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Link key={tier.name} to={tier.href}>
                <PricingCard {...tier} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}