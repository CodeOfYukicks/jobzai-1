import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <SEO
        title="Conditions d'utilisation – Cubbbe"
        description="Consultez les conditions générales d'utilisation de la plateforme Cubbbe."
        url="/terms"
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
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
                Welcome to Cubbbe. These Terms of Service ("Terms") govern your access to and use of our AI-powered job search platform. By creating an account or using our services, you agree to be bound by these Terms. Please read them carefully.
              </p>
            </section>

            {/* Quick Summary */}
            <section className="mb-12 p-6 bg-gray-50 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Points</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>You must be 18+ and provide accurate information to use Cubbbe.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>You're responsible for your account security and all content you create or share.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>Our AI features are tools to assist you—you remain responsible for all applications sent.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span>Paid subscriptions use a credit-based system with monthly renewals.</span>
                </li>
              </ul>
            </section>

            {/* Detailed Sections */}
            <div className="space-y-10">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  By accessing or using Cubbbe, you confirm that:
                </p>
                <ul className="space-y-2 text-gray-600 ml-4">
                  <li>• You are at least 18 years old and legally capable of entering into binding agreements.</li>
                  <li>• You have read, understood, and agree to these Terms and our <Link to="/privacy" className="text-gray-900 underline hover:no-underline">Privacy Policy</Link>.</li>
                  <li>• If acting on behalf of an organization, you have authority to bind that organization to these Terms.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  2. Account Registration
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    To access most features, you must create an account. When registering, you agree to:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Provide accurate, current, and complete information</li>
                    <li>• Maintain and promptly update your information</li>
                    <li>• Keep your password confidential and secure</li>
                    <li>• Immediately notify us of any unauthorized access</li>
                    <li>• Accept responsibility for all activities under your account</li>
                  </ul>
                  <p>
                    We reserve the right to suspend or terminate accounts that contain false information or violate these Terms.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  3. Description of Services
                </h2>
                <p className="text-gray-600 mb-4">
                  Cubbbe provides an AI-powered platform to streamline your job search, including:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">AI Campaigns</h4>
                    <p className="text-sm text-gray-600">Automated personalized job applications and outreach</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">CV Rewrite</h4>
                    <p className="text-sm text-gray-600">AI-powered resume optimization and ATS enhancement</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Mock Interviews</h4>
                    <p className="text-sm text-gray-600">Realistic AI interview simulations with feedback</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Application Tracking</h4>
                    <p className="text-sm text-gray-600">Centralized job application management</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Career Intelligence</h4>
                    <p className="text-sm text-gray-600">AI-driven career insights and recommendations</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-1">Interview Prep</h4>
                    <p className="text-sm text-gray-600">Company research and question preparation</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Features may be updated, modified, or discontinued at our discretion. We'll provide reasonable notice for significant changes.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  4. AI-Generated Content
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our platform uses artificial intelligence to generate content, including cover letters, CV suggestions, email templates, and interview responses. You understand and agree that:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• <strong>Review Required:</strong> You are responsible for reviewing and approving all AI-generated content before use.</li>
                    <li>• <strong>No Guarantees:</strong> AI-generated content may contain errors, inaccuracies, or require modification.</li>
                    <li>• <strong>Your Responsibility:</strong> You are solely responsible for the content you send to employers and third parties.</li>
                    <li>• <strong>Truthfulness:</strong> You must ensure all information in your applications is truthful and accurate.</li>
                    <li>• <strong>No Employment Guarantee:</strong> Cubbbe does not guarantee job offers, interviews, or employment outcomes.</li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  5. Email Integration & Automated Outreach
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    When you connect your email (e.g., Gmail) for AI Campaigns:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• You authorize Cubbbe to send emails on your behalf to recipients you specify.</li>
                    <li>• You are responsible for compliance with applicable anti-spam laws (CAN-SPAM, GDPR).</li>
                    <li>• You agree not to use the service for mass unsolicited emails or spam.</li>
                    <li>• You agree to target only legitimate job opportunities and professional contacts.</li>
                    <li>• Cubbbe may limit sending volumes to protect deliverability and prevent abuse.</li>
                  </ul>
                  <p>
                    We reserve the right to suspend email features if we detect misuse or excessive spam complaints.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  6. Subscriptions & Payments
                </h2>
                <div className="space-y-4 text-gray-600">
                  <h3 className="font-medium text-gray-900">Credit System</h3>
                  <p>
                    Cubbbe operates on a credit-based system. Credits are consumed when you use AI features such as CV rewrites, campaign emails, and mock interviews. Credit allocation depends on your subscription plan.
                  </p>

                  <h3 className="font-medium text-gray-900 mt-4">Billing</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Subscriptions renew automatically each billing cycle unless cancelled.</li>
                    <li>• Payments are processed securely through Stripe.</li>
                    <li>• Prices are listed in your local currency and include applicable taxes.</li>
                    <li>• We may change pricing with 30 days' notice before your next billing cycle.</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-4">Cancellation & Refunds</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• You may cancel your subscription at any time from your account settings.</li>
                    <li>• Cancellation takes effect at the end of the current billing period.</li>
                    <li>• Unused credits expire at the end of each billing cycle and are non-transferable.</li>
                    <li>• Refunds are provided only as required by applicable law or at our discretion.</li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  7. Acceptable Use
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>You agree not to:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Use the service for any unlawful purpose or in violation of any laws</li>
                    <li>• Submit false, misleading, or fraudulent information</li>
                    <li>• Impersonate another person or entity</li>
                    <li>• Send spam, unsolicited bulk emails, or harassing communications</li>
                    <li>• Attempt to access other users' accounts or data</li>
                    <li>• Reverse engineer, decompile, or extract source code from our platform</li>
                    <li>• Use automated systems to scrape or extract data from our services</li>
                    <li>• Resell, sublicense, or commercially exploit our services without authorization</li>
                    <li>• Interfere with or disrupt the integrity or performance of our services</li>
                    <li>• Upload content that infringes intellectual property rights</li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  8. Intellectual Property
                </h2>
                <div className="space-y-4 text-gray-600">
                  <h3 className="font-medium text-gray-900">Our Rights</h3>
                  <p>
                    Cubbbe and its licensors own all rights to the platform, including software, design, logos, and content. These Terms do not transfer any intellectual property rights to you.
                  </p>

                  <h3 className="font-medium text-gray-900 mt-4">Your Content</h3>
                  <p>
                    You retain ownership of content you create (CVs, cover letters, notes). By using our services, you grant Cubbbe a limited license to process your content to provide and improve our services. This license ends when you delete your content or account.
                  </p>

                  <h3 className="font-medium text-gray-900 mt-4">AI-Generated Content</h3>
                  <p>
                    Content generated by our AI tools based on your input is yours to use. However, similar content may be generated for other users, so AI outputs are not exclusive.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  9. Disclaimers
                </h2>
                <div className="p-6 bg-gray-50 rounded-xl text-gray-600 space-y-4">
                  <p>
                    <strong>CUBBBE IS PROVIDED "AS IS" AND "AS AVAILABLE."</strong> We make no warranties, express or implied, regarding:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• The accuracy, reliability, or completeness of AI-generated content</li>
                    <li>• The availability or uninterrupted operation of our services</li>
                    <li>• The success of your job search or employment outcomes</li>
                    <li>• The actions or responses of employers or third parties</li>
                  </ul>
                  <p>
                    You acknowledge that job searching involves inherent uncertainties and that Cubbbe is a tool to assist, not guarantee, your success.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  10. Limitation of Liability
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    To the maximum extent permitted by law:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Cubbbe is not liable for indirect, incidental, special, consequential, or punitive damages.</li>
                    <li>• Our total liability is limited to the amount you paid us in the 12 months preceding the claim.</li>
                    <li>• We are not responsible for employer decisions, interview outcomes, or employment results.</li>
                    <li>• We are not liable for any third-party actions, including recipients of your applications.</li>
                  </ul>
                  <p>
                    Some jurisdictions do not allow certain liability limitations, so some of the above may not apply to you.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  11. Indemnification
                </h2>
                <p className="text-gray-600">
                  You agree to indemnify and hold harmless Cubbbe, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from: (a) your use of the services; (b) your violation of these Terms; (c) your content; or (d) your violation of any third-party rights.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  12. Termination
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    You may terminate your account at any time through your account settings. We may suspend or terminate your access if:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• You violate these Terms or our policies</li>
                    <li>• Your use poses a security risk or may harm other users</li>
                    <li>• Required by law or valid legal process</li>
                    <li>• We discontinue the service (with reasonable notice)</li>
                  </ul>
                  <p>
                    Upon termination, your right to use the service ends immediately. Provisions that by their nature should survive (intellectual property, disclaimers, limitations) will remain in effect.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  13. Dispute Resolution
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    We prefer to resolve disputes informally. If you have a concern, please contact us first at legal@cubbbe.com. We'll try to resolve the matter within 30 days.
                  </p>
                  <p>
                    If informal resolution fails, disputes will be resolved through binding arbitration rather than court litigation, except for claims that may be brought in small claims court.
                  </p>
                  <p>
                    These Terms are governed by the laws of France, without regard to conflict of law principles.
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  14. Changes to Terms
                </h2>
                <p className="text-gray-600">
                  We may update these Terms to reflect changes in our services, legal requirements, or business practices. We'll notify you of material changes via email or a prominent notice on our platform at least 30 days before they take effect. Continued use after changes constitutes acceptance.
                </p>
              </section>

              {/* Section 15 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  15. General Provisions
                </h2>
                <div className="space-y-4 text-gray-600">
                  <ul className="space-y-2 ml-4">
                    <li>• <strong>Entire Agreement:</strong> These Terms, along with our Privacy Policy, constitute the entire agreement between you and Cubbbe.</li>
                    <li>• <strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                    <li>• <strong>Waiver:</strong> Our failure to enforce any right does not waive future enforcement.</li>
                    <li>• <strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign our rights to an affiliate or successor.</li>
                  </ul>
                </div>
              </section>

              {/* Contact Section */}
              <section className="mt-12 p-6 bg-gray-900 rounded-xl text-white">
                <h2 className="text-lg font-semibold mb-3">Questions About These Terms?</h2>
                <p className="text-gray-300 mb-4">
                  Our legal team is here to help clarify any questions you may have.
                </p>
                <div className="space-y-2 text-gray-300">
                  <p><strong className="text-white">Email:</strong> legal@cubbbe.com</p>
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
