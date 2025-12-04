import { motion } from 'framer-motion';

interface ProfileTagsCloudProps {
  tags: string[];
  maxTags?: number;
}

export default function ProfileTagsCloud({ tags, maxTags = 12 }: ProfileTagsCloudProps) {
  const displayTags = tags.slice(0, maxTags);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-wrap gap-2"
    >
      {displayTags.map((tag, index) => (
        <motion.span
          key={tag}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3, 
            delay: 0.1 + index * 0.03,
            ease: [0.23, 1, 0.32, 1]
          }}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium
            text-gray-600 dark:text-gray-300
            bg-gray-100 dark:bg-gray-800/60
            border border-gray-200/50 dark:border-gray-700/50
            rounded-lg
            hover:bg-gray-200/70 dark:hover:bg-gray-700/60
            hover:border-gray-300 dark:hover:border-gray-600
            transition-all duration-200 cursor-default"
        >
          {tag}
        </motion.span>
      ))}
      
      {tags.length > maxTags && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium
            text-gray-400 dark:text-gray-500"
        >
          +{tags.length - maxTags} more
        </motion.span>
      )}
    </motion.div>
  );
}


