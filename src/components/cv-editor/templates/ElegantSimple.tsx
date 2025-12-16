import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil, formatCVDate as formatCVDateUtil } from '../../../lib/dateFormatters';
import ClickableSection from '../ClickableSection';

interface ElegantSimpleProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function ElegantSimple({ cvData, layoutSettings, onSectionClick, highlightTarget }: ElegantSimpleProps) {
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
      className="text-gray-800" 
      style={{ 
        fontSize: `${baseFontSize}pt`, 
        lineHeight: layoutSettings.lineHeight,
        fontFamily: layoutSettings.fontFamily || 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header - Ultra Clean */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <header className="mb-8">
          <h1 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '2em', letterSpacing: '-0.02em' }}>
            {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
          </h1>
          
          {cvData.personalInfo.title && (
            <p className="text-gray-600 mb-3" style={{ fontSize: '1.1em' }}>
              {cvData.personalInfo.title}
            </p>
          )}
          
          {/* Contact Info - Simple inline */}
          <div className="text-gray-500" style={{ fontSize: '0.9em' }}>
            {[
              cvData.personalInfo.email,
              cvData.personalInfo.phone,
              cvData.personalInfo.location,
              cvData.personalInfo.linkedin && formatURL(cvData.personalInfo.linkedin),
              cvData.personalInfo.github && formatURL(cvData.personalInfo.github),
              cvData.personalInfo.portfolio && formatURL(cvData.personalInfo.portfolio)
            ].filter(Boolean).join('  ·  ')}
          </div>
        </header>
      </ClickableSection>

      {/* Sections - Single column with generous spacing */}
      <div className="space-y-7">
        {enabledSections.map(section => {
          switch (section.type) {
            case 'summary':
              return (
                <ClickableSection key={section.id} sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      About
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.summary ? (
                        <p className="text-gray-700 leading-relaxed" style={{ fontSize: '1em' }}>
                          {cvData.summary}
                        </p>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add a professional summary</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            case 'experience':
              const experienceSpacing = layoutSettings.experienceSpacing ?? 6;
              return (
                <ClickableSection key={section.id} sectionType="experience" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      Experience
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.experiences?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: `${experienceSpacing * 4}px` }}>
                          {cvData.experiences.map(exp => (
                            <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div>
                                <div className="flex justify-between items-baseline mb-1">
                                  <h3 className="font-medium text-gray-900" style={{ fontSize: '1em' }}>
                                    {exp.title}
                                  </h3>
                                  <span className="text-gray-400" style={{ fontSize: '0.85em' }}>
                                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                  </span>
                                </div>
                                <p className="text-gray-500 mb-2" style={{ fontSize: '0.9em' }}>
                                  {exp.company}{exp.location && `, ${exp.location}`}
                                </p>
                                {exp.description && (
                                  <p className="text-gray-600 mb-2" style={{ fontSize: '0.95em' }}>
                                    {exp.description}
                                  </p>
                                )}
                                {exp.bullets.length > 0 && (
                                  <ul className="space-y-1">
                                    {exp.bullets.map((bullet, idx) => (
                                      <li key={idx} className="text-gray-600 flex" style={{ fontSize: '0.95em' }}>
                                        <span className="text-gray-300 mr-3">—</span>
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
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add work experience</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            case 'education':
              return (
                <ClickableSection key={section.id} sectionType="education" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      Education
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.education?.length > 0 ? (
                        <div className="space-y-4">
                          {cvData.education.map(edu => (
                            <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div>
                                <div className="flex justify-between items-baseline">
                                  <h3 className="font-medium text-gray-900" style={{ fontSize: '1em' }}>
                                    {edu.degree}{edu.field && ` in ${edu.field}`}
                                  </h3>
                                  <span className="text-gray-400" style={{ fontSize: '0.85em' }}>
                                    {formatDate(edu.endDate)}
                                  </span>
                                </div>
                                <p className="text-gray-500" style={{ fontSize: '0.9em' }}>
                                  {edu.institution}{edu.location && `, ${edu.location}`}
                                </p>
                                {edu.gpa && (
                                  <p className="text-gray-400 mt-1" style={{ fontSize: '0.85em' }}>
                                    GPA: {edu.gpa}
                                  </p>
                                )}
                                {edu.honors && edu.honors.length > 0 && (
                                  <p className="text-gray-400 mt-1 italic" style={{ fontSize: '0.85em' }}>
                                    {edu.honors.join(', ')}
                                  </p>
                                )}
                              </div>
                            </ClickableSection>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add education</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            case 'skills':
              return (
                <ClickableSection key={section.id} sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      Skills
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.skills?.length > 0 ? (
                        <p className="text-gray-700" style={{ fontSize: '0.95em' }}>
                          {cvData.skills.map(skill => skill.name).join('  ·  ')}
                        </p>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add skills</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            case 'certifications':
              return (
                <ClickableSection key={section.id} sectionType="certifications" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      Certifications
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.certifications?.length > 0 ? (
                        <div className="space-y-2">
                          {cvData.certifications.map(cert => (
                            <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div className="flex justify-between items-baseline" style={{ fontSize: '0.95em' }}>
                                <span className="text-gray-700">
                                  {cert.name}
                                  <span className="text-gray-400"> · {cert.issuer}</span>
                                </span>
                                <span className="text-gray-400">{formatDate(cert.date)}</span>
                              </div>
                            </ClickableSection>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add certifications</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            case 'projects':
              return (
                <ClickableSection key={section.id} sectionType="projects" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      Projects
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.projects?.length > 0 ? (
                        <div className="space-y-4">
                          {cvData.projects.map(project => (
                            <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div>
                                <div className="flex justify-between items-baseline mb-1">
                                  <h3 className="font-medium text-gray-900" style={{ fontSize: '1em' }}>
                                    {project.name}
                                  </h3>
                                  {project.startDate && (
                                    <span className="text-gray-400" style={{ fontSize: '0.85em' }}>
                                      {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600" style={{ fontSize: '0.95em' }}>{project.description}</p>
                                {project.technologies.length > 0 && (
                                  <p className="text-gray-400 mt-1" style={{ fontSize: '0.85em' }}>
                                    {project.technologies.join(' · ')}
                                  </p>
                                )}
                                {project.highlights.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {project.highlights.map((highlight, idx) => (
                                      <li key={idx} className="text-gray-600 flex" style={{ fontSize: '0.95em' }}>
                                        <span className="text-gray-300 mr-3">—</span>
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
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add projects</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            case 'languages':
              return (
                <ClickableSection key={section.id} sectionType="languages" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                  <section>
                    <h2 className="text-gray-400 uppercase tracking-widest mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.15em' }}>
                      Languages
                    </h2>
                    <div className="border-l-2 border-gray-200 pl-4">
                      {cvData.languages?.length > 0 ? (
                        <p className="text-gray-700" style={{ fontSize: '0.95em' }}>
                          {cvData.languages.map(lang => `${lang.name} (${lang.proficiency})`).join('  ·  ')}
                        </p>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm italic">Click to add languages</p>
                        </div>
                      )}
                    </div>
                  </section>
                </ClickableSection>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}


