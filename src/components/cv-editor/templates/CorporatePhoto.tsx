import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil, formatCVDate as formatCVDateUtil } from '../../../lib/dateFormatters';
import { Mail, Phone, MapPin, Linkedin, Globe, Github, User } from 'lucide-react';
import ClickableSection from '../ClickableSection';
import { COLOR_HEX_MAP } from '../TemplateCard';

interface CorporatePhotoProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function CorporatePhoto({ cvData, layoutSettings, onSectionClick, highlightTarget }: CorporatePhotoProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  // Dynamic accent color from layoutSettings
  const accentColor = layoutSettings.accentColor 
    ? COLOR_HEX_MAP[layoutSettings.accentColor] 
    : '#2563eb'; // Default blue for Corporate

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
  };

  const formatDate = (date: string) => {
    return formatCVDateUtil(date, layoutSettings.dateFormat as any);
  };

  const baseFontSize = layoutSettings.fontSize;

  // Split sections for sidebar
  const sidebarSections = ['skills', 'languages', 'certifications', 'education'];
  const mainSections = enabledSections.filter(s => !sidebarSections.includes(s.type) && s.type !== 'personal');
  const sidebarEnabledSections = enabledSections.filter(s => sidebarSections.includes(s.type));

  return (
    <div 
      className="text-gray-900" 
      style={{ 
        fontSize: `${baseFontSize}pt`, 
        lineHeight: layoutSettings.lineHeight,
        fontFamily: layoutSettings.fontFamily || 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header with Photo */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
        <header className="mb-6">
          <div className="flex items-center gap-5">
            {/* Profile Photo - Square with rounded corners */}
            {cvData.personalInfo.photoUrl ? (
              <img 
                src={cvData.personalInfo.photoUrl} 
                alt={`${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`}
                className="w-20 h-20 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shadow-sm">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Name and Title */}
            <div className="flex-1">
              <h1 className="font-bold text-gray-900" style={{ fontSize: '1.75em' }}>
                {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
              </h1>
              {cvData.personalInfo.title && (
                <p className="font-medium mt-0.5" style={{ fontSize: '1.1em', color: accentColor }}>
                  {cvData.personalInfo.title}
                </p>
              )}
              
              {/* Contact Info Row */}
              <div className="flex flex-wrap gap-3 mt-2 text-gray-600" style={{ fontSize: '0.85em' }}>
                {cvData.personalInfo.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>{cvData.personalInfo.email}</span>
                  </div>
                )}
                {cvData.personalInfo.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>{cvData.personalInfo.phone}</span>
                  </div>
                )}
                {cvData.personalInfo.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>{cvData.personalInfo.location}</span>
                  </div>
                )}
              </div>

              {/* Links Row */}
              {(cvData.personalInfo.linkedin || cvData.personalInfo.github || cvData.personalInfo.portfolio) && (
                <div className="flex flex-wrap gap-3 mt-1 text-gray-600" style={{ fontSize: '0.85em' }}>
                  {cvData.personalInfo.linkedin && (
                    <div className="flex items-center gap-1">
                      <Linkedin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <span>{formatURL(cvData.personalInfo.linkedin)}</span>
                    </div>
                  )}
                  {cvData.personalInfo.github && (
                    <div className="flex items-center gap-1">
                      <Github className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <span>{formatURL(cvData.personalInfo.github)}</span>
                    </div>
                  )}
                  {cvData.personalInfo.portfolio && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <span>{formatURL(cvData.personalInfo.portfolio)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Accent bar */}
          <div className="h-1 w-full mt-4 rounded-full" style={{ backgroundColor: accentColor }} />
        </header>
      </ClickableSection>

      {/* Two Column Layout */}
      <div className="flex gap-6">
        {/* Left Main Content - 65% */}
        <div className="flex-1" style={{ flex: '0 0 65%' }}>
          {mainSections.map(section => {
            switch (section.type) {
              case 'summary':
                return (
                  <ClickableSection key={section.id} sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.9em', color: accentColor, borderColor: accentColor }}>
                        Professional Summary
                      </h2>
                      {cvData.summary ? (
                        <p className="text-gray-700" style={{ fontSize: '0.95em' }}>
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

              case 'experience':
                const experienceSpacing = layoutSettings.experienceSpacing ?? 6;
                return (
                  <ClickableSection key={section.id} sectionType="experience" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.9em', color: accentColor, borderColor: accentColor }}>
                        Professional Experience
                      </h2>
                      {cvData.experiences?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: `${experienceSpacing * 4}px` }}>
                          {cvData.experiences.map(exp => (
                            <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>{exp.title}</h3>
                                    <p className="text-gray-600" style={{ fontSize: '0.9em' }}>
                                      {exp.company}{exp.location && ` • ${exp.location}`}
                                    </p>
                                  </div>
                                  <span className="text-gray-500 whitespace-nowrap font-medium" style={{ fontSize: '0.85em', color: accentColor }}>
                                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                  </span>
                                </div>
                                {exp.description && (
                                  <p className="text-gray-700 mb-1" style={{ fontSize: '0.9em' }}>{exp.description}</p>
                                )}
                                {exp.bullets.length > 0 && (
                                  <ul className="space-y-0.5 ml-3">
                                    {exp.bullets.map((bullet, idx) => (
                                      <li key={idx} className="text-gray-700 flex" style={{ fontSize: '0.9em' }}>
                                        <span className="mr-2" style={{ color: accentColor }}>▸</span>
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

              case 'projects':
                return (
                  <ClickableSection key={section.id} sectionType="projects" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.9em', color: accentColor, borderColor: accentColor }}>
                        Key Projects
                      </h2>
                      {cvData.projects?.length > 0 ? (
                        <div className="space-y-3">
                          {cvData.projects.map(project => (
                            <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div>
                                <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>{project.name}</h3>
                                  {project.startDate && (
                                    <span className="text-gray-500" style={{ fontSize: '0.85em' }}>
                                      {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700" style={{ fontSize: '0.9em' }}>{project.description}</p>
                                {project.technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {project.technologies.map((tech, idx) => (
                                      <span 
                                        key={idx} 
                                        className="px-2 py-0.5 rounded text-xs"
                                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
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

              default:
                return null;
            }
          })}
        </div>

        {/* Right Sidebar - 35% */}
        <div style={{ flex: '0 0 32%' }}>
          {sidebarEnabledSections.map(section => {
            switch (section.type) {
              case 'skills':
                return (
                  <ClickableSection key={section.id} sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.85em', color: accentColor, borderColor: accentColor }}>
                        Core Skills
                      </h2>
                      {cvData.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cvData.skills.map(skill => (
                            <span 
                              key={skill.id}
                              className="px-2 py-1 rounded text-sm font-medium"
                              style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded p-2 text-center">
                          <p className="text-gray-400 text-xs italic">Add skills</p>
                        </div>
                      )}
                    </section>
                  </ClickableSection>
                );

              case 'education':
                return (
                  <ClickableSection key={section.id} sectionType="education" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.85em', color: accentColor, borderColor: accentColor }}>
                        Education
                      </h2>
                      {cvData.education?.length > 0 ? (
                        <div className="space-y-3">
                          {cvData.education.map(edu => (
                            <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div>
                                <h3 className="font-bold text-gray-900" style={{ fontSize: '0.95em' }}>
                                  {edu.degree}
                                </h3>
                                {edu.field && (
                                  <p className="text-gray-600" style={{ fontSize: '0.85em' }}>{edu.field}</p>
                                )}
                                <p className="text-gray-600" style={{ fontSize: '0.85em' }}>{edu.institution}</p>
                                <p style={{ fontSize: '0.8em', color: accentColor }}>{formatDate(edu.endDate)}</p>
                                {edu.gpa && (
                                  <p className="text-gray-500" style={{ fontSize: '0.8em' }}>GPA: {edu.gpa}</p>
                                )}
                              </div>
                            </ClickableSection>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded p-2 text-center">
                          <p className="text-gray-400 text-xs italic">Add education</p>
                        </div>
                      )}
                    </section>
                  </ClickableSection>
                );

              case 'certifications':
                return (
                  <ClickableSection key={section.id} sectionType="certifications" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.85em', color: accentColor, borderColor: accentColor }}>
                        Certifications
                      </h2>
                      {cvData.certifications?.length > 0 ? (
                        <div className="space-y-2">
                          {cvData.certifications.map(cert => (
                            <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div style={{ fontSize: '0.85em' }}>
                                <p className="font-medium text-gray-900">{cert.name}</p>
                                <p className="text-gray-500">{cert.issuer}</p>
                                <p style={{ color: accentColor }}>{formatDate(cert.date)}</p>
                              </div>
                            </ClickableSection>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded p-2 text-center">
                          <p className="text-gray-400 text-xs italic">Add certifications</p>
                        </div>
                      )}
                    </section>
                  </ClickableSection>
                );

              case 'languages':
                return (
                  <ClickableSection key={section.id} sectionType="languages" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold uppercase tracking-wide mb-2 pb-1 border-b-2" style={{ fontSize: '0.85em', color: accentColor, borderColor: accentColor }}>
                        Languages
                      </h2>
                      {cvData.languages?.length > 0 ? (
                        <div className="space-y-1">
                          {cvData.languages.map(lang => (
                            <ClickableSection key={lang.id} sectionType="languages" itemId={lang.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div className="flex justify-between" style={{ fontSize: '0.9em' }}>
                                <span className="font-medium text-gray-900">{lang.name}</span>
                                <span className="capitalize" style={{ color: accentColor }}>{lang.proficiency}</span>
                              </div>
                            </ClickableSection>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded p-2 text-center">
                          <p className="text-gray-400 text-xs italic">Add languages</p>
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
      </div>
    </div>
  );
}




