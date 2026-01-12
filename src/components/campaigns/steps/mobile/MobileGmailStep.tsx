import { motion } from 'framer-motion';
import { Mail, Check, Shield, Zap, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useGmailOAuth } from '../../../../hooks/useGmailOAuth';
import { CampaignData } from '../../NewCampaignModal';
import { useEffect } from 'react';
import MobileStepWrapper from './MobileStepWrapper';

interface MobileGmailStepProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onNext?: () => void;
    onBack?: () => void;
}

export default function MobileGmailStep({ data, onUpdate, onNext, onBack }: MobileGmailStepProps) {
    const { isConnected, isLoading, email, error, connect, disconnect } = useGmailOAuth();

    // Sync connection state
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

    const benefits = [
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
    ];

    return (
        <MobileStepWrapper
            title="Connect Gmail"
            stepCurrent={2}
            stepTotal={6}
            onBack={onBack!}
            onNext={onNext!}
            canProceed={data.gmailConnected}
            nextLabel="Next"
        >
            <div className="flex flex-col h-full">
                {/* Header Text */}
                <div className="mb-8 text-center">
                    <p className="text-[15px] text-gray-500 dark:text-white/40 leading-relaxed max-w-xs mx-auto">
                        Send automated emails directly from your personal or work account.
                    </p>
                </div>

                {/* Hero Status */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`relative w-32 h-32 rounded-3xl flex items-center justify-center mb-6
              ${isConnected
                                ? 'bg-emerald-50 dark:bg-emerald-500/10'
                                : 'bg-gray-50 dark:bg-white/[0.04]'
                            }`}
                    >
                        {/* Background rings */}
                        <div className={`absolute inset-0 rounded-3xl opacity-50 animate-pulse
              ${isConnected ? 'bg-emerald-100/50 dark:bg-emerald-500/5' : 'bg-gray-100/50 dark:bg-white/[0.02]'}`}
                        />

                        {isConnected ? (
                            <Check className="w-12 h-12 text-emerald-500" />
                        ) : (
                            <Mail className="w-12 h-12 text-gray-400 dark:text-white/30" />
                        )}

                        {/* Status Badge */}
                        <div className={`absolute -bottom-3 px-3 py-1 rounded-full text-[12px] font-semibold shadow-sm border
              ${isConnected
                                ? 'bg-white dark:bg-[#1a1a1a] text-emerald-600 border-emerald-100 dark:border-emerald-500/20'
                                : 'bg-white dark:bg-[#1a1a1a] text-gray-500 border-gray-100 dark:border-white/[0.06]'
                            }`}
                        >
                            {isConnected ? 'Connected' : 'Not Connected'}
                        </div>
                    </motion.div>

                    {isConnected && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                                {email}
                            </p>
                            <button
                                onClick={disconnect}
                                disabled={isLoading}
                                className="mt-2 text-[13px] text-gray-500 dark:text-white/40 underline decoration-gray-300 dark:decoration-white/20"
                            >
                                Disconnect account
                            </button>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-[13px] font-medium">{error}</span>
                        </motion.div>
                    )}
                </div>

                {/* Benefits Carousel */}
                {!isConnected && (
                    <div className="mb-8">
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-4 -mx-4 no-scrollbar">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={benefit.title}
                                    className="snap-center flex-shrink-0 w-[240px] p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
                                >
                                    <benefit.icon className="w-5 h-5 text-gray-900 dark:text-white mb-3" />
                                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-[12px] text-gray-500 dark:text-white/40 leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Button - Only when not connected */}
                {!isConnected && (
                    <div className="mb-4 space-y-3">
                        {/* Google Verification Notice */}
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2.5 p-3 rounded-xl 
                              bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                        >
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[12px] font-medium text-amber-800 dark:text-amber-300">
                                    Google verification in progress
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-relaxed">
                                    You may see a security warning. Click <strong>"Advanced"</strong> then <strong>"Go to Cubbbe"</strong> to continue safely.
                                </p>
                            </div>
                        </motion.div>

                        <button
                            onClick={connect}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl
                bg-gray-900 dark:bg-white text-white dark:text-black
                font-semibold text-[16px] shadow-lg active:scale-[0.98] transition-transform"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Connect with Gmail</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            <Shield className="w-3 h-3 text-gray-400" />
                            <p className="text-[11px] text-gray-400">Secure OAuth 2.0 connection</p>
                        </div>
                    </div>
                )}
            </div>
        </MobileStepWrapper>
    );
}
