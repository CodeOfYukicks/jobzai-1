import { ReactNode } from 'react';
import { CVSection, SectionClickTarget } from '../../types/cvEditor';

interface ClickableSectionProps {
  children: ReactNode;
  sectionType: CVSection['type'];
  itemId?: string;
  onSectionClick?: (target: SectionClickTarget) => void;
  className?: string;
}

/**
 * Wrapper component that makes CV preview sections/items clickable
 * Adds a subtle hover effect and triggers the editor panel to open
 */
export default function ClickableSection({
  children,
  sectionType,
  itemId,
  onSectionClick,
  className = ''
}: ClickableSectionProps) {
  if (!onSectionClick) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSectionClick({ sectionType, itemId });
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative cursor-pointer transition-all duration-200 ease-out
        hover:ring-1 hover:ring-[#EB7134]/40 hover:ring-offset-1
        rounded-sm
        ${className}
      `}
      style={{ margin: '-2px', padding: '2px' }}
    >
      {children}
    </div>
  );
}

