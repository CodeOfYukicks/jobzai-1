import { CVData } from '../../../types/cvEditor';
import { formatDateRange, formatURL, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from 'lucide-react';

interface ModernProfessionalProps {
  cvData: CVData;
}

export default function ModernProfessional({ cvData }: ModernProfessionalProps) {
  const enabledSections = getEnabledSections(sortSections(cvData.sections));

  return (
    <div className="font-sans text-gray-900" style={{ fontSize: '10pt', lineHeight: 1.5 }}>
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
        </h1>
        {cvData.personalInfo.title && (
          <p className="text-lg text-gray-700 mb-3">{cvData.personalInfo.title}</p>
        )}
        
        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {cvData.personalInfo.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{cvData.personalInfo.email}</span>
            </div>
          )}
          {cvData.personalInfo.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{cvData.personalInfo.phone}</span>
            </div>
          )}
          {cvData.personalInfo.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{cvData.personalInfo.location}</span>
            </div>
          )}
          {cvData.personalInfo.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-3.5 h-3.5" />
              <span>{formatURL(cvData.personalInfo.linkedin)}</span>
            </div>
          )}
          {cvData.personalInfo.github && (
            <div className="flex items-center gap-1">
              <Github className="w-3.5 h-3.5" />
              <span>{formatURL(cvData.personalInfo.github)}</span>
            </div>
          )}
          {cvData.personalInfo.portfolio && (
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{formatURL(cvData.personalInfo.portfolio)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Sections */}
      {enabledSections.map(section => {
        switch (section.type) {
          case 'summary':
            if (!cvData.summary) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Professional Summary
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {cvData.summary}
                </p>
              </section>
            );

          case 'experience':
            if (!cvData.experiences?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {cvData.experiences.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                          <p className="text-sm text-gray-700">
                            {exp.company}
                            {exp.location && ` • ${exp.location}`}
                          </p>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                      )}
                      {exp.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-1">
                          {exp.bullets.map((bullet, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'education':
            if (!cvData.education?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Education
                </h2>
                <div className="space-y-3">
                  {cvData.education.map(edu => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {edu.degree}
                            {edu.field && ` in ${edu.field}`}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {edu.institution}
                            {edu.location && ` • ${edu.location}`}
                          </p>
                          {edu.gpa && (
                            <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {edu.endDate}
                        </span>
                      </div>
                      {edu.honors && edu.honors.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Honors: {edu.honors.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'skills':
            if (!cvData.skills?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map(skill => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </section>
            );

          case 'certifications':
            if (!cvData.certifications?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Certifications
                </h2>
                <div className="space-y-2">
                  {cvData.certifications.map(cert => (
                    <div key={cert.id}>
                      <span className="font-medium text-gray-900">{cert.name}</span>
                      <span className="text-sm text-gray-600">
                        {' • '}{cert.issuer} • {cert.date}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'projects':
            if (!cvData.projects?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Projects
                </h2>
                <div className="space-y-3">
                  {cvData.projects.map(project => (
                    <div key={project.id}>
                      <h3 className="font-semibold text-gray-900">
                        {project.name}
                        {project.url && (
                          <span className="ml-2 text-sm text-blue-600 font-normal">
                            {formatURL(project.url)}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-700">{project.description}</p>
                      {project.technologies.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Technologies: {project.technologies.join(', ')}
                        </p>
                      )}
                      {project.highlights.length > 0 && (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {project.highlights.map((highlight, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'languages':
            if (!cvData.languages?.length) return null;
            return (
              <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">
                  Languages
                </h2>
                <div className="flex flex-wrap gap-3">
                  {cvData.languages.map(lang => (
                    <span key={lang.id} className="text-sm text-gray-700">
                      <span className="font-medium">{lang.name}</span>
                      {' - '}
                      <span className="text-gray-600">{lang.proficiency}</span>
                    </span>
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
