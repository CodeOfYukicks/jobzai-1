import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil, formatCVDate as formatCVDateUtil } from '../../../lib/dateFormatters';
import ClickableSection from '../ClickableSection';

interface HarvardClassicProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function HarvardClassic({ cvData, layoutSettings, onSectionClick, highlightTarget }: HarvardClassicProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
  };

  const formatDate = (date: string) => {
    return formatCVDateUtil(date, layoutSettings.dateFormat as any);
  };

  const baseFontSize = layoutSettings.fontSize;

  return (
    <div 
      className="text-gray-900" 
      style={{ 
        fontSize: `${baseFontSize}pt`, 
        lineHeight: layoutSettings.lineHeight,
        fontFamily: layoutSettings.fontFamily || 'Georgia, serif'
      }}
    >
      {/* Header - Harvard Style: Centered, Name in caps */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <header className="text-center mb-4 pb-3 border-b border-gray-400">
          <h1 
            className="font-bold text-gray-900 tracking-wider mb-1" 
            style={{ fontSize: '1.75em', letterSpacing: '0.15em' }}
          >
            {cvData.personalInfo.firstName?.toUpperCase()} {cvData.personalInfo.lastName?.toUpperCase()}
          </h1>
          
          {/* Contact Info - Single line with pipes */}
          <div className="flex justify-center flex-wrap gap-1 text-gray-700" style={{ fontSize: '0.85em' }}>
            {cvData.personalInfo.location && (
              <>
                <span>{cvData.personalInfo.location}</span>
                {(cvData.personalInfo.phone || cvData.personalInfo.email) && <span className="mx-1">|</span>}
              </>
            )}
            {cvData.personalInfo.phone && (
              <>
                <span>{cvData.personalInfo.phone}</span>
                {cvData.personalInfo.email && <span className="mx-1">|</span>}
              </>
            )}
            {cvData.personalInfo.email && (
              <span>{cvData.personalInfo.email}</span>
            )}
          </div>
          
          {/* Links on second line if present */}
          {(cvData.personalInfo.linkedin || cvData.personalInfo.portfolio || cvData.personalInfo.github) && (
            <div className="flex justify-center flex-wrap gap-1 text-gray-600 mt-1" style={{ fontSize: '0.85em' }}>
              {cvData.personalInfo.linkedin && (
                <>
                  <span>{formatURL(cvData.personalInfo.linkedin)}</span>
                  {(cvData.personalInfo.portfolio || cvData.personalInfo.github) && <span className="mx-1">|</span>}
                </>
              )}
              {cvData.personalInfo.github && (
                <>
                  <span>{formatURL(cvData.personalInfo.github)}</span>
                  {cvData.personalInfo.portfolio && <span className="mx-1">|</span>}
                </>
              )}
              {cvData.personalInfo.portfolio && (
                <span>{formatURL(cvData.personalInfo.portfolio)}</span>
              )}
            </div>
          )}
        </header>
      </ClickableSection>

      {/* Sections */}
      {enabledSections.map(section => {
        switch (section.type) {
          case 'summary':
            return (
              <ClickableSection key={section.id} sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Summary
                  </h2>
                  {cvData.summary ? (
                    <p className="text-gray-700 text-justify" style={{ fontSize: '0.95em' }}>
                      {cvData.summary}
                    </p>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add professional summary</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          case 'education':
            return (
              <ClickableSection key={section.id} sectionType="education" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Education
                  </h2>
                  {cvData.education?.length > 0 ? (
                    <div className="space-y-3">
                      {cvData.education.map(edu => (
                        <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                                {edu.institution}
                              </h3>
                              <p className="text-gray-700 italic" style={{ fontSize: '0.95em' }}>
                                {edu.degree}{edu.field && ` in ${edu.field}`}
                              </p>
                              {edu.gpa && (
                                <p className="text-gray-600" style={{ fontSize: '0.9em' }}>GPA: {edu.gpa}</p>
                              )}
                              {edu.honors && edu.honors.length > 0 && (
                                <p className="text-gray-600 italic" style={{ fontSize: '0.9em' }}>
                                  {edu.honors.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-gray-600" style={{ fontSize: '0.9em' }}>
                              {edu.location && <p>{edu.location}</p>}
                              <p>{formatDate(edu.endDate)}</p>
                            </div>
                          </div>
                        </ClickableSection>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add education</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          case 'experience':
            const experienceSpacing = layoutSettings.experienceSpacing ?? 6;
            return (
              <ClickableSection key={section.id} sectionType="experience" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Experience
                  </h2>
                  {cvData.experiences?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${experienceSpacing * 4}px` }}>
                      {cvData.experiences.map(exp => (
                        <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                                  {exp.company}
                                </h3>
                                <p className="text-gray-700 italic" style={{ fontSize: '0.95em' }}>{exp.title}</p>
                              </div>
                              <div className="text-right text-gray-600" style={{ fontSize: '0.9em' }}>
                                {exp.location && <p>{exp.location}</p>}
                                <p>{formatDateRange(exp.startDate, exp.endDate, exp.current)}</p>
                              </div>
                            </div>
                            {exp.description && (
                              <p className="text-gray-700 mb-1 text-justify" style={{ fontSize: '0.95em' }}>{exp.description}</p>
                            )}
                            {exp.bullets.length > 0 && (
                              <ul className="space-y-0.5 ml-4">
                                {exp.bullets.map((bullet, idx) => (
                                  <li key={idx} className="text-gray-700 flex" style={{ fontSize: '0.95em' }}>
                                    <span className="mr-2">•</span>
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add work experience</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          case 'skills':
            return (
              <ClickableSection key={section.id} sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Skills
                  </h2>
                  {cvData.skills?.length > 0 ? (
                    <div className="text-gray-700" style={{ fontSize: '0.95em' }}>
                      <p>
                        {cvData.skills.map((skill, idx) => (
                          <span key={skill.id}>
                            {skill.name}
                            {idx < cvData.skills.length - 1 && ' • '}
                          </span>
                        ))}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add skills</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          case 'certifications':
            return (
              <ClickableSection key={section.id} sectionType="certifications" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Certifications
                  </h2>
                  {cvData.certifications?.length > 0 ? (
                    <div className="space-y-1">
                      {cvData.certifications.map(cert => (
                        <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                          <div className="flex justify-between" style={{ fontSize: '0.95em' }}>
                            <span className="text-gray-900">
                              <span className="font-medium">{cert.name}</span>
                              <span className="text-gray-600"> — {cert.issuer}</span>
                            </span>
                            <span className="text-gray-600">{formatDate(cert.date)}</span>
                          </div>
                        </ClickableSection>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add certifications</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          case 'projects':
            return (
              <ClickableSection key={section.id} sectionType="projects" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Projects
                  </h2>
                  {cvData.projects?.length > 0 ? (
                    <div className="space-y-3">
                      {cvData.projects.map(project => (
                        <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                                {project.name}
                              </h3>
                              {project.startDate && (
                                <span className="text-gray-600" style={{ fontSize: '0.9em' }}>
                                  {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-justify" style={{ fontSize: '0.95em' }}>{project.description}</p>
                            {project.technologies.length > 0 && (
                              <p className="text-gray-600 italic mt-1" style={{ fontSize: '0.9em' }}>
                                Technologies: {project.technologies.join(', ')}
                              </p>
                            )}
                            {project.highlights.length > 0 && (
                              <ul className="mt-1 ml-4 space-y-0.5">
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add projects</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          case 'languages':
            return (
              <ClickableSection key={section.id} sectionType="languages" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-4">
                  <h2 
                    className="font-semibold text-gray-800 tracking-widest uppercase border-b border-gray-300 pb-1 mb-2" 
                    style={{ fontSize: '0.9em', letterSpacing: '0.1em' }}
                  >
                    Languages
                  </h2>
                  {cvData.languages?.length > 0 ? (
                    <div className="text-gray-700" style={{ fontSize: '0.95em' }}>
                      {cvData.languages.map((lang, idx) => (
                        <span key={lang.id}>
                          {lang.name} ({lang.proficiency})
                          {idx < cvData.languages.length - 1 && ' • '}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm italic">Empty - Click to add languages</p>
                    </div>
                  )}
                </section>
              </ClickableSection>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}


