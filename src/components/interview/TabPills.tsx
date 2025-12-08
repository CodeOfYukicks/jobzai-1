import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
}

export interface TabPillsProps {
	items: TabItem[];
	activeId: string;
	onChange: (id: string) => void;
	className?: string;
}

export function TabPills({ items, activeId, onChange, className = '' }: TabPillsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

	// Calculate indicator position based on active tab
	useEffect(() => {
		if (containerRef.current) {
			const activeButton = containerRef.current.querySelector(`[data-tab-id="${activeId}"]`) as HTMLButtonElement;
			if (activeButton) {
				const containerRect = containerRef.current.getBoundingClientRect();
				const buttonRect = activeButton.getBoundingClientRect();
				setIndicatorStyle({
					left: buttonRect.left - containerRect.left,
					width: buttonRect.width,
				});
			}
		}
	}, [activeId, items]);

	return (
		<div className={`w-full max-w-7xl mx-auto ${className}`}>
			{/* Full-width container with centered content */}
			<div className="relative" ref={containerRef}>
				{/* Tab buttons - evenly distributed with premium styling */}
				<nav className="flex items-center justify-center border-b border-slate-200/60 dark:border-[#3d3c3e]/60">
					{items.map((item) => {
						const isActive = activeId === item.id;
						return (
							<motion.button
								key={item.id}
								data-tab-id={item.id}
								onClick={() => onChange(item.id)}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className={`
									relative flex items-center justify-center gap-2.5
									px-8 py-4
									text-sm font-medium
									transition-colors duration-200
									border-b-2 -mb-px
									${isActive
										? 'text-jobzai-500 dark:text-jobzai-400 border-jobzai-500 dark:border-jobzai-400'
										: 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-[#3d3c3e]/30'
									}
								`}
							>
								{item.icon && (
									<span 
										className={`
											transition-colors duration-200
											${isActive 
												? 'text-jobzai-500 dark:text-jobzai-400' 
												: 'text-slate-400 dark:text-slate-500'
											}
										`}
									>
										{item.icon}
									</span>
								)}
								<span>{item.label}</span>
								
								{/* Active indicator glow effect */}
								{isActive && (
									<motion.div
										layoutId="activeTabGlow"
										className="absolute inset-0 bg-jobzai-500/5 dark:bg-jobzai-400/10 rounded-t-lg -z-10"
										initial={false}
										transition={{ type: "spring", stiffness: 500, damping: 35 }}
									/>
								)}
							</motion.button>
						);
					})}
				</nav>

				{/* Animated underline indicator */}
				<motion.div
					className="absolute bottom-0 h-0.5 rounded-full"
					style={{ background: 'linear-gradient(90deg, #635BFF 0%, #7c75ff 100%)' }}
					initial={false}
					animate={{
						left: indicatorStyle.left,
						width: indicatorStyle.width,
					}}
					transition={{ type: "spring", stiffness: 500, damping: 35 }}
				/>
			</div>
		</div>
	);
}

export default TabPills;
