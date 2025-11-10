import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Check, Loader2 } from 'lucide-react';
import UserProfileMenu from '../components/UserProfileMenu';
import { useAuth } from '../contexts/AuthContext';
import { redirectToStripeCheckout } from '../services/stripe';
import { toast } from 'react-hot-toast';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { type, plan, package: creditPackage } = location.state || {};

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect if no plan/package selected
    if (!type || (!plan && !creditPackage)) {
      navigate('/billing');
    }
  }, [type, plan, creditPackage, navigate]);

  const handleCheckout = async () => {
    if (!currentUser) {
      toast.error('Please sign in to continue');
      navigate('/login');
      return;
    }

    if (!type || (!plan && !creditPackage)) {
      toast.error('Invalid payment selection');
      navigate('/billing');
      return;
    }

    try {
      setIsLoading(true);

      const params = {
        userId: currentUser.uid,
        planId: type === 'plan' ? plan.id : creditPackage.id,
        planName: type === 'plan' ? plan.name : `${creditPackage.amount} Credits`,
        price: type === 'plan' ? plan.price : creditPackage.price,
        credits: type === 'plan' ? plan.credits : creditPackage.amount,
        type: type as 'plan' | 'credits',
        customerEmail: currentUser.email || undefined,
      };

      await redirectToStripeCheckout(params);
      // User will be redirected to Stripe Checkout
    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setIsLoading(false);
    }
  };

  if (!type || (!plan && !creditPackage)) {
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
            <p className="mt-2 text-gray-600">Secure payment powered by Stripe</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <CreditCard className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Secure Checkout
                  </h2>
                  <p className="text-gray-600 text-sm">
                    You'll be redirected to Stripe's secure payment page to complete your purchase
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      Proceed to Payment
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Lock className="h-4 w-4 mr-2" />
                  Secure payment powered by Stripe
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
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
