import { ReactNode } from 'react';
import { CVSection, SectionClickTarget } from '../../types/cvEditor';
import { HighlightTarget, CVSectionType } from '../../types/cvReview';

// Map CV section types to review section types
const sectionTypeToReviewType: Record<CVSection['type'], CVSectionType> = {
  personal: 'contact',
  summary: 'about',
  experience: 'experiences',
  education: 'education',
  skills: 'skills',
  certifications: 'certifications',
  projects: 'projects',
  languages: 'languages'
};

interface ClickableSectionProps {
  children: ReactNode;
  sectionType: CVSection['type'];
  itemId?: string;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
  className?: string;
}

/**
 * Wrapper component that makes CV preview sections/items clickable
 * Adds a subtle hover effect and triggers the editor panel to open
 * Also handles highlighting from AI review suggestions
 */
export default function ClickableSection({
  children,
  sectionType,
  itemId,
  onSectionClick,
  highlightTarget,
  className = ''
}: ClickableSectionProps) {
  // Check if this section should be highlighted
  const reviewSectionType = sectionTypeToReviewType[sectionType];
  const isHighlighted = highlightTarget && 
    highlightTarget.section === reviewSectionType &&
    (!highlightTarget.itemId || highlightTarget.itemId === itemId);

  if (!onSectionClick && !highlightTarget) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onSectionClick) {
      e.stopPropagation();
      onSectionClick({ sectionType, itemId });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative transition-all duration-300 ease-out rounded-sm
        ${onSectionClick ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/40 hover:ring-offset-1' : ''}
        ${isHighlighted 
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 shadow-lg shadow-blue-200/50' 
          : ''
        }
        ${className}
      `}
      style={{ margin: '-2px', padding: '2px' }}
    >
      {/* Highlight indicator badge */}
      {isHighlighted && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

