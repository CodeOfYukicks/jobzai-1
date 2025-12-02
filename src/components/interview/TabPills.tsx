import React, { useEffect, useRef, useState } from 'react';

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
			{/* Tabs container - minimal with bottom border */}
			<div className="relative" ref={containerRef}>
				{/* Tab buttons */}
				<div className="flex items-center gap-1">
					{items.map((item) => {
						const isActive = activeId === item.id;
						return (
							<button
								key={item.id}
								data-tab-id={item.id}
								onClick={() => onChange(item.id)}
								className={`
									relative flex items-center gap-2 px-4 py-3
									text-sm font-medium
									transition-colors duration-200
									${isActive
										? 'text-slate-900 dark:text-white'
										: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
									}
								`}
							>
								{item.icon && (
									<span 
										className={`
											transition-colors duration-200
											${isActive 
												? 'text-slate-900 dark:text-white' 
												: 'text-slate-400 dark:text-slate-500'
											}
										`}
									>
										{item.icon}
									</span>
								)}
								<span>{item.label}</span>
							</button>
						);
					})}
				</div>

				{/* Subtle bottom border line */}
				<div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200 dark:bg-slate-800" />

				{/* Animated underline indicator */}
				<div
					className="
						absolute bottom-0 h-0.5
						bg-slate-900 dark:bg-white
						transition-all duration-300 ease-out
					"
					style={{
						left: indicatorStyle.left,
						width: indicatorStyle.width,
					}}
				/>
			</div>
		</div>
	);
}

export default TabPills;
