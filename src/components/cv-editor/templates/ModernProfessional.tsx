import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil } from '../../../lib/dateFormatters';
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from 'lucide-react';
import ClickableSection from '../ClickableSection';
import { COLOR_HEX_MAP } from '../TemplateCard';

interface ModernProfessionalProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function ModernProfessional({ cvData, layoutSettings, onSectionClick, highlightTarget }: ModernProfessionalProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));
  
  // Dynamic accent color from layoutSettings
  const accentColor = layoutSettings.accentColor 
    ? COLOR_HEX_MAP[layoutSettings.accentColor] 
    : '#3b82f6'; // Default blue for Modern

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
  };

  // Base font size in pt, all other sizes are relative to this
  const baseFontSize = layoutSettings.fontSize;

  return (
    <div 
      className="text-gray-900" 
      style={{ 
        fontSize: `${baseFontSize}pt`, 
        lineHeight: layoutSettings.lineHeight,
        fontFamily: layoutSettings.fontFamily
      }}
    >
      {/* Header */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <header className="mb-6">
          <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '2.25em' }}>
            {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
          </h1>
          {cvData.personalInfo.title && (
            <p className="text-gray-700 mb-3" style={{ fontSize: '1.25em' }}>{cvData.personalInfo.title}</p>
          )}
          
          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-gray-600" style={{ fontSize: '0.9em' }}>
            {cvData.personalInfo.email && (
              <div className="flex items-center gap-1">
                <Mail style={{ width: '1em', height: '1em', color: accentColor }} />
                <span>{cvData.personalInfo.email}</span>
              </div>
            )}
            {cvData.personalInfo.phone && (
              <div className="flex items-center gap-1">
                <Phone style={{ width: '1em', height: '1em', color: accentColor }} />
                <span>{cvData.personalInfo.phone}</span>
              </div>
            )}
            {cvData.personalInfo.location && (
              <div className="flex items-center gap-1">
                <MapPin style={{ width: '1em', height: '1em', color: accentColor }} />
                <span>{cvData.personalInfo.location}</span>
              </div>
            )}
            {cvData.personalInfo.linkedin && (
              <div className="flex items-center gap-1">
                <Linkedin style={{ width: '1em', height: '1em', color: accentColor }} />
                <span>{formatURL(cvData.personalInfo.linkedin)}</span>
              </div>
            )}
            {cvData.personalInfo.github && (
              <div className="flex items-center gap-1">
                <Github style={{ width: '1em', height: '1em', color: accentColor }} />
                <span>{formatURL(cvData.personalInfo.github)}</span>
              </div>
            )}
            {cvData.personalInfo.portfolio && (
              <div className="flex items-center gap-1">
                <Globe style={{ width: '1em', height: '1em', color: accentColor }} />
                <span>{formatURL(cvData.personalInfo.portfolio)}</span>
              </div>
            )}
          </div>
        </header>
      </ClickableSection>

      {/* Sections */}
      {enabledSections.map(section => {
        switch (section.type) {
          case 'summary':
            if (!cvData.summary) return null;
            return (
              <ClickableSection key={section.id} sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-6">
                  <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                    Professional Summary
                  </h2>
                  <p className="text-gray-700 leading-relaxed" style={{ fontSize: '1em' }}>
                    {cvData.summary}
                  </p>
                </section>
              </ClickableSection>
            );

          case 'experience':
            if (!cvData.experiences?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {cvData.experiences.map(exp => (
                    <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>{exp.title}</h3>
                            <p className="text-gray-700" style={{ fontSize: '0.95em' }}>
                              {exp.company}
                              {exp.location && ` • ${exp.location}`}
                            </p>
                          </div>
                          <span className="text-gray-600" style={{ fontSize: '0.9em' }}>
                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-gray-700 mb-2" style={{ fontSize: '0.95em' }}>{exp.description}</p>
                        )}
                        {exp.bullets.length > 0 && (
                          <ul className="list-disc list-inside space-y-1">
                            {exp.bullets.map((bullet, idx) => (
                              <li key={idx} className="text-gray-700" style={{ fontSize: '0.95em' }}>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </ClickableSection>
                  ))}
                </div>
              </section>
            );

          case 'education':
            if (!cvData.education?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                  Education
                </h2>
                <div className="space-y-3">
                  {cvData.education.map(edu => (
                    <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                              {edu.degree}
                              {edu.field && ` in ${edu.field}`}
                            </h3>
                            <p className="text-gray-700" style={{ fontSize: '0.95em' }}>
                              {edu.institution}
                              {edu.location && ` • ${edu.location}`}
                            </p>
                            {edu.gpa && (
                              <p className="text-gray-600" style={{ fontSize: '0.9em' }}>GPA: {edu.gpa}</p>
                            )}
                          </div>
                          <span className="text-gray-600" style={{ fontSize: '0.9em' }}>
                            {edu.endDate}
                          </span>
                        </div>
                        {edu.honors && edu.honors.length > 0 && (
                          <p className="text-gray-600 mt-1" style={{ fontSize: '0.9em' }}>
                            Honors: {edu.honors.join(', ')}
                          </p>
                        )}
                      </div>
                    </ClickableSection>
                  ))}
                </div>
              </section>
            );

          case 'skills':
            if (!cvData.skills?.length) return null;
            return (
              <ClickableSection key={section.id} sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                <section className="mb-6">
                  <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills.map(skill => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                        style={{ fontSize: '0.9em' }}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>
              </ClickableSection>
            );

          case 'certifications':
            if (!cvData.certifications?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                  Certifications
                </h2>
                <div className="space-y-2">
                  {cvData.certifications.map(cert => (
                    <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div style={{ fontSize: '0.95em' }}>
                        <span className="font-medium text-gray-900">{cert.name}</span>
                        <span className="text-gray-600">
                          {' • '}{cert.issuer} • {cert.date}
                        </span>
                      </div>
                    </ClickableSection>
                  ))}
                </div>
              </section>
            );

          case 'projects':
            if (!cvData.projects?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                  Projects
                </h2>
                <div className="space-y-3">
                  {cvData.projects.map(project => (
                    <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <div>
                        <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                          {project.name}
                          {project.url && (
                            <span className="ml-2 font-normal" style={{ fontSize: '0.9em', color: accentColor }}>
                              {formatURL(project.url)}
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-700" style={{ fontSize: '0.95em' }}>{project.description}</p>
                        {project.technologies.length > 0 && (
                          <p className="text-gray-600 mt-1" style={{ fontSize: '0.9em' }}>
                            Technologies: {project.technologies.join(', ')}
                          </p>
                        )}
                        {project.highlights.length > 0 && (
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {project.highlights.map((highlight, idx) => (
                              <li key={idx} className="text-gray-700" style={{ fontSize: '0.95em' }}>
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </ClickableSection>
                  ))}
                </div>
              </section>
            );

          case 'languages':
            if (!cvData.languages?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="font-bold uppercase tracking-wider text-gray-700 border-b-2 pb-1 mb-3" style={{ fontSize: '1em', borderColor: accentColor }}>
                  Languages
                </h2>
                <div className="flex flex-wrap gap-3">
                  {cvData.languages.map(lang => (
                    <ClickableSection key={lang.id} sectionType="languages" itemId={lang.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                      <span className="text-gray-700" style={{ fontSize: '0.95em' }}>
                        <span className="font-medium">{lang.name}</span>
                        {' - '}
                        <span className="text-gray-600">{lang.proficiency}</span>
                      </span>
                    </ClickableSection>
                  ))}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
