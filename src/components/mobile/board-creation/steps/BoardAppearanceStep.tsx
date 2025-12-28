import { useState } from 'react';
import { Check, Loader2, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { BOARD_COLORS } from '../../../../types/job';

// Premium Unsplash cover photos (same as desktop)
const COVER_PHOTOS = [
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=400&fit=crop',
];

interface BoardAppearanceStepProps {
    color: string;
    coverPhoto?: string;
    onChange: (field: string, value: string | undefined) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export default function BoardAppearanceStep({
    color,
    coverPhoto,
    onChange,
    onSubmit,
    isSubmitting
}: BoardAppearanceStepProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Final Touches</h2>
                    <p className="text-gray-500 dark:text-gray-400">Customize the look and feel of your board.</p>
                </div>

                {/* Color Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Accent Color
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {BOARD_COLORS.map((c) => (
                            <motion.button
                                key={c}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onChange('color', c)}
                                className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center ${color === c
                                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1a191b] ring-gray-900 dark:ring-white shadow-lg scale-110'
                                        : ''
                                    }`}
                                style={{ backgroundColor: c }}
                            >
                                {color === c && (
                                    <Check className="w-6 h-6 text-white" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Cover Photo Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                            Cover Photo
                        </label>
                        {coverPhoto && (
                            <button
                                onClick={() => onChange('coverPhoto', undefined)}
                                className="text-xs font-medium text-red-500 hover:text-red-600"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {COVER_PHOTOS.map((photo, index) => (
                            <motion.button
                                key={index}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onChange('coverPhoto', photo)}
                                className={`relative aspect-[2/1] rounded-xl overflow-hidden transition-all ${coverPhoto === photo
                                        ? 'ring-2 ring-[#635BFF] ring-offset-2 ring-offset-white dark:ring-offset-[#1a191b]'
                                        : ''
                                    }`}
                            >
                                <img
                                    src={photo}
                                    alt={`Cover ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {coverPhoto === photo && (
                                    <div className="absolute inset-0 bg-[#635BFF]/30 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                                            <Check className="w-5 h-5 text-[#635BFF]" />
                                        </div>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Photos from Unsplash
                    </p>
                </div>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="p-4 bg-white dark:bg-[#1a191b] border-t border-gray-200 dark:border-[#3d3c3e] safe-area-bottom">
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-[#635BFF] hover:bg-[#534be0] active:bg-[#4640c0] text-white rounded-xl font-semibold text-base shadow-lg shadow-[#635BFF]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Creating Board...</span>
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            <span>Create Board</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
