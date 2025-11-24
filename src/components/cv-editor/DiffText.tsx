import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DiffTextProps {
  original: string;
  modified: string;
  showDiff?: boolean;
}

// Simple word-based diff algorithm
function computeDiff(original: string, modified: string) {
  const originalWords = original.split(/(\s+)/);
  const modifiedWords = modified.split(/(\s+)/);
  
  const diff: Array<{ type: 'unchanged' | 'added' | 'removed', value: string }> = [];
  
  let i = 0, j = 0;
  
  while (i < originalWords.length || j < modifiedWords.length) {
    if (i >= originalWords.length) {
      // Rest of modified words are additions
      diff.push({ type: 'added', value: modifiedWords[j] });
      j++;
    } else if (j >= modifiedWords.length) {
      // Rest of original words are removals
      diff.push({ type: 'removed', value: originalWords[i] });
      i++;
    } else if (originalWords[i] === modifiedWords[j]) {
      // Words match
      diff.push({ type: 'unchanged', value: originalWords[i] });
      i++;
      j++;
    } else {
      // Look ahead to find matching words
      let foundMatch = false;
      
      // Check if current modified word appears later in original
      for (let k = i + 1; k < Math.min(i + 5, originalWords.length); k++) {
        if (originalWords[k] === modifiedWords[j]) {
          // Mark words between as removed
          for (let l = i; l < k; l++) {
            diff.push({ type: 'removed', value: originalWords[l] });
          }
          i = k;
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        // Check if current original word appears later in modified
        for (let k = j + 1; k < Math.min(j + 5, modifiedWords.length); k++) {
          if (modifiedWords[k] === originalWords[i]) {
            // Mark words between as added
            for (let l = j; l < k; l++) {
              diff.push({ type: 'added', value: modifiedWords[l] });
            }
            j = k;
            foundMatch = true;
            break;
          }
        }
      }
      
      if (!foundMatch) {
        // No match found, mark as removed and added
        diff.push({ type: 'removed', value: originalWords[i] });
        diff.push({ type: 'added', value: modifiedWords[j] });
        i++;
        j++;
      }
    }
  }
  
  return diff;
}

export default function DiffText({ original, modified, showDiff = true }: DiffTextProps) {
  const diff = useMemo(() => {
    if (!showDiff || !original || original === modified) {
      return [{ type: 'unchanged' as const, value: modified || '' }];
    }
    return computeDiff(original, modified);
  }, [original, modified, showDiff]);

  if (!showDiff) {
    return <span className="text-gray-900 dark:text-white">{modified}</span>;
  }

  return (
    <span className="inline">
      {diff.map((part, index) => {
        if (part.type === 'unchanged') {
          return (
            <span key={index} className="text-gray-900 dark:text-white">
              {part.value}
            </span>
          );
        }
        
        if (part.type === 'removed') {
          return (
            <motion.span
              key={`removed-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through px-0.5 rounded"
            >
              {part.value}
            </motion.span>
          );
        }
        
        if (part.type === 'added') {
          return (
            <motion.span
              key={`added-${index}`}
              initial={{ opacity: 0, backgroundColor: 'rgb(34 197 94 / 0.3)' }}
              animate={{ opacity: 1, backgroundColor: 'rgb(34 197 94 / 0.1)' }}
              transition={{ duration: 0.5 }}
              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium px-0.5 rounded"
            >
              {part.value}
            </motion.span>
          );
        }
        
        return null;
      })}
    </span>
  );
}

// Component for showing diff in a list item (bullet point)
export function DiffBullet({ original, modified, showDiff = true }: DiffTextProps) {
  if (!showDiff) {
    return <li className="text-gray-900 dark:text-white">{modified}</li>;
  }

  const isNew = !original || original.trim() === '';
  const isRemoved = !modified || modified.trim() === '';

  if (isNew) {
    return (
      <motion.li
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="text-gray-900 dark:text-white"
      >
        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium px-1 py-0.5 rounded text-xs mr-2">
          NEW
        </span>
        {modified}
      </motion.li>
    );
  }

  if (isRemoved) {
    return (
      <motion.li
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
        className="line-through text-red-600 dark:text-red-400"
      >
        {original}
      </motion.li>
    );
  }

  return (
    <li>
      <DiffText original={original} modified={modified} showDiff={showDiff} />
    </li>
  );
}
