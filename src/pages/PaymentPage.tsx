import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Check } from 'lucide-react';
import UserProfileMenu from '../components/UserProfileMenu';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, plan, package: creditPackage } = location.state || {};

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle payment submission
    navigate('/billing');
  };

  if (!type || (!plan && !creditPackage)) {
    navigate('/billing');
    return null;
  }

  const title = type === 'plan' ? `Upgrade to ${plan.name}` : 'Purchase Credits';
  const price = type === 'plan' ? plan.price : creditPackage.price;
  const period = type === 'plan' ? `/${plan.period}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="fixed top-4 right-4 z-50">
        <UserProfileMenu />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-block text-2xl font-bold text-[#1f313d] mb-4">
              JOBZ AI
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-600">Enter your payment details to complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-[#bb3e38] focus:border-[#bb3e38]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#bb3e38] focus:border-[#bb3e38]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#bb3e38] focus:border-[#bb3e38]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#bb3e38] focus:border-[#bb3e38]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#fad63c] text-black font-bold py-3 rounded-md hover:bg-[#fad63c]/90 transition-all"
                >
                  Complete Purchase
                </button>

                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Lock className="h-4 w-4 mr-2" />
                  Secure payment powered by Stripe
                </div>
              </form>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="font-medium">
                    {type === 'plan' ? plan.name + ' Plan' : `${creditPackage.amount} Credits`}
                  </span>
                  <span className="text-lg font-bold">
                    {price}{period}
                  </span>
                </div>

                {type === 'plan' && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Includes:</h3>
                    <ul className="space-y-2">
                      {plan.features.map((feature: string) => (
                        <li key={feature} className="flex items-center text-sm text-gray-600">
                          <Check className="h-5 w-5 text-[#bb3e38] mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span className="text-xl">{price}{period}</span>
                  </div>
                  {type === 'plan' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Cancel anytime. No long-term commitment required.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}