import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, Check, X } from 'lucide-react';
import Footer from '../components/Footer';

// Cookie data organized by category
const cookieCategories = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description: 'Required for the platform to function. These cannot be disabled.',
    required: true,
    cookies: [
      { name: '__session', purpose: 'Firebase Authentication - Maintains your login session', duration: 'Session', provider: 'Firebase' },
      { name: 'firebase-auth-token', purpose: 'Secure authentication token', duration: '1 hour', provider: 'Firebase' },
      { name: 'csrf_token', purpose: 'Security - Prevents cross-site request forgery', duration: 'Session', provider: 'Cubbbe' },
    ]
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'Enable personalized features and remember your preferences.',
    required: false,
    cookies: [
      { name: 'theme', purpose: 'Remembers your dark/light mode preference', duration: '1 year', provider: 'Cubbbe' },
      { name: 'language', purpose: 'Stores your language preference', duration: '1 year', provider: 'Cubbbe' },
      { name: 'sidebar_collapsed', purpose: 'Remembers sidebar state', duration: '30 days', provider: 'Cubbbe' },
      { name: 'onboarding_completed', purpose: 'Tracks onboarding progress', duration: '1 year', provider: 'Cubbbe' },
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'Help us understand how you use Cubbbe so we can improve.',
    required: false,
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - Distinguishes unique users', duration: '2 years', provider: 'Google' },
      { name: '_ga_*', purpose: 'Google Analytics 4 - Maintains session state', duration: '2 years', provider: 'Google' },
      { name: '_gid', purpose: 'Google Analytics - Distinguishes users', duration: '24 hours', provider: 'Google' },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Used to deliver relevant ads and measure campaign effectiveness.',
    required: false,
    cookies: [
      { name: '_fbp', purpose: 'Facebook Pixel - Tracks visits across websites', duration: '3 months', provider: 'Meta' },
      { name: '_gcl_au', purpose: 'Google Ads - Conversion tracking', duration: '3 months', provider: 'Google' },
    ]
  }
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <SEO
        title="Politique de cookies – Cubbbe"
        description="Découvrez comment Cubbbe utilise les cookies pour améliorer votre expérience sur la plateforme."
        url="/cookies"
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cookie Policy</h1>
              <p className="text-sm text-gray-500">Last updated: January 2, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-8 sm:p-12">
            {/* Introduction */}
            <section className="mb-12">
              <p className="text-lg text-gray-600 leading-relaxed">
                Cubbbe uses cookies and similar technologies to provide, protect, and improve our platform. This policy explains what cookies are, how we use them, and the choices you have.
              </p>
            </section>

            {/* Quick Summary */}
            <section className="mb-12 p-6 bg-gray-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span><strong>Essential cookies</strong> keep you logged in and the platform secure. These are always active.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span><strong>Functional cookies</strong> remember your preferences like theme and language settings.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span><strong>Analytics cookies</strong> help us understand usage patterns and improve the platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>You can manage non-essential cookies anytime via your browser settings.</span>
                </li>
              </ul>
            </section>

            {/* Detailed Sections */}
            <div className="space-y-10">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  1. What Are Cookies?
                </h2>
                <p className="text-gray-600 mb-4">
                  Cookies are small text files stored on your device when you visit a website. They serve various purposes:
                </p>
                <ul className="grid sm:grid-cols-2 gap-4">
                  <li className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Session Cookies</h4>
                    <p className="text-sm text-gray-600">Temporary cookies deleted when you close your browser.</p>
                  </li>
                  <li className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Persistent Cookies</h4>
                    <p className="text-sm text-gray-600">Remain on your device until they expire or you delete them.</p>
                  </li>
                  <li className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">First-Party Cookies</h4>
                    <p className="text-sm text-gray-600">Set by Cubbbe directly when you visit our site.</p>
                  </li>
                  <li className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Third-Party Cookies</h4>
                    <p className="text-sm text-gray-600">Set by our partners for analytics and functionality.</p>
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  2. How We Use Cookies
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• <strong>Authenticate users:</strong> Keep you signed in across sessions</li>
                    <li>• <strong>Remember preferences:</strong> Store your theme, language, and display settings</li>
                    <li>• <strong>Provide security:</strong> Detect and prevent fraud and unauthorized access</li>
                    <li>• <strong>Analyze usage:</strong> Understand how you interact with our platform</li>
                    <li>• <strong>Improve performance:</strong> Optimize load times and user experience</li>
                    <li>• <strong>Enable features:</strong> Power real-time updates and notifications</li>
                  </ul>
                </div>
              </section>

              {/* Section 3 - Cookie Categories */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-100">
                  3. Cookie Categories & Details
                </h2>

                <div className="space-y-8">
                  {cookieCategories.map((category) => (
                    <div key={category.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      {/* Category Header */}
                      <div className="p-5 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          {category.required ? (
                            <span className="px-2.5 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                              Always Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>

                      {/* Cookie Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-white border-b border-gray-100">
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {category.cookies.map((cookie, index) => (
                              <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 text-sm font-mono text-gray-900">{cookie.name}</td>
                                <td className="px-5 py-3 text-sm text-gray-600">{cookie.purpose}</td>
                                <td className="px-5 py-3 text-sm text-gray-500">{cookie.duration}</td>
                                <td className="px-5 py-3 text-sm text-gray-500">{cookie.provider}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  4. Third-Party Services
                </h2>
                <p className="text-gray-600 mb-4">
                  We use the following third-party services that may set cookies:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Firebase (Google)</h4>
                    <p className="text-sm text-gray-600">Authentication, hosting, and database services</p>
                    <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 underline mt-1 inline-block">Privacy Policy →</a>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Google Analytics</h4>
                    <p className="text-sm text-gray-600">Usage analytics and performance monitoring</p>
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 underline mt-1 inline-block">Privacy Policy →</a>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Stripe</h4>
                    <p className="text-sm text-gray-600">Payment processing and subscription management</p>
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 underline mt-1 inline-block">Privacy Policy →</a>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">OpenAI</h4>
                    <p className="text-sm text-gray-600">AI-powered content generation</p>
                    <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 underline mt-1 inline-block">Privacy Policy →</a>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  5. Managing Your Cookie Preferences
                </h2>
                <p className="text-gray-600 mb-4">
                  You can control cookies through your browser settings. Here's how to manage cookies in popular browsers:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                    <h4 className="font-medium text-gray-900 group-hover:text-black">Google Chrome</h4>
                    <p className="text-sm text-gray-500">Settings → Privacy and Security → Cookies</p>
                  </a>
                  <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                    <h4 className="font-medium text-gray-900 group-hover:text-black">Mozilla Firefox</h4>
                    <p className="text-sm text-gray-500">Options → Privacy & Security → Cookies</p>
                  </a>
                  <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                    <h4 className="font-medium text-gray-900 group-hover:text-black">Safari</h4>
                    <p className="text-sm text-gray-500">Preferences → Privacy → Manage Website Data</p>
                  </a>
                  <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                    <h4 className="font-medium text-gray-900 group-hover:text-black">Microsoft Edge</h4>
                    <p className="text-sm text-gray-500">Settings → Privacy & Security → Cookies</p>
                  </a>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Blocking essential cookies may prevent you from using Cubbbe. Some features require cookies to function properly.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  6. Do Not Track
                </h2>
                <p className="text-gray-600">
                  Some browsers include a "Do Not Track" (DNT) feature. Currently, there is no industry standard for how websites should respond to DNT signals. We currently do not respond to DNT signals, but we respect your right to enable this feature. We recommend using browser cookie controls for more granular control.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  7. Updates to This Policy
                </h2>
                <p className="text-gray-600">
                  We may update this Cookie Policy to reflect changes in our practices or for operational, legal, or regulatory reasons. We encourage you to review this page periodically for the latest information on our cookie practices.
                </p>
              </section>

              {/* Contact Section */}
              <section className="mt-12 p-6 bg-gray-900 rounded-xl text-white">
                <h2 className="text-lg font-semibold mb-3">Questions About Cookies?</h2>
                <p className="text-gray-300 mb-4">
                  We're happy to explain how we use cookies or help you manage your preferences.
                </p>
                <div className="space-y-2 text-gray-300">
                  <p><strong className="text-white">Email:</strong> privacy@cubbbe.com</p>
                  <p><strong className="text-white">Response Time:</strong> Within 48 hours</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            to="/privacy"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy Policy →
          </Link>
          <Link
            to="/terms"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms of Service →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
