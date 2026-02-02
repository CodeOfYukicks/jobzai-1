import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections, getEnabledSkills } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil, formatCVDate as formatCVDateUtil } from '../../../lib/dateFormatters';
import ClickableSection from '../ClickableSection';

interface ExecutiveClassicProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function ExecutiveClassic({ cvData, layoutSettings, onSectionClick, highlightTarget }: ExecutiveClassicProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
  };

  const formatDate = (date: string) => {
    return formatCVDateUtil(date, layoutSettings.dateFormat as any);
  };

  const LEFT_COLUMN_TYPES = ['summary', 'experience', 'projects'];
  const RIGHT_COLUMN_TYPES = ['education', 'skills', 'certifications', 'languages'];

  const leftSections = enabledSections.filter(s => LEFT_COLUMN_TYPES.includes(s.type));
  const rightSections = enabledSections.filter(s => RIGHT_COLUMN_TYPES.includes(s.type));

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'summary':
        return (
          <ClickableSection key={section.id} sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Executive Summary
              </h2>
              {cvData.summary ? (
                <p className="text-gray-700 leading-relaxed text-justify" style={{ fontSize: '1em' }}>
                  {cvData.summary}
                </p>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                    Empty - Click to add professional summary
                  </p>
                </div>
              )}
            </section>
          </ClickableSection>
        );
      case 'experience':
        return (
          <ClickableSection key={section.id} sectionType="experience" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Professional Experience
              </h2>
              {cvData.experiences?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${(layoutSettings.experienceSpacing ?? 6) * 4}px` }}>
                  {cvData.experiences.map(exp => (
                    <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <div className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>{exp.title}</h3>
                            <span className="text-gray-600 italic" style={{ fontSize: '0.9em' }}>
                              {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                            </span>
                          </div>
                          <p className="text-gray-700 italic" style={{ fontSize: '0.95em' }}>
                            {exp.company}
                            {exp.location && ` — ${exp.location}`}
                          </p>
                        </div>
                        {exp.description && (
                          <p className="text-gray-700 mb-2 text-justify" style={{ fontSize: '0.95em' }}>
                            {exp.description}
                          </p>
                        )}
                        {exp.bullets.length > 0 && (
                          <ul className="space-y-1">
                            {exp.bullets.map((bullet, idx) => (
                              <li key={idx} className="text-gray-700 flex" style={{ fontSize: '0.95em' }}>
                                <span className="mr-2">•</span>
                                <span className="flex-1 text-justify">{bullet}</span>
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
        );
      case 'projects':
        return (
          <ClickableSection key={section.id} sectionType="projects" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Key Projects
              </h2>
              {cvData.projects?.length > 0 ? (
                <div className="space-y-3">
                  {cvData.projects.map(project => (
                    <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                            {project.name}
                          </h3>
                          {project.startDate && (
                            <span className="text-gray-600 italic" style={{ fontSize: '0.9em' }}>
                              {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-justify" style={{ fontSize: '0.95em' }}>{project.description}</p>
                        {project.highlights.length > 0 && (
                          <ul className="mt-1 space-y-1">
                            {project.highlights.map((highlight, idx) => (
                              <li key={idx} className="text-gray-700 flex" style={{ fontSize: '0.95em' }}>
                                <span className="mr-2">•</span>
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
        );
      case 'education':
        return (
          <ClickableSection key={section.id} sectionType="education" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Education
              </h2>
              {cvData.education?.length > 0 ? (
                <div className="space-y-3">
                  {cvData.education.map(edu => (
                    <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                          {edu.degree}
                        </h3>
                        {edu.field && (
                          <p className="text-gray-700 italic" style={{ fontSize: '0.95em' }}>{edu.field}</p>
                        )}
                        <p className="text-gray-700" style={{ fontSize: '0.95em' }}>
                          {edu.institution}
                        </p>
                        <p className="text-gray-600 italic" style={{ fontSize: '0.9em' }}>
                          {formatDate(edu.endDate)}
                        </p>
                        {edu.gpa && (
                          <p className="text-gray-600" style={{ fontSize: '0.9em' }}>GPA: {edu.gpa}</p>
                        )}
                        {edu.honors && edu.honors.length > 0 && (
                          <p className="text-gray-600 italic mt-1" style={{ fontSize: '0.9em' }}>
                            {edu.honors.join(', ')}
                          </p>
                        )}
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
        );
      case 'skills':
        return (
          <ClickableSection key={section.id} sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Core Competencies
              </h2>
              {cvData.skills?.length > 0 ? (
                <div className="space-y-1">
                  {getEnabledSkills(cvData.skills).map(skill => {
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
                      <div key={skill.id} className="text-gray-700" style={{ fontSize: '0.95em' }}>
                        • {skill.name}
                        {showLevel && (
                          <span className="text-gray-500 italic ml-2">
                            ({levelLabels[level] || level})
                          </span>
                        )}
                      </div>
                    );
                  })}
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
        );
      case 'certifications':
        return (
          <ClickableSection key={section.id} sectionType="certifications" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Certifications
              </h2>
              {cvData.certifications?.length > 0 ? (
                <div className="space-y-2">
                  {cvData.certifications.map(cert => (
                    <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <p className="font-medium text-gray-900" style={{ fontSize: '0.95em' }}>{cert.name}</p>
                        <p className="text-gray-600 italic" style={{ fontSize: '0.9em' }}>
                          {cert.issuer}, {formatDate(cert.date)}
                        </p>
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
        );
      case 'languages':
        return (
          <ClickableSection key={section.id} sectionType="languages" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <section data-cv-section="section" className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Languages
              </h2>
              {cvData.languages?.length > 0 ? (
                <div className="space-y-1">
                  {cvData.languages.map(lang => (
                    <ClickableSection key={lang.id} sectionType="languages" itemId={lang.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div className="text-gray-700" style={{ fontSize: '0.95em' }}>
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-gray-600 italic"> — {lang.proficiency}</span>
                      </div>
                    </ClickableSection>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                    Empty - Click to add languages
                  </p>
                </div>
              )}
            </section>
          </ClickableSection>
        );
      default:
        return null;
    }
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
      {/* Header */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <header className="text-center mb-8 pb-4 border-b-2 border-gray-800">
          <h1 className="font-bold text-gray-900 mb-2 tracking-wide uppercase" style={{ fontSize: '2.25em' }}>
            {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
          </h1>
          {cvData.personalInfo.title && (
            <p className="text-gray-700 mb-3 italic" style={{ fontSize: '1.25em' }}>{cvData.personalInfo.title}</p>
          )}

          {/* Contact Info - Centered */}
          <div className="flex justify-center flex-wrap gap-3 text-gray-600" style={{ fontSize: '0.9em' }}>
            {cvData.personalInfo.email && (
              <span>{cvData.personalInfo.email}</span>
            )}
            {cvData.personalInfo.email && cvData.personalInfo.phone && (
              <span>•</span>
            )}
            {cvData.personalInfo.phone && (
              <span>{cvData.personalInfo.phone}</span>
            )}
            {(cvData.personalInfo.email || cvData.personalInfo.phone) && cvData.personalInfo.location && (
              <span>•</span>
            )}
            {cvData.personalInfo.location && (
              <span>{cvData.personalInfo.location}</span>
            )}
          </div>

          {/* Links on second line */}
          {(cvData.personalInfo.linkedin || cvData.personalInfo.portfolio) && (
            <div className="flex justify-center flex-wrap gap-3 text-gray-600 mt-1" style={{ fontSize: '0.9em' }}>
              {cvData.personalInfo.linkedin && (
                <span>{formatURL(cvData.personalInfo.linkedin)}</span>
              )}
              {cvData.personalInfo.linkedin && cvData.personalInfo.portfolio && (
                <span>•</span>
              )}
              {cvData.personalInfo.portfolio && (
                <span>{formatURL(cvData.personalInfo.portfolio)}</span>
              )}
            </div>
          )}
        </header>
      </ClickableSection>

      {/* Two Column Layout */}
      <div className="flex gap-8">
        {/* Left Column - 70% */}
        <div className="flex-1" style={{ flex: '0 0 70%' }}>
          {leftSections.map(renderSection)}
        </div>

        {/* Right Column - 30% */}
        <div style={{ flex: '0 0 28%' }}>
          {rightSections.map(renderSection)}
        </div>
      </div>
    </div>
  );
}
