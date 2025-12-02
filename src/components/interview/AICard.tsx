import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';

export interface AICardProps {
	jobUrl: string;
	onJobUrlChange: (value: string) => void;
	isAnalyzing: boolean;
	onAnalyze: () => void;
	className?: string;
}

export function AICard({
	jobUrl,
	onJobUrlChange,
	isAnalyzing,
	onAnalyze,
	className = ''
}: AICardProps) {
	return (
		<div className={`w-full ${className}`}>
			{/* Premium floating card with subtle violet accent */}
			<motion.div 
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
				className="
					relative overflow-hidden
					rounded-2xl 
					bg-white dark:bg-slate-900
					border border-slate-200 dark:border-slate-800
					shadow-sm hover:shadow-md
					transition-shadow duration-300
					p-6
				"
			>
				{/* Subtle gradient background accent */}
				<div className="absolute inset-0 bg-gradient-to-br from-jobzai-50/50 via-transparent to-jobzai-50/30 dark:from-jobzai-950/20 dark:via-transparent dark:to-jobzai-950/10 pointer-events-none" />
				
				{/* Content */}
				<div className="relative">
					{/* Single row layout */}
					<div className="flex flex-col lg:flex-row lg:items-center gap-5">
						
						{/* Label + Icon - Premium badge style */}
						<div className="flex items-center gap-3 flex-shrink-0">
							<motion.div 
								className="
									relative flex items-center justify-center 
									w-10 h-10 rounded-xl 
									bg-[#635BFF]
								"
								style={{ 
									background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
									boxShadow: '0 4px 14px rgba(99, 91, 255, 0.3)'
								}}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Sparkles className="w-5 h-5 text-white" />
							</motion.div>
							<div>
								<span className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
									AI Analysis
								</span>
								<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
									Powered by Claude
								</p>
							</div>
						</div>

						{/* Input - Premium Google-style underline */}
						<div className="flex-1 relative group">
							<input
								type="url"
								value={jobUrl}
								onChange={(e) => onJobUrlChange(e.target.value)}
								placeholder="https://careers.company.com/job/..."
								className="
									w-full py-3 px-4
									bg-slate-50 dark:bg-slate-800/50
									border border-slate-200 dark:border-slate-700
									rounded-xl
									text-sm text-slate-900 dark:text-white
									placeholder:text-slate-400 dark:placeholder:text-slate-500
									focus:outline-none focus:border-jobzai-500 focus:ring-2 focus:ring-jobzai-500/20
									hover:border-slate-300 dark:hover:border-slate-600
									transition-all duration-200
								"
							/>
						</div>

						{/* Analyze Button - Premium gradient with explicit colors */}
						<motion.button
							onClick={onAnalyze}
							disabled={isAnalyzing || !jobUrl}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="
								relative overflow-hidden
								inline-flex items-center justify-center gap-2.5
								px-6 py-3 rounded-xl
								text-sm font-semibold text-white
								disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
								transition-all duration-200
								flex-shrink-0
							"
							style={{ 
								background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 50%, #4338ca 100%)',
								boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)'
							}}
						>
							{isAnalyzing ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin text-white" />
									<span className="text-white">Analyzing...</span>
								</>
							) : (
								<>
									<span className="text-white">Analyze</span>
									<ArrowRight className="w-4 h-4 text-white" />
								</>
							)}
						</motion.button>
					</div>

					{/* Helper text - subtle */}
					<p className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
						Extract requirements, skills, and prepare interview questions from any job posting
					</p>
				</div>
			</motion.div>
		</div>
	);
}

export default AICard;
