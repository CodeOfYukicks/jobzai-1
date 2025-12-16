// Simple diff algorithm for text comparison
// Based on longest common subsequence (LCS) approach

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

/**
 * Compute the diff between two texts
 * Returns an array of segments with their change type
 */
export function computeTextDiff(originalText: string, rewrittenText: string): DiffSegment[] {
  // Split into words for better granularity
  const originalWords = originalText.split(/(\s+)/);
  const rewrittenWords = rewrittenText.split(/(\s+)/);
  
  const diff = computeLCS(originalWords, rewrittenWords);
  return diff;
}

/**
 * Compute Longest Common Subsequence (LCS) based diff
 */
function computeLCS(original: string[], rewritten: string[]): DiffSegment[] {
  const m = original.length;
  const n = rewritten.length;
  
  // Create LCS table
  const lcs: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));
  
  // Fill LCS table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === rewritten[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find diff
  const result: DiffSegment[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === rewritten[j - 1]) {
      // Unchanged
      result.unshift({ type: 'unchanged', text: original[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Added
      result.unshift({ type: 'added', text: rewritten[j - 1] });
      j--;
    } else if (i > 0) {
      // Removed
      result.unshift({ type: 'removed', text: original[i - 1] });
      i--;
    }
  }
  
  return mergeContinuousSegments(result);
}

/**
 * Merge continuous segments of the same type for cleaner display
 */
function mergeContinuousSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return segments;
  
  const merged: DiffSegment[] = [];
  let current = segments[0];
  
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.text += segments[i].text;
    } else {
      merged.push(current);
      current = segments[i];
    }
  }
  merged.push(current);
  
  return merged;
}

/**
 * Calculate similarity percentage between two texts
 */
export function calculateSimilarity(original: string, rewritten: string): number {
  const diff = computeTextDiff(original, rewritten);
  const unchanged = diff.filter(d => d.type === 'unchanged').reduce((acc, d) => acc + d.text.length, 0);
  const total = Math.max(original.length, rewritten.length);
  
  return total > 0 ? Math.round((unchanged / total) * 100) : 100;
}

/**
 * Get change statistics
 */
export interface ChangeStats {
  additions: number;
  deletions: number;
  unchanged: number;
  totalChanges: number;
}

export function getChangeStats(original: string, rewritten: string): ChangeStats {
  const diff = computeTextDiff(original, rewritten);
  
  const stats: ChangeStats = {
    additions: 0,
    deletions: 0,
    unchanged: 0,
    totalChanges: 0,
  };
  
  diff.forEach(segment => {
    const wordCount = segment.text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (segment.type === 'added') {
      stats.additions += wordCount;
    } else if (segment.type === 'removed') {
      stats.deletions += wordCount;
    } else {
      stats.unchanged += wordCount;
    }
  });
  
  stats.totalChanges = stats.additions + stats.deletions;
  
  return stats;
}






