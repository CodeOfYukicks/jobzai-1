import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext';

interface MobileNameStepProps {
    firstName?: string;
    lastName?: string;
    onDataChange: (data: { firstName: string; lastName: string }) => void;
}

export default function MobileNameStep({
    firstName: initialFirstName,
    lastName: initialLastName,
    onDataChange
}: MobileNameStepProps) {
    const { currentUser, userData } = useAuth();
    const [firstName, setFirstName] = useState(initialFirstName || '');
    const [lastName, setLastName] = useState(initialLastName || '');
    const [showGreeting, setShowGreeting] = useState(false);

    // Pre-fill from userData or displayName
    useEffect(() => {
        if (!firstName && !lastName) {
            if (userData?.firstName) setFirstName(userData.firstName);
            if (userData?.lastName) setLastName(userData.lastName);

            if (!firstName && !lastName && currentUser?.displayName) {
                const nameParts = currentUser.displayName.split(' ').filter(part => part.trim() !== '');
                if (nameParts.length > 0) {
                    setFirstName(nameParts[0] || '');
                    if (nameParts.length > 1) {
                        setLastName(nameParts.slice(1).join(' ') || '');
                    }
                }
            }
        }
    }, [currentUser, userData]);

    // Update parent when values change
    useEffect(() => {
        onDataChange({ firstName: firstName.trim(), lastName: lastName.trim() });
    }, [firstName, lastName, onDataChange]);

    // Show greeting after typing first name
    useEffect(() => {
        if (firstName.length >= 2) {
            const timer = setTimeout(() => setShowGreeting(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowGreeting(false);
        }
    }, [firstName]);

    return (
        <div className="space-y-8">
            {/* Question */}
            <div className="space-y-1">
                <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight">
                    What's your name?
                </h1>

                {/* Micro-feedback greeting */}
                <AnimatePresence mode="wait">
                    {showGreeting && firstName.trim() && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[15px] text-[#635bff] dark:text-[#A78BFA]"
                        >
                            Hi, {firstName}! 👋
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Borderless inputs with underline */}
            <div className="space-y-6 pt-4">
                {/* First name */}
                <div>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        autoFocus
                        autoCapitalize="words"
                        autoComplete="given-name"
                        className="w-full bg-transparent border-0 border-b-2 border-gray-200 dark:border-white/20
              focus:border-[#635bff] dark:focus:border-[#A78BFA]
              text-[18px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
              py-3 px-0 outline-none transition-colors duration-200
              focus:ring-0"
                    />
                </div>

                {/* Last name */}
                <div>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        autoCapitalize="words"
                        autoComplete="family-name"
                        className="w-full bg-transparent border-0 border-b-2 border-gray-200 dark:border-white/20
              focus:border-[#635bff] dark:focus:border-[#A78BFA]
              text-[18px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
              py-3 px-0 outline-none transition-colors duration-200
              focus:ring-0"
                    />
                </div>
            </div>
        </div>
    );
}
