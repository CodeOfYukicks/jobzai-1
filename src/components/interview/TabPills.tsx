import React from 'react';
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
	const activeIndex = items.findIndex(item => item.id === activeId);
	const tabWidth = 100 / items.length;

	return (
		<div className={['w-full', className].join(' ')}>
			{/* Container avec background subtil type Notion */}
			<div className="relative bg-gray-50/50 dark:bg-gray-900/30 rounded-lg p-1 border border-gray-200/60 dark:border-gray-800/60 backdrop-blur-sm">
				{/* Indicateur de sélection animé avec framer-motion */}
				<motion.div 
					className="absolute top-1 bottom-1 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200/80 dark:border-gray-700/60"
					initial={false}
					animate={{
						left: `${activeIndex * tabWidth}%`,
						width: `calc(${tabWidth}% - 4px)`,
					}}
					transition={{
						type: "spring",
						stiffness: 300,
						damping: 30,
					}}
					style={{
						marginLeft: '2px',
						marginRight: '2px',
					}}
				/>
				
				{/* Boutons */}
				<div className="relative flex w-full">
					{items.map((item) => {
						const isActive = activeId === item.id;
						return (
							<button
								key={item.id}
								onClick={() => onChange(item.id)}
								className={[
									'relative flex-1 flex items-center justify-center gap-2',
									'px-4 py-2.5 text-sm font-medium transition-all duration-200',
									'rounded-md z-10',
									isActive
										? 'text-gray-900 dark:text-gray-100'
										: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
								].join(' ')}
							>
								{item.icon && (
									<motion.span 
										className={[
											'transition-colors duration-200',
											isActive 
												? 'text-gray-700 dark:text-gray-200' 
												: 'text-gray-500 dark:text-gray-500'
										].join(' ')}
										animate={{
											scale: isActive ? 1.05 : 1,
										}}
										transition={{
											duration: 0.2,
										}}
									>
										{item.icon}
									</motion.span>
								)}
								<span className="whitespace-nowrap">{item.label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default TabPills;


