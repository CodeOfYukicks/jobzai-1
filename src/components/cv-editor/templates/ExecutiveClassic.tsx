import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil } from '../../../lib/dateFormatters';
import ClickableSection from '../ClickableSection';

interface ExecutiveClassicProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
}

export default function ExecutiveClassic({ cvData, layoutSettings, onSectionClick }: ExecutiveClassicProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
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
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick}>
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
          {/* Summary */}
          {cvData.summary && enabledSections.find(s => s.type === 'summary') && (
            <ClickableSection sectionType="summary" onSectionClick={onSectionClick}>
              <section className="mb-6">
                <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                  Executive Summary
                </h2>
                <p className="text-gray-700 leading-relaxed text-justify" style={{ fontSize: '1em' }}>
                  {cvData.summary}
                </p>
              </section>
            </ClickableSection>
          )}

          {/* Experience */}
          {cvData.experiences?.length > 0 && enabledSections.find(s => s.type === 'experience') && (
            <section className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Professional Experience
              </h2>
              <div className="space-y-5">
                {cvData.experiences.map(exp => (
                  <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick}>
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
            </section>
          )}

          {/* Projects */}
          {cvData.projects?.length > 0 && enabledSections.find(s => s.type === 'projects') && (
            <section className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Key Projects
              </h2>
              <div className="space-y-3">
                {cvData.projects.map(project => (
                  <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick}>
                    <div>
                      <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                        {project.name}
                      </h3>
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
            </section>
          )}
        </div>

        {/* Right Column - 30% */}
        <div style={{ flex: '0 0 28%' }}>
          {/* Education */}
          {cvData.education?.length > 0 && enabledSections.find(s => s.type === 'education') && (
            <section className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Education
              </h2>
              <div className="space-y-3">
                {cvData.education.map(edu => (
                  <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick}>
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
                        {edu.endDate}
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
            </section>
          )}

          {/* Skills */}
          {cvData.skills?.length > 0 && enabledSections.find(s => s.type === 'skills') && (
            <ClickableSection sectionType="skills" onSectionClick={onSectionClick}>
              <section className="mb-6">
                <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                  Core Competencies
                </h2>
                <div className="space-y-1">
                  {cvData.skills.map(skill => (
                    <div key={skill.id} className="text-gray-700" style={{ fontSize: '0.95em' }}>
                      • {skill.name}
                    </div>
                  ))}
                </div>
              </section>
            </ClickableSection>
          )}

          {/* Certifications */}
          {cvData.certifications?.length > 0 && enabledSections.find(s => s.type === 'certifications') && (
            <section className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Certifications
              </h2>
              <div className="space-y-2">
                {cvData.certifications.map(cert => (
                  <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick}>
                    <div>
                      <p className="font-medium text-gray-900" style={{ fontSize: '0.95em' }}>{cert.name}</p>
                      <p className="text-gray-600 italic" style={{ fontSize: '0.9em' }}>
                        {cert.issuer}, {cert.date}
                      </p>
                    </div>
                  </ClickableSection>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {cvData.languages?.length > 0 && enabledSections.find(s => s.type === 'languages') && (
            <section className="mb-6">
              <h2 className="font-bold uppercase tracking-widest text-gray-800 mb-3" style={{ fontSize: '1em' }}>
                Languages
              </h2>
              <div className="space-y-1">
                {cvData.languages.map(lang => (
                  <ClickableSection key={lang.id} sectionType="languages" itemId={lang.id} onSectionClick={onSectionClick}>
                    <div className="text-gray-700" style={{ fontSize: '0.95em' }}>
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-gray-600 italic"> — {lang.proficiency}</span>
                    </div>
                  </ClickableSection>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
