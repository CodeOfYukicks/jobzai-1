import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, AlertCircle, Loader2, Shield, Zap, RefreshCw } from 'lucide-react';
import { useGmailOAuth } from '../../../hooks/useGmailOAuth';
import type { CampaignData } from '../NewCampaignModal';

interface GmailConnectStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

export default function GmailConnectStep({ data, onUpdate }: GmailConnectStepProps) {
  const { isConnected, isLoading, email, error, connect, disconnect } = useGmailOAuth();

  // Sync connection state with campaign data
  useEffect(() => {
    if (isConnected && email) {
      onUpdate({ 
        gmailConnected: true,
        gmailEmail: email
      });
    } else {
      onUpdate({ 
        gmailConnected: false,
        gmailEmail: ''
      });
    }
  }, [isConnected, email, onUpdate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Connect your Gmail
        </h3>
        <p className="text-[12px] text-gray-500 dark:text-white/50">
          Authorize Jobz.ai to send emails on your behalf
        </p>
      </div>

      {/* Connection Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl border ${
          isConnected 
            ? 'bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-200 dark:border-emerald-500/20' 
            : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.08]'
        }`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative p-5">
          {isConnected ? (
            // Connected State
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white">Gmail Connected</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">{email}</p>
                  </div>
                </div>
                
                <button
                  onClick={disconnect}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[12px] font-medium 
                    text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white
                    bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] 
                    border border-gray-200 dark:border-white/[0.08] 
                    rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>

              <div className="pt-4 border-t border-emerald-200 dark:border-white/[0.06]">
                <p className="text-[12px] text-emerald-600 dark:text-emerald-400/80 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Ready to send emails from this account
                </p>
              </div>
            </div>
          ) : (
            // Not Connected State
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
                  flex items-center justify-center">
                  <Mail className="w-6 h-6 text-gray-400 dark:text-white/40" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white">No Gmail account connected</p>
                  <p className="text-[11px] text-gray-500 dark:text-white/40">Click below to authorize access</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 px-3 py-2 
                    bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 
                    rounded-lg text-[13px] text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Connect Button */}
              <button
                onClick={connect}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 
                  bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-semibold text-[13px]
                  hover:bg-gray-800 dark:hover:bg-white/90 transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    {/* Google Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Connect with Google</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Benefits */}
      <div className="space-y-2">
        <p className="text-[11px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium">
          Why connect Gmail?
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: Zap,
              title: 'Automated sending',
              description: 'Emails are sent directly from your account'
            },
            {
              icon: Shield,
              title: 'Your identity',
              description: 'Recipients see your real email address'
            },
            {
              icon: RefreshCw,
              title: 'Track responses',
              description: 'Replies go directly to your inbox'
            }
          ].map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 p-3 rounded-lg text-center
                bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]"
            >
              <benefit.icon className="w-5 h-5 text-gray-500 dark:text-white/40" />
              <div>
                <p className="text-[11px] font-semibold text-gray-700 dark:text-white/80">{benefit.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg 
        bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
        <Shield className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-500 dark:text-white/50 leading-relaxed">
          We only request send permissions. You can revoke access anytime.
        </p>
      </div>
    </div>
  );
}
