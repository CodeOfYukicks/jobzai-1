import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil, formatCVDate as formatCVDateUtil } from '../../../lib/dateFormatters';
import { Github, Globe, Mail, MapPin } from 'lucide-react';
import ClickableSection from '../ClickableSection';

interface TechMinimalistProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function TechMinimalist({ cvData, layoutSettings, onSectionClick, highlightTarget }: TechMinimalistProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
  };

  const formatDate = (date: string) => {
    return formatCVDateUtil(date, layoutSettings.dateFormat as any);
  };

  // Group skills by category
  const groupedSkills = cvData.skills.reduce((acc, skill) => {
    const category = skill.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof cvData.skills>);

  const skillCategories = {
    technical: 'Technologies',
    tool: 'Tools & Platforms',
    soft: 'Soft Skills',
    language: 'Languages',
    other: 'Other Skills'
  };

  return (
    <div 
      className="text-gray-900" 
      style={{ 
        fontSize: `${layoutSettings.fontSize}pt`, 
        lineHeight: layoutSettings.lineHeight,
        fontFamily: layoutSettings.fontFamily
      }}
    >
      {/* Header - Minimalist */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <header className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-bold text-gray-900" style={{ fontSize: '2em' }}>
                {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
              </h1>
              {cvData.personalInfo.title && (
                <p className="text-gray-600 mt-1 font-sans" style={{ fontSize: '0.95em' }}>{cvData.personalInfo.title}</p>
              )}
            </div>
            
            {/* Contact Info - Right aligned */}
            <div className="text-right space-y-1" style={{ fontSize: '0.85em' }}>
              {cvData.personalInfo.email && (
                <div className="flex items-center justify-end gap-1">
                  <span className="text-gray-600">{cvData.personalInfo.email}</span>
                  <Mail data-icon-type="mail" style={{ width: '1em', height: '1em' }} className="text-gray-400" />
                </div>
              )}
              {cvData.personalInfo.location && (
                <div className="flex items-center justify-end gap-1">
                  <span className="text-gray-600">{cvData.personalInfo.location}</span>
                  <MapPin data-icon-type="mapPin" style={{ width: '1em', height: '1em' }} className="text-gray-400" />
                </div>
              )}
              {cvData.personalInfo.github && (
                <div className="flex items-center justify-end gap-1">
                  <span className="text-gray-600">{formatURL(cvData.personalInfo.github)}</span>
                  <Github data-icon-type="github" style={{ width: '1em', height: '1em' }} className="text-gray-400" />
                </div>
              )}
              {cvData.personalInfo.portfolio && (
                <div className="flex items-center justify-end gap-1">
                  <span className="text-gray-600">{formatURL(cvData.personalInfo.portfolio)}</span>
                  <Globe data-icon-type="globe" style={{ width: '1em', height: '1em' }} className="text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </header>
      </ClickableSection>

      {/* Summary - Code block style */}
      {enabledSections.find(s => s.type === 'summary') && (
        <ClickableSection sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
          <section className="mb-6">
            {cvData.summary ? (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-3">
              <p className="text-gray-700 font-sans leading-relaxed" style={{ fontSize: '1em' }}>
                {cvData.summary}
              </p>
            </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                  Empty - Click to add professional summary
                </p>
              </div>
            )}
          </section>
        </ClickableSection>
      )}

      {/* Skills - Grid layout */}
      {enabledSections.find(s => s.type === 'skills') && (
        <ClickableSection sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
          <section className="mb-6">
            <h2 className="font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
              TECHNICAL STACK
            </h2>
            {cvData.skills?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(groupedSkills).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-600 mb-1" style={{ fontSize: '0.9em' }}>
                    {skillCategories[category as keyof typeof skillCategories] || category}
                  </h3>
                  <div className="text-gray-700 space-y-0.5" style={{ fontSize: '0.9em' }}>
                    {skills.map(skill => {
                      const shouldShowLevel = layoutSettings?.showSkillLevel !== false;
                      const level = skill.level || 'intermediate';
                      const showLevel = shouldShowLevel && level;
                      const levelLabels: Record<string, string> = {
                        'beginner': 'Beginner',
                        'intermediate': 'Intermediate',
                        'advanced': 'Advanced',
                        'expert': 'Expert'
                      };
                      return (
                        <span key={skill.id} className="inline-flex items-center gap-1 mr-2">
                          <span>{skill.name}</span>
                          {showLevel && (
                            <span className="text-[0.75em] text-gray-500 font-medium">
                              ({levelLabels[level] || level})
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                  Empty - Click to add skills
                </p>
              </div>
            )}
          </section>
        </ClickableSection>
      )}

      {/* Experience - Clean blocks */}
      {enabledSections.find(s => s.type === 'experience') && (
        <ClickableSection sectionType="experience" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <section className="mb-6">
          <h2 className="font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            EXPERIENCE
          </h2>
            {cvData.experiences?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${(layoutSettings.experienceSpacing ?? 6) * 4}px` }}>
            {cvData.experiences.map(exp => (
              <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <div className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                        {exp.title}
                        <span className="text-gray-600 font-normal"> @ {exp.company}</span>
                      </h3>
                    </div>
                    <span className="text-gray-500 font-sans" style={{ fontSize: '0.85em' }}>
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-gray-600 mb-2 font-sans" style={{ fontSize: '0.9em' }}>
                      {exp.description}
                    </p>
                  )}
                  {exp.bullets.length > 0 && (
                    <ul className="space-y-1">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx} className="text-gray-700 font-sans flex" style={{ fontSize: '0.9em' }}>
                          <span className="text-gray-400 mr-2">→</span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ClickableSection>
            ))}
          </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                  Empty - Click to add work experience
                </p>
              </div>
            )}
        </section>
        </ClickableSection>
      )}

      {/* Projects - Tech focus */}
      {enabledSections.find(s => s.type === 'projects') && (
        <ClickableSection sectionType="projects" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <section className="mb-6">
          <h2 className="font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            PROJECTS
          </h2>
            {cvData.projects?.length > 0 ? (
          <div className="space-y-3">
            {cvData.projects.map(project => (
              <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <div className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                        {project.name}
                      </h3>
                      {project.url && (
                        <span className="text-blue-600" style={{ fontSize: '0.85em' }}>
                          [{formatURL(project.url)}]
                        </span>
                      )}
                    </div>
                    {project.startDate && (
                      <span className="text-gray-500 font-sans" style={{ fontSize: '0.85em' }}>
                        {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 font-sans" style={{ fontSize: '0.9em' }}>
                    {project.description}
                  </p>
                  {project.technologies.length > 0 && (
                    <div className="mt-1" style={{ fontSize: '0.9em' }}>
                      <span className="text-gray-500">Stack: </span>
                      <span className="text-gray-700">
                        {project.technologies.join(' • ')}
                      </span>
                    </div>
                  )}
                  {project.highlights.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {project.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-gray-600 font-sans flex" style={{ fontSize: '0.9em' }}>
                          <span className="text-gray-400 mr-2">→</span>
                          <span className="flex-1">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ClickableSection>
            ))}
          </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                  Empty - Click to add projects
                </p>
              </div>
            )}
        </section>
        </ClickableSection>
      )}

      {/* Education - Compact */}
      {enabledSections.find(s => s.type === 'education') && (
        <ClickableSection sectionType="education" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <section className="mb-6">
          <h2 className="font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            EDUCATION
          </h2>
            {cvData.education?.length > 0 ? (
          <div className="space-y-2">
            {cvData.education.map(edu => (
              <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                      {edu.degree}
                      {edu.field && ` • ${edu.field}`}
                    </span>
                    <p className="text-gray-600 font-sans" style={{ fontSize: '0.9em' }}>
                      {edu.institution}
                      {edu.gpa && ` • GPA: ${edu.gpa}`}
                    </p>
                  </div>
                  <span className="text-gray-500 font-sans" style={{ fontSize: '0.85em' }}>
                    {formatDate(edu.endDate)}
                  </span>
                </div>
              </ClickableSection>
            ))}
          </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                  Empty - Click to add education
                </p>
              </div>
            )}
        </section>
        </ClickableSection>
      )}

      {/* Certifications - List style */}
      {enabledSections.find(s => s.type === 'certifications') && (
        <ClickableSection sectionType="certifications" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <section className="mb-6">
          <h2 className="font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            CERTIFICATIONS
          </h2>
            {cvData.certifications?.length > 0 ? (
          <div className="space-y-1">
            {cvData.certifications.map(cert => (
              <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <div className="text-gray-700 font-sans" style={{ fontSize: '0.9em' }}>
                  <span className="text-gray-400">→</span>
                  <span className="ml-2">
                    {cert.name} • {cert.issuer} • {formatDate(cert.date)}
                  </span>
                </div>
              </ClickableSection>
            ))}
          </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                  Empty - Click to add certifications
                </p>
              </div>
            )}
        </section>
        </ClickableSection>
      )}
    </div>
  );
}
