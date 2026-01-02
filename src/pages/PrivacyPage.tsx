import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
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
                At Cubbbe, we believe your personal data belongs to you. This Privacy Policy explains how we collect, use, and protect your information when you use our AI-powered job search platform. We're committed to transparency and giving you control over your data.
              </p>
            </section>

            {/* Quick Summary */}
            <section className="mb-12 p-6 bg-gray-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>We collect information you provide (profile, CV, job preferences) and usage data to improve our services.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>Your data is used to personalize job applications, provide AI coaching, and improve our platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>We never sell your personal data. We share data only with service providers essential to our operations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>You can access, export, or delete your data at any time from your account settings.</span>
                </li>
              </ul>
            </section>

            {/* Detailed Sections */}
            <div className="space-y-10">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  1. Information We Collect
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Information You Provide</h3>
                    <ul className="space-y-2 text-gray-600 ml-4">
                      <li>• <strong>Account Information:</strong> Name, email address, password, and profile photo</li>
                      <li>• <strong>Professional Profile:</strong> Work experience, education, skills, and career objectives</li>
                      <li>• <strong>CV and Documents:</strong> Resumes, cover letters, and other documents you upload or create</li>
                      <li>• <strong>Job Preferences:</strong> Target roles, industries, locations, and salary expectations</li>
                      <li>• <strong>Communication Data:</strong> Email templates, outreach messages, and interview notes</li>
                      <li>• <strong>Payment Information:</strong> Billing details processed securely through Stripe</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Information We Collect Automatically</h3>
                    <ul className="space-y-2 text-gray-600 ml-4">
                      <li>• <strong>Usage Data:</strong> Features used, actions taken, and time spent on the platform</li>
                      <li>• <strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
                      <li>• <strong>Log Data:</strong> IP address, access times, and referring URLs</li>
                      <li>• <strong>Cookies:</strong> Session data and preferences (see our <Link to="/cookies" className="text-gray-900 underline hover:no-underline">Cookie Policy</Link>)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Third-Party Connections</h3>
                    <ul className="space-y-2 text-gray-600 ml-4">
                      <li>• <strong>Gmail Integration:</strong> When you connect Gmail for AI Campaigns, we access only the permissions required to send emails on your behalf. We do not read your inbox or store email content.</li>
                      <li>• <strong>Google Calendar:</strong> When connected, we access your calendar to help schedule interviews and manage appointments.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  2. How We Use Your Information
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-600">a</span>
                    <span><strong>Service Delivery:</strong> Process your account, deliver AI-generated content, send job applications, and provide interview coaching.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-600">b</span>
                    <span><strong>Personalization:</strong> Tailor job recommendations, CV suggestions, and interview questions to your profile and goals.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-600">c</span>
                    <span><strong>AI Processing:</strong> Use your data to generate personalized cover letters, optimize CVs, and create tailored outreach messages.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-600">d</span>
                    <span><strong>Communication:</strong> Send service updates, security alerts, and feature announcements (you can opt out anytime).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-600">e</span>
                    <span><strong>Analytics:</strong> Understand usage patterns to improve our services and develop new features.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-600">f</span>
                    <span><strong>Security:</strong> Detect and prevent fraud, abuse, and unauthorized access.</span>
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  3. AI and Data Processing
                </h2>
                <p className="text-gray-600 mb-4">
                  Cubbbe uses artificial intelligence to enhance your job search. Here's how:
                </p>
                <ul className="space-y-2 text-gray-600 ml-4">
                  <li>• <strong>CV Analysis & Rewriting:</strong> Our AI analyzes your CV to suggest improvements and generate ATS-optimized versions.</li>
                  <li>• <strong>Personalized Outreach:</strong> AI creates tailored cover letters and email templates based on your profile and target companies.</li>
                  <li>• <strong>Mock Interviews:</strong> AI conducts realistic interview simulations and provides feedback on your responses.</li>
                  <li>• <strong>Career Intelligence:</strong> AI analyzes market trends and provides personalized career insights.</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  We use third-party AI providers (OpenAI, Anthropic) to power these features. Your data is processed according to our data processing agreements with these providers, which include strict confidentiality and security requirements.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  4. Data Sharing
                </h2>
                <p className="text-gray-600 mb-4 font-medium">
                  We do not sell your personal data. We share data only in these circumstances:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li>• <strong>Service Providers:</strong> Cloud hosting (Firebase/Google Cloud), payment processing (Stripe), email services, and AI providers.</li>
                  <li>• <strong>At Your Direction:</strong> When you send job applications via our platform, we share your information with the recipients you specify.</li>
                  <li>• <strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety.</li>
                  <li>• <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with prior notice).</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  5. Data Security
                </h2>
                <p className="text-gray-600 mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-2 text-gray-600 ml-4">
                  <li>• Encryption in transit (TLS/HTTPS) and at rest</li>
                  <li>• Secure cloud infrastructure with Google Cloud Platform</li>
                  <li>• Regular security audits and vulnerability assessments</li>
                  <li>• Access controls and authentication requirements</li>
                  <li>• Secure token storage for third-party integrations</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  6. Data Retention
                </h2>
                <p className="text-gray-600">
                  We retain your data for as long as your account is active or as needed to provide services. You can delete your account at any time from Settings, which will remove your personal data within 30 days. Some data may be retained longer for legal compliance, dispute resolution, or fraud prevention.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  7. Your Rights (GDPR & CCPA)
                </h2>
                <p className="text-gray-600 mb-4">
                  Depending on your location, you have the following rights:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Access & Portability</h4>
                    <p className="text-sm text-gray-600">Request a copy of your data in a portable format.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Correction</h4>
                    <p className="text-sm text-gray-600">Update or correct inaccurate information.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Deletion</h4>
                    <p className="text-sm text-gray-600">Request deletion of your personal data.</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Objection</h4>
                    <p className="text-sm text-gray-600">Object to certain processing of your data.</p>
                  </div>
                </div>
                <p className="text-gray-600 mt-4">
                  To exercise these rights, visit your <Link to="/settings" className="text-gray-900 underline hover:no-underline">Account Settings</Link> or contact us at privacy@cubbbe.com.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  8. International Transfers
                </h2>
                <p className="text-gray-600">
                  Your data may be processed in countries outside your residence, including the United States. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  9. Children's Privacy
                </h2>
                <p className="text-gray-600">
                  Cubbbe is designed for professionals aged 18 and older. We do not knowingly collect data from individuals under 18. If you believe we have collected data from a minor, please contact us immediately.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  10. Changes to This Policy
                </h2>
                <p className="text-gray-600">
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements. We'll notify you of significant changes via email or a prominent notice on our platform. Your continued use after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Contact Section */}
              <section className="mt-12 p-6 bg-gray-900 rounded-xl text-white">
                <h2 className="text-lg font-semibold mb-3">Questions or Concerns?</h2>
                <p className="text-gray-300 mb-4">
                  We're here to help. Reach out to our privacy team:
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
            to="/terms"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms of Service →
          </Link>
          <Link
            to="/cookies"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cookie Policy →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
