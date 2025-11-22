import React from 'react';

export function GoogleLoader() {
    return (
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
            <div className="absolute top-0 left-0 bottom-0 bg-indigo-600 w-full animate-google-long origin-left" />
            <div className="absolute top-0 left-0 bottom-0 bg-indigo-600 w-full animate-google-short origin-left" />
            <style>{`
                @keyframes google-long {
                    0% { left: -35%; right: 100%; }
                    60% { left: 100%; right: -90%; }
                    100% { left: 100%; right: -90%; }
                }
                @keyframes google-short {
                    0% { left: -200%; right: 100%; }
                    60% { left: 107%; right: -8%; }
                    100% { left: 107%; right: -8%; }
                }
                .animate-google-long {
                    animation: google-long 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
                }
                .animate-google-short {
                    animation: google-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
                    animation-delay: 1.15s;
                }
            `}</style>
        </div>
    );
}
