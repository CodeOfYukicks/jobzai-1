import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { formatDateRange as formatDateRangeUtil } from '../../../lib/dateFormatters';

interface ExecutiveClassicProps {
  cvData: CVData;
  layoutSettings: CVLayoutSettings;
}

export default function ExecutiveClassic({ cvData, layoutSettings }: ExecutiveClassicProps) {
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
      <header className="text-center mb-8 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-wide uppercase">
          {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
        </h1>
        {cvData.personalInfo.title && (
          <p className="text-lg text-gray-700 mb-3 italic">{cvData.personalInfo.title}</p>
        )}
        
        {/* Contact Info - Centered */}
        <div className="flex justify-center flex-wrap gap-3 text-sm text-gray-600">
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
          <div className="flex justify-center flex-wrap gap-3 text-sm text-gray-600 mt-1">
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

      {/* Two Column Layout */}
      <div className="flex gap-8">
        {/* Left Column - 70% */}
        <div className="flex-1" style={{ flex: '0 0 70%' }}>
          {/* Summary */}
          {cvData.summary && enabledSections.find(s => s.type === 'summary') && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Executive Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed text-justify">
                {cvData.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {cvData.experiences?.length > 0 && enabledSections.find(s => s.type === 'experience') && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Professional Experience
              </h2>
              <div className="space-y-5">
                {cvData.experiences.map(exp => (
                  <div key={exp.id}>
                    <div className="mb-2">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-gray-900">{exp.title}</h3>
                        <span className="text-sm text-gray-600 italic">
                          {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 italic">
                        {exp.company}
                        {exp.location && ` — ${exp.location}`}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-gray-700 mb-2 text-justify">
                        {exp.description}
                      </p>
                    )}
                    {exp.bullets.length > 0 && (
                      <ul className="space-y-1">
                        {exp.bullets.map((bullet, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex">
                            <span className="mr-2">•</span>
                            <span className="flex-1 text-justify">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {cvData.projects?.length > 0 && enabledSections.find(s => s.type === 'projects') && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Key Projects
              </h2>
              <div className="space-y-3">
                {cvData.projects.map(project => (
                  <div key={project.id}>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-700 text-justify">{project.description}</p>
                    {project.highlights.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {project.highlights.map((highlight, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex">
                            <span className="mr-2">•</span>
                            <span className="flex-1">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Education
              </h2>
              <div className="space-y-3">
                {cvData.education.map(edu => (
                  <div key={edu.id}>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {edu.degree}
                    </h3>
                    {edu.field && (
                      <p className="text-sm text-gray-700 italic">{edu.field}</p>
                    )}
                    <p className="text-sm text-gray-700">
                      {edu.institution}
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      {edu.endDate}
                    </p>
                    {edu.gpa && (
                      <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                    )}
                    {edu.honors && edu.honors.length > 0 && (
                      <p className="text-sm text-gray-600 italic mt-1">
                        {edu.honors.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {cvData.skills?.length > 0 && enabledSections.find(s => s.type === 'skills') && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Core Competencies
              </h2>
              <div className="space-y-1">
                {cvData.skills.map(skill => (
                  <div key={skill.id} className="text-sm text-gray-700">
                    • {skill.name}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {cvData.certifications?.length > 0 && enabledSections.find(s => s.type === 'certifications') && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Certifications
              </h2>
              <div className="space-y-2">
                {cvData.certifications.map(cert => (
                  <div key={cert.id}>
                    <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                    <p className="text-sm text-gray-600 italic">
                      {cert.issuer}, {cert.date}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {cvData.languages?.length > 0 && enabledSections.find(s => s.type === 'languages') && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-3">
                Languages
              </h2>
              <div className="space-y-1">
                {cvData.languages.map(lang => (
                  <div key={lang.id} className="text-sm text-gray-700">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-gray-600 italic"> — {lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
