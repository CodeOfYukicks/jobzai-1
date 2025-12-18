import { motion } from 'framer-motion';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-lg rounded-lg p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">Last updated: March 14, 2024</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing or using Cubbbe, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-600 mb-4">
                We grant you a limited, non-exclusive, non-transferable, revocable license to use our service for your personal, non-commercial use.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Restrictions</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>You must not modify or copy our materials</li>
                <li>You must not use the materials for commercial purposes</li>
                <li>You must not attempt to decompile or reverse engineer any software</li>
                <li>You must not remove any copyright or proprietary notations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Terms</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>You must be 18 years or older to use this service</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must notify us of any security breaches</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment Terms</h2>
              <p className="text-gray-600 mb-4">
                By selecting a paid subscription, you agree to pay all fees in accordance with the payment terms. All payments are non-refundable unless otherwise specified.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Termination</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                Cubbbe shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
              <p className="text-gray-600">
                Questions about the Terms of Service should be sent to us at:
                <br />
                Email: legal@cubbbe.com
                <br />
                Address: 123 AI Street, Tech City, TC 12345
              </p>
            </section>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
