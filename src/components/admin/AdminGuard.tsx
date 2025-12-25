import { useState, useEffect } from 'react';
import { Lock, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_PASSWORD = 'Howimet123.';
const STORAGE_KEY = 'cubbbe_admin_auth';

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session storage on mount
        const auth = sessionStorage.getItem(STORAGE_KEY);
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem(STORAGE_KEY, 'true');
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    if (loading) return null;

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 selection:bg-white/20">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 backdrop-blur-sm shadow-2xl">
                        <Lock className="w-6 h-6 text-white/80" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Restricted Access</h1>
                    <p className="text-white/40">Enter authorized credentials to continue.</p>
                </div>

                <form onSubmit={handleLogin} className="relative">
                    <div className="relative group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-xl px-4 py-4 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 font-mono tracking-widest`}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute -bottom-8 left-0 text-red-400 text-xs flex items-center gap-1.5"
                            >
                                <X className="w-3 h-3" />
                                Incorrect password
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div className="mt-16 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                        Cubbbe Secure Environment
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
