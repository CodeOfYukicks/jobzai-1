import { CVData } from '../../../types/cvEditor';
import { formatDateRange, formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { Github, Globe, Mail, MapPin } from 'lucide-react';

interface TechMinimalistProps {
  cvData: CVData;
}

export default function TechMinimalist({ cvData }: TechMinimalistProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

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
    <div className="font-mono text-gray-900" style={{ fontSize: '9.5pt', lineHeight: 1.4 }}>
      {/* Header - Minimalist */}
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
            </h1>
            {cvData.personalInfo.title && (
              <p className="text-sm text-gray-600 mt-1 font-sans">{cvData.personalInfo.title}</p>
            )}
          </div>
          
          {/* Contact Info - Right aligned */}
          <div className="text-right text-xs space-y-1">
            {cvData.personalInfo.email && (
              <div className="flex items-center justify-end gap-1">
                <span className="text-gray-600">{cvData.personalInfo.email}</span>
                <Mail className="w-3 h-3 text-gray-400" />
              </div>
            )}
            {cvData.personalInfo.location && (
              <div className="flex items-center justify-end gap-1">
                <span className="text-gray-600">{cvData.personalInfo.location}</span>
                <MapPin className="w-3 h-3 text-gray-400" />
              </div>
            )}
            {cvData.personalInfo.github && (
              <div className="flex items-center justify-end gap-1">
                <span className="text-gray-600">{formatURL(cvData.personalInfo.github)}</span>
                <Github className="w-3 h-3 text-gray-400" />
              </div>
            )}
            {cvData.personalInfo.portfolio && (
              <div className="flex items-center justify-end gap-1">
                <span className="text-gray-600">{formatURL(cvData.personalInfo.portfolio)}</span>
                <Globe className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Summary - Code block style */}
      {cvData.summary && enabledSections.find(s => s.type === 'summary') && (
        <section className="mb-6">
          <div className="bg-gray-50 border-l-4 border-gray-400 p-3">
            <p className="text-sm text-gray-700 font-sans leading-relaxed">
              {cvData.summary}
            </p>
          </div>
        </section>
      )}

      {/* Skills - Grid layout */}
      {cvData.skills?.length > 0 && enabledSections.find(s => s.type === 'skills') && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            TECHNICAL STACK
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(groupedSkills).map(([category, skills]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-600 mb-1">
                  {skillCategories[category as keyof typeof skillCategories] || category}
                </h3>
                <div className="text-xs text-gray-700 space-y-0.5">
                  {skills.map(skill => (
                    <span key={skill.id} className="inline-block mr-2">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience - Clean blocks */}
      {cvData.experiences?.length > 0 && enabledSections.find(s => s.type === 'experience') && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            EXPERIENCE
          </h2>
          <div className="space-y-4">
            {cvData.experiences.map(exp => (
              <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {exp.title}
                      <span className="text-gray-600 font-normal"> @ {exp.company}</span>
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-sans">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-xs text-gray-600 mb-2 font-sans">
                    {exp.description}
                  </p>
                )}
                {exp.bullets.length > 0 && (
                  <ul className="space-y-1">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-xs text-gray-700 font-sans flex">
                        <span className="text-gray-400 mr-2">→</span>
                        <span className="flex-1">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects - Tech focus */}
      {cvData.projects?.length > 0 && enabledSections.find(s => s.type === 'projects') && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            PROJECTS
          </h2>
          <div className="space-y-3">
            {cvData.projects.map(project => (
              <div key={project.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {project.name}
                  </h3>
                  {project.url && (
                    <span className="text-xs text-blue-600">
                      [{formatURL(project.url)}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 font-sans mt-1">
                  {project.description}
                </p>
                {project.technologies.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">Stack: </span>
                    <span className="text-xs text-gray-700">
                      {project.technologies.join(' • ')}
                    </span>
                  </div>
                )}
                {project.highlights.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {project.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-xs text-gray-600 font-sans flex">
                        <span className="text-gray-400 mr-2">→</span>
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

      {/* Education - Compact */}
      {cvData.education?.length > 0 && enabledSections.find(s => s.type === 'education') && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            EDUCATION
          </h2>
          <div className="space-y-2">
            {cvData.education.map(edu => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    {edu.degree}
                    {edu.field && ` • ${edu.field}`}
                  </span>
                  <p className="text-xs text-gray-600 font-sans">
                    {edu.institution}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500 font-sans">
                  {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications - List style */}
      {cvData.certifications?.length > 0 && enabledSections.find(s => s.type === 'certifications') && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            CERTIFICATIONS
          </h2>
          <div className="space-y-1">
            {cvData.certifications.map(cert => (
              <div key={cert.id} className="text-xs text-gray-700 font-sans">
                <span className="text-gray-400">→</span>
                <span className="ml-2">
                  {cert.name} • {cert.issuer} • {cert.date}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
