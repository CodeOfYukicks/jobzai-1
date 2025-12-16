import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { HighlightTarget } from '../../../types/cvReview';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil, formatCVDate as formatCVDateUtil } from '../../../lib/dateFormatters';
import { Mail, Phone, MapPin, Linkedin, Globe, Github, User } from 'lucide-react';
import ClickableSection from '../ClickableSection';

interface SwissPhotoProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
  highlightTarget?: HighlightTarget | null;
}

export default function SwissPhoto({ cvData, layoutSettings, onSectionClick, highlightTarget }: SwissPhotoProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
    return formatDateRangeUtil(start, end, isCurrent, layoutSettings.dateFormat as any);
  };

  const formatDate = (date: string) => {
    return formatCVDateUtil(date, layoutSettings.dateFormat as any);
  };

  const baseFontSize = layoutSettings.fontSize;

  // Split sections for sidebar vs main content
  const sidebarSections = ['skills', 'languages', 'certifications'];
  const mainSections = enabledSections.filter(s => !sidebarSections.includes(s.type) && s.type !== 'personal');
  const sidebarEnabledSections = enabledSections.filter(s => sidebarSections.includes(s.type));

  return (
    <div 
      className="text-gray-900" 
      style={{ 
        fontSize: `${baseFontSize}pt`, 
        lineHeight: layoutSettings.lineHeight,
        fontFamily: layoutSettings.fontFamily || 'Helvetica Neue, Arial, sans-serif'
      }}
    >
      {/* Two Column Layout */}
      <div className="flex gap-6">
        {/* Left Sidebar - 30% */}
        <div className="flex-shrink-0" style={{ width: '28%' }}>
          {/* Photo & Personal Info */}
          <ClickableSection sectionType="personal" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
            <div className="mb-6">
              {/* Profile Photo - Round */}
              <div className="flex justify-center mb-4">
                {cvData.personalInfo.photoUrl ? (
                  <img 
                    src={cvData.personalInfo.photoUrl} 
                    alt={`${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="font-bold text-gray-900 text-center mb-1" style={{ fontSize: '1.4em' }}>
                {cvData.personalInfo.firstName}
                <br />
                {cvData.personalInfo.lastName}
              </h1>
              
              {cvData.personalInfo.title && (
                <p className="text-gray-600 text-center mb-4" style={{ fontSize: '0.9em' }}>
                  {cvData.personalInfo.title}
                </p>
              )}

              {/* Contact Info - Stacked */}
              <div className="space-y-2 text-gray-700" style={{ fontSize: '0.85em' }}>
                {cvData.personalInfo.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="break-all">{cvData.personalInfo.email}</span>
                  </div>
                )}
                {cvData.personalInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span>{cvData.personalInfo.phone}</span>
                  </div>
                )}
                {cvData.personalInfo.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span>{cvData.personalInfo.location}</span>
                  </div>
                )}
                {cvData.personalInfo.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="break-all">{formatURL(cvData.personalInfo.linkedin)}</span>
                  </div>
                )}
                {cvData.personalInfo.github && (
                  <div className="flex items-center gap-2">
                    <Github className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="break-all">{formatURL(cvData.personalInfo.github)}</span>
                  </div>
                )}
                {cvData.personalInfo.portfolio && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="break-all">{formatURL(cvData.personalInfo.portfolio)}</span>
                  </div>
                )}
              </div>
            </div>
          </ClickableSection>

          {/* Sidebar Sections */}
          {sidebarEnabledSections.map(section => {
            switch (section.type) {
              case 'skills':
                return (
                  <ClickableSection key={section.id} sectionType="skills" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.8em' }}>
                        Skills
                      </h2>
                      {cvData.skills?.length > 0 ? (
                        <div className="space-y-1">
                          {cvData.skills.map(skill => (
                            <div key={skill.id} className="text-gray-700" style={{ fontSize: '0.9em' }}>
                              {skill.name}
                            </div>
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

              case 'languages':
                return (
                  <ClickableSection key={section.id} sectionType="languages" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.8em' }}>
                        Languages
                      </h2>
                      {cvData.languages?.length > 0 ? (
                        <div className="space-y-1">
                          {cvData.languages.map(lang => (
                            <ClickableSection key={lang.id} sectionType="languages" itemId={lang.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div className="flex justify-between text-gray-700" style={{ fontSize: '0.9em' }}>
                                <span>{lang.name}</span>
                                <span className="text-gray-500 capitalize">{lang.proficiency}</span>
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

              case 'certifications':
                return (
                  <ClickableSection key={section.id} sectionType="certifications" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.8em' }}>
                        Certifications
                      </h2>
                      {cvData.certifications?.length > 0 ? (
                        <div className="space-y-2">
                          {cvData.certifications.map(cert => (
                            <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div style={{ fontSize: '0.85em' }}>
                                <p className="font-medium text-gray-900">{cert.name}</p>
                                <p className="text-gray-500">{cert.issuer}</p>
                                <p className="text-gray-400">{formatDate(cert.date)}</p>
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

              default:
                return null;
            }
          })}
        </div>

        {/* Right Main Content - 70% */}
        <div className="flex-1 border-l border-gray-200 pl-6">
          {mainSections.map(section => {
            switch (section.type) {
              case 'summary':
                return (
                  <ClickableSection key={section.id} sectionType="summary" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.85em' }}>
                        Profile
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
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.85em' }}>
                        Experience
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
                                      {exp.company}{exp.location && `, ${exp.location}`}
                                    </p>
                                  </div>
                                  <span className="text-gray-500 text-right whitespace-nowrap" style={{ fontSize: '0.85em' }}>
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
                                        <span className="mr-2">–</span>
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

              case 'education':
                return (
                  <ClickableSection key={section.id} sectionType="education" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.85em' }}>
                        Education
                      </h2>
                      {cvData.education?.length > 0 ? (
                        <div className="space-y-3">
                          {cvData.education.map(edu => (
                            <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                                    {edu.degree}{edu.field && ` in ${edu.field}`}
                                  </h3>
                                  <p className="text-gray-600" style={{ fontSize: '0.9em' }}>{edu.institution}</p>
                                  {edu.gpa && (
                                    <p className="text-gray-500" style={{ fontSize: '0.85em' }}>GPA: {edu.gpa}</p>
                                  )}
                                </div>
                                <span className="text-gray-500" style={{ fontSize: '0.85em' }}>
                                  {formatDate(edu.endDate)}
                                </span>
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

              case 'projects':
                return (
                  <ClickableSection key={section.id} sectionType="projects" onSectionClick={onSectionClick} highlightTarget={highlightTarget}>
                    <section className="mb-5">
                      <h2 className="font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontSize: '0.85em' }}>
                        Projects
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
                                  <p className="text-gray-500 mt-1" style={{ fontSize: '0.85em' }}>
                                    {project.technologies.join(' • ')}
                                  </p>
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
      </div>
    </div>
  );
}

