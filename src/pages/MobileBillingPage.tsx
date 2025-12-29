import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Zap,
    ChevronRight,
    History,
    Download,
    Check,
    Sparkles,
    TrendingUp,
    ArrowUpRight,
    Loader2,
    ChevronLeft
} from 'lucide-react';
import MobileNavigation from '../components/mobile/MobileNavigation';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCreditHistory } from '../lib/creditHistory';
import { redirectToStripeCheckout, redirectToStripePortal } from '../services/stripe';
import { toast } from 'react-hot-toast';
import { generateInvoicePDF } from '../lib/invoiceGenerator';
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface UserPlanData {
    plan: string;
    credits: number;
    planSelectedAt: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
}

interface BillingInvoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    planName: string;
    type: 'plan' | 'credits';
    status: 'paid' | 'pending' | 'failed';
    invoiceUrl: string | null;
    invoicePdfUrl: string | null;
    createdAt: Date;
}

// --- Constants ---
const plans = [
    {
        id: 'free',
        name: 'Free',
        price: { monthly: 0, biMonthly: 0 },
        credits: '10 credits',
        creditsValue: 10,
        description: 'Essential tools',
        cta: 'Current Plan',
    },
    {
        id: 'standard',
        name: 'Premium',
        price: { monthly: 39, biMonthly: 75 },
        credits: '250 credits',
        creditsValue: 250,
        description: 'AI Power',
        cta: 'Upgrade',
        popular: true,
    },
    {
        id: 'premium',
        name: 'Pro',
        price: { monthly: 79, biMonthly: 139 },
        credits: '500 credits',
        creditsValue: 500,
        description: 'Ultimate Toolkit',
        cta: 'Upgrade',
    },
];

const creditPackages = [
    { id: 'small', amount: 100, price: '19', popular: false },
    { id: 'medium', amount: 250, price: '39', popular: true },
    { id: 'large', amount: 500, price: '69', popular: false },
];

export default function MobileBillingPage() {
    const { currentUser } = useAuth();
    const [userPlanData, setUserPlanData] = useState<UserPlanData | null>(null);
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const navigate = useNavigate();

    // Data Fetching
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(
            doc(db, 'users', currentUser.uid),
            async (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data() as UserPlanData;
                    setUserPlanData(data);

                    // Fetch invoices
                    const invoicesRef = collection(db, 'users', currentUser.uid, 'invoices');
                    const invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'));
                    const invoicesSnapshot = await getDocs(invoicesQuery);

                    const fetchedInvoices: BillingInvoice[] = invoicesSnapshot.docs.map(doc => {
                        const d = doc.data();
                        return {
                            id: doc.id,
                            invoiceNumber: d.invoiceNumber || `INV-${doc.id.slice(0, 8).toUpperCase()}`,
                            amount: d.amount || 0,
                            currency: d.currency || 'eur',
                            planName: d.planName || d.plan || 'Unknown',
                            type: d.type || 'plan',
                            status: d.status || 'paid',
                            invoiceUrl: d.invoiceUrl || null,
                            invoicePdfUrl: d.invoicePdfUrl || null,
                            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
                        };
                    });
                    setInvoices(fetchedInvoices);
                }
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const currentPlan = plans.find(p => p.id === userPlanData?.plan) || plans[0];

    // Handlers
    const handleBuyCredits = async (pkg: typeof creditPackages[0]) => {
        if (!currentUser || isProcessing) return;
        setIsProcessing(true);
        setProcessingId(pkg.id);

        try {
            await redirectToStripeCheckout({
                userId: currentUser.uid,
                planId: pkg.id,
                planName: `${pkg.amount} Credits`,
                price: pkg.price,
                credits: pkg.amount,
                type: 'credits',
                customerEmail: currentUser.email || undefined,
            });
        } catch (error: any) {
            toast.error(error.message);
            setIsProcessing(false);
            setProcessingId(null);
        }
    };

    const handleManageSubscription = async () => {
        if (!currentUser) return;
        toast.loading('Opening portal...');
        try {
            await redirectToStripePortal(currentUser.uid);
        } catch (error) {
            toast.error('Could not open portal');
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#635bff] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* 1. Header */}
            <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Billing & Plans</h1>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-white/10">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                </div>
            </header>

            <div className="p-6 space-y-8">

                {/* 2. Credit Balance Hero */}
                <section>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#635bff] to-[#4f46e5] p-6 shadow-2xl shadow-[#635bff]/20"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-white/80 mb-1">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium tracking-wide">Available Credits</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black tracking-tighter text-white">
                                    {userPlanData?.credits || 0}
                                </span>
                            </div>
                            <p className="text-white/60 text-sm mt-2 font-medium">
                                Use credits for AI analysis & mocks
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* 3. Current Plan (Condensed) */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Current Plan</h2>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#111111] rounded-2xl p-5 border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-transform"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white">{currentPlan.name}</h3>
                                {currentPlan.id !== 'free' && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#635bff]/20 text-[#635bff] text-[10px] font-bold uppercase tracking-wide border border-[#635bff]/20">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">{currentPlan.description}</p>
                        </div>
                        <button
                            onClick={handleManageSubscription}
                            className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400 border border-white/5"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </section>

                {/* 4. Credit Packs (Horizontal Scroll) */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top up Credits</h2>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
                        {creditPackages.map((pkg, idx) => (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                className={`
                  snap-center flex-shrink-0 w-[160px] p-5 rounded-2xl border relative flex flex-col
                  ${pkg.popular
                                        ? 'bg-[#161616] border-[#635bff]/50 shadow-lg shadow-[#635bff]/10'
                                        : 'bg-[#111111] border-white/5'
                                    }
                `}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-[#635bff] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                            Best Value
                                        </span>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <div className="text-2xl font-black text-white">{pkg.amount}</div>
                                    <div className="text-xs text-gray-500 font-medium">credits</div>
                                </div>

                                <div className="mt-auto">
                                    <div className="text-lg font-bold text-white mb-3">€{pkg.price}</div>
                                    <button
                                        onClick={() => handleBuyCredits(pkg)}
                                        disabled={isProcessing}
                                        className={`
                      w-full py-2 rounded-lg text-xs font-bold transition-all
                      ${pkg.popular
                                                ? 'bg-[#635bff] text-white hover:bg-[#5349e0]'
                                                : 'bg-white text-black hover:bg-gray-200'
                                            }
                    `}
                                    >
                                        {isProcessing && processingId === pkg.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                        ) : (
                                            'Buy'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 5. Billing History */}
                <section>
                    <div
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                        className="flex items-center justify-between mb-4 px-1 cursor-pointer"
                    >
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Activity</h2>
                        <div className="flex items-center gap-1 text-xs text-[#635bff] font-medium">
                            {historyExpanded ? 'Show Less' : 'View All'}
                        </div>
                    </div>

                    <div className="bg-[#111111] rounded-2xl border border-white/5 overflow-hidden">
                        {invoices.length === 0 ? (
                            <div className="p-8 text-center">
                                <History className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No transaction history</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {invoices.slice(0, historyExpanded ? undefined : 3).map((invoice) => (
                                    <div key={invoice.id} className="p-4 flex items-center justify-between active:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${invoice.type === 'credits' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#635bff]/10 text-[#635bff]'}
                      `}>
                                                {invoice.type === 'credits' ? <Zap className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {invoice.planName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {invoice.createdAt.toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white">
                                                €{invoice.amount}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateInvoicePDF(
                                                        {
                                                            invoiceNumber: invoice.invoiceNumber,
                                                            date: invoice.createdAt,
                                                            planName: invoice.planName,
                                                            amount: invoice.amount,
                                                            currency: invoice.currency,
                                                            status: invoice.status,
                                                        },
                                                        currentUser?.email || '',
                                                        userPlanData?.fullName
                                                    );
                                                    toast.success('Downloaded');
                                                }}
                                                className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </div>

            <MobileNavigation />
        </div>
    );
}
