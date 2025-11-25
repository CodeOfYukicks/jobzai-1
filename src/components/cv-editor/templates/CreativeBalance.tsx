import { CVData, CVLayoutSettings, SectionClickTarget } from '../../../types/cvEditor';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil } from '../../../lib/dateFormatters';
import { Mail, Phone, MapPin, Linkedin, Globe, Award, Briefcase, GraduationCap } from 'lucide-react';
import ClickableSection from '../ClickableSection';
import { COLOR_HEX_MAP } from '../TemplateCard';

interface CreativeBalanceProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
  onSectionClick?: (target: SectionClickTarget) => void;
}

export default function CreativeBalance({ cvData, layoutSettings, onSectionClick }: CreativeBalanceProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));
  
  // Dynamic accent color from layoutSettings
  const accentColor = layoutSettings.accentColor 
    ? COLOR_HEX_MAP[layoutSettings.accentColor] 
    : '#EB7134';
  
  // Generate lighter and darker variants
  const accentColorLight = `${accentColor}15`; // 15% opacity for backgrounds
  const accentColorMedium = `${accentColor}40`; // 40% opacity for subtle accents

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
      {/* Header with accent color */}
      <ClickableSection sectionType="personal" onSectionClick={onSectionClick}>
        <header className="mb-6 pb-4 border-b-4" style={{ borderColor: accentColor }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-light text-gray-900" style={{ fontSize: '2.25em' }}>
                <span className="font-bold">{cvData.personalInfo.firstName}</span>{' '}
                {cvData.personalInfo.lastName}
              </h1>
              {cvData.personalInfo.title && (
                <p className="mt-1 font-medium" style={{ fontSize: '1.25em', color: accentColor }}>
                  {cvData.personalInfo.title}
                </p>
              )}
            </div>
            
            {/* Contact Info with icons */}
            <div className="text-right space-y-1" style={{ fontSize: '0.9em' }}>
              {cvData.personalInfo.email && (
                <div className="flex items-center justify-end gap-2 text-gray-600">
                  <span>{cvData.personalInfo.email}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColorLight }}>
                    <Mail style={{ width: '1em', height: '1em', color: accentColor }} />
                  </div>
                </div>
              )}
              {cvData.personalInfo.phone && (
                <div className="flex items-center justify-end gap-2 text-gray-600">
                  <span>{cvData.personalInfo.phone}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColorLight }}>
                    <Phone style={{ width: '1em', height: '1em', color: accentColor }} />
                  </div>
                </div>
              )}
              {cvData.personalInfo.location && (
                <div className="flex items-center justify-end gap-2 text-gray-600">
                  <span>{cvData.personalInfo.location}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColorLight }}>
                    <MapPin style={{ width: '1em', height: '1em', color: accentColor }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Links bar */}
          {(cvData.personalInfo.linkedin || cvData.personalInfo.portfolio || cvData.personalInfo.github) && (
            <div className="flex gap-4 mt-3" style={{ fontSize: '0.9em' }}>
              {cvData.personalInfo.linkedin && (
                <a className="flex items-center gap-1 text-gray-600">
                  <Linkedin style={{ width: '1em', height: '1em' }} />
                  <span>{formatURL(cvData.personalInfo.linkedin)}</span>
                </a>
              )}
              {cvData.personalInfo.portfolio && (
                <a className="flex items-center gap-1 text-gray-600">
                  <Globe style={{ width: '1em', height: '1em' }} />
                  <span>{formatURL(cvData.personalInfo.portfolio)}</span>
                </a>
              )}
            </div>
          )}
        </header>
      </ClickableSection>

      {/* Summary with background */}
      {cvData.summary && enabledSections.find(s => s.type === 'summary') && (
        <ClickableSection sectionType="summary" onSectionClick={onSectionClick}>
          <section className="mb-6">
            <div className="rounded-lg p-4 border-l-4" style={{ backgroundColor: accentColorLight, borderColor: accentColor }}>
              <p className="text-gray-700 leading-relaxed" style={{ fontSize: '1em' }}>
                {cvData.summary}
              </p>
            </div>
          </section>
        </ClickableSection>
      )}

      {/* Main content in grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Column - 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Experience with icons */}
          {cvData.experiences?.length > 0 && enabledSections.find(s => s.type === 'experience') && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase style={{ width: '1.25em', height: '1.25em', color: accentColor }} />
                <h2 className="font-bold text-gray-800" style={{ fontSize: '1.15em' }}>Experience</h2>
              </div>
              <div className="space-y-4">
                {cvData.experiences.map(exp => (
                  <ClickableSection key={exp.id} sectionType="experience" itemId={exp.id} onSectionClick={onSectionClick}>
                    <div className="relative pl-6">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-2 w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }}></div>
                      <div className="absolute left-1.5 top-5 bottom-0 w-px bg-gray-200"></div>
                      
                      <div className="pb-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-gray-900" style={{ fontSize: '1em' }}>
                            {exp.title}
                            <span className="font-normal" style={{ color: accentColor }}> @ {exp.company}</span>
                          </h3>
                          <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded" style={{ fontSize: '0.9em' }}>
                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                          </span>
                        </div>
                        {exp.location && (
                          <p className="text-gray-600 mb-2" style={{ fontSize: '0.9em' }}>{exp.location}</p>
                        )}
                        {exp.description && (
                          <p className="text-gray-700 mb-2" style={{ fontSize: '0.95em' }}>{exp.description}</p>
                        )}
                        {exp.bullets.length > 0 && (
                          <ul className="space-y-1">
                            {exp.bullets.map((bullet, idx) => (
                              <li key={idx} className="text-gray-700 flex" style={{ fontSize: '0.95em' }}>
                                <span className="mr-2" style={{ color: accentColorMedium }}>▸</span>
                                <span className="flex-1">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </ClickableSection>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {cvData.projects?.length > 0 && enabledSections.find(s => s.type === 'projects') && (
            <section>
              <h2 className="font-bold text-gray-800 mb-3" style={{ fontSize: '1.15em' }}>Featured Projects</h2>
              <div className="grid grid-cols-1 gap-3">
                {cvData.projects.map(project => (
                  <ClickableSection key={project.id} sectionType="projects" itemId={project.id} onSectionClick={onSectionClick}>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="font-bold text-gray-900 mb-1" style={{ fontSize: '1em' }}>
                        {project.name}
                        {project.url && (
                          <span className="ml-2 font-normal" style={{ fontSize: '0.9em', color: accentColor }}>
                            View →
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-700 mb-2" style={{ fontSize: '0.95em' }}>{project.description}</p>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white text-gray-600 rounded" style={{ fontSize: '0.85em' }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </ClickableSection>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Side Column - 1/3 */}
        <div className="space-y-6">
          {/* Skills with visual bars */}
          {cvData.skills?.length > 0 && enabledSections.find(s => s.type === 'skills') && (
            <ClickableSection sectionType="skills" onSectionClick={onSectionClick}>
              <section>
                <h2 className="font-bold text-gray-800 mb-3" style={{ fontSize: '1.15em' }}>Skills</h2>
                <div className="space-y-2">
                  {cvData.skills.slice(0, 10).map(skill => (
                    <div key={skill.id} className="flex items-center gap-2">
                      <span className="text-gray-700 flex-1" style={{ fontSize: '0.95em' }}>{skill.name}</span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            backgroundColor: accentColor,
                            width: `${skill.level === 'expert' ? 100 : skill.level === 'advanced' ? 75 : skill.level === 'intermediate' ? 50 : 25}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </ClickableSection>
          )}

          {/* Education with icon */}
          {cvData.education?.length > 0 && enabledSections.find(s => s.type === 'education') && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap style={{ width: '1.25em', height: '1.25em', color: accentColor }} />
                <h2 className="font-bold text-gray-800" style={{ fontSize: '1.15em' }}>Education</h2>
              </div>
              <div className="space-y-3">
                {cvData.education.map(edu => (
                  <ClickableSection key={edu.id} sectionType="education" itemId={edu.id} onSectionClick={onSectionClick}>
                    <div>
                      <h3 className="font-semibold text-gray-900" style={{ fontSize: '1em' }}>
                        {edu.degree}
                      </h3>
                      {edu.field && (
                        <p style={{ fontSize: '0.95em', color: accentColor }}>{edu.field}</p>
                      )}
                      <p className="text-gray-600" style={{ fontSize: '0.95em' }}>
                        {edu.institution}
                      </p>
                      <p className="text-gray-500 mt-1" style={{ fontSize: '0.85em' }}>
                        {edu.endDate}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </p>
                    </div>
                  </ClickableSection>
                ))}
              </div>
            </section>
          )}

          {/* Certifications with badge icon */}
          {cvData.certifications?.length > 0 && enabledSections.find(s => s.type === 'certifications') && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Award style={{ width: '1.25em', height: '1.25em', color: accentColor }} />
                <h2 className="font-bold text-gray-800" style={{ fontSize: '1.15em' }}>Certifications</h2>
              </div>
              <div className="space-y-2">
                {cvData.certifications.map(cert => (
                  <ClickableSection key={cert.id} sectionType="certifications" itemId={cert.id} onSectionClick={onSectionClick}>
                    <div className="rounded p-2" style={{ backgroundColor: accentColorLight }}>
                      <p className="font-medium text-gray-900" style={{ fontSize: '0.95em' }}>{cert.name}</p>
                      <p className="text-gray-600" style={{ fontSize: '0.85em' }}>
                        {cert.issuer} • {cert.date}
                      </p>
                    </div>
                  </ClickableSection>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {cvData.languages?.length > 0 && enabledSections.find(s => s.type === 'languages') && (
            <section>
              <h2 className="font-bold text-gray-800 mb-3" style={{ fontSize: '1.15em' }}>Languages</h2>
              <div className="space-y-2">
                {cvData.languages.map(lang => (
                  <ClickableSection key={lang.id} sectionType="languages" itemId={lang.id} onSectionClick={onSectionClick}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700" style={{ fontSize: '0.95em' }}>{lang.name}</span>
                      <span className="text-white px-2 py-1 rounded" style={{ fontSize: '0.85em', backgroundColor: accentColor }}>
                        {lang.proficiency}
                      </span>
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
