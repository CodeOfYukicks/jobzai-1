import { useMemo, useCallback } from 'react';

const FONT_STACK_SANS = '"Inter", "SF Pro Display", "Segoe UI", "Helvetica Neue", sans-serif';
const FONT_STACK_SERIF = '"Spectral", "Charter", "Georgia", serif';

export type TemplateType = 'harvard' | 'notion' | 'consulting';

export type FontFamily = 'Times New Roman' | 'Arial' | 'Calibri' | 'Georgia' | 'Helvetica';

export const FONT_FAMILIES: Record<FontFamily, string> = {
  'Times New Roman': '"Times New Roman", "Times", serif',
  'Arial': '"Arial", "Helvetica Neue", sans-serif',
  'Calibri': '"Calibri", "Candara", "Segoe UI", sans-serif',
  'Georgia': '"Georgia", "Times New Roman", serif',
  'Helvetica': '"Helvetica Neue", "Helvetica", "Arial", sans-serif',
};

type CertificationEntry = {
  name: string;
  issuer?: string;
  year?: string;
  details?: string;
};

interface CVData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    title?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    client?: string; // Client/projet si différent de l'entreprise
    location?: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }>;
  skills: string[];
  certifications?: CertificationEntry[];
  languages?: Array<{
    name: string;
    level?: string;
  }>;
  hobbies?: string[];
}

interface PreviewPanelProps {
  cvData: CVData;
  template: TemplateType;
  fontFamily?: FontFamily;
  fontSize?: number; // in pt
  sectionOrder?: string[]; // Order of sections from editor
}

export default function PreviewPanel({ cvData, template, fontFamily = 'Times New Roman', fontSize, sectionOrder }: PreviewPanelProps) {
  const TemplateRenderer = getTemplateRenderer(template);
  
  // Memoize to prevent unnecessary re-renders that cause flickering
  // Only re-render when actual props change
  return <TemplateRenderer 
    key={`${template}-${fontFamily}-${fontSize?.toFixed(1)}`}
    cvData={cvData} 
    fontFamily={fontFamily} 
    fontSize={fontSize} 
    sectionOrder={sectionOrder} 
  />;
}

// Template Renderers
function getTemplateRenderer(template: TemplateType) {
  switch (template) {
    case 'harvard':
      return HarvardTemplate;
    case 'notion':
      return NotionTemplate;
    case 'consulting':
    default:
      return ConsultingTemplate;
  }
}

// Helper to ensure all templates receive font props
type TemplateProps = {
  cvData: CVData;
  fontFamily?: FontFamily;
  fontSize?: number;
  sectionOrder?: string[];
};

const buildContactLine = (info: CVData['personalInfo']) =>
  [info.email, info.phone, info.location, info.linkedin].filter(Boolean).join(' • ');

const SkillsChips = ({ skills }: { skills: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {skills.map((skill, idx) => (
      <span key={idx} className="px-3 py-1 rounded-full border border-gray-200 text-xs font-semibold text-gray-700">
        {skill}
      </span>
    ))}
  </div>
);

type LanguageEntry = {
  name: string;
  level?: string;
};

const LanguagesChips = ({ languages }: { languages?: LanguageEntry[] }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((language, idx) => (
        <span key={idx} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
          {language.name}
          {language.level ? ` • ${language.level}` : ''}
        </span>
      ))}
    </div>
  );
};

const CertificationSection = ({ certifications }: { certifications?: CertificationEntry[] }) => {
  if (!certifications || certifications.length === 0) return null;
  return (
    <div className="space-y-2 text-sm text-gray-700">
      {certifications.map((cert, idx) => (
        <div key={idx}>
          <p className="font-semibold">{cert.name}</p>
          <p className="text-xs text-gray-500">
            {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
          </p>
          {cert.details && <p className="text-xs text-gray-500">{cert.details}</p>}
        </div>
      ))}
    </div>
  );
};

const HobbiesSection = ({ hobbies }: { hobbies?: string[] }) => {
  if (!hobbies || hobbies.length === 0) return null;
  return <p className="text-sm text-gray-700">{hobbies.join(' • ')}</p>;
};

// Harvard Template (Official Harvard OCS Format)
// Based on Harvard Office of Career Services official resume template
// Note: Preview paper stays white even in dark mode (realistic PDF)
function HarvardTemplate({ cvData, fontFamily = 'Times New Roman', fontSize = 11, sectionOrder }: { cvData: CVData; fontFamily?: FontFamily; fontSize?: number; sectionOrder?: string[] }) {
  const contactLine = buildContactLine(cvData.personalInfo);
  const fontStack = FONT_FAMILIES[fontFamily];
  const baseFontSize = `${fontSize}pt`;
  const nameFontSize = `${Math.max(13, fontSize + 2)}pt`; // Name: 13-15pt
  
  // Default order if not provided - memoized to prevent re-renders
  const defaultOrder = useMemo(() => ['summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'hobbies'], []);
  const order = useMemo(() => sectionOrder || defaultOrder, [sectionOrder, defaultOrder]);
  
  // Memoize sections rendering to prevent flickering
  const renderedSections = useMemo(() => {
    // Render section based on sectionId
    const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!cvData.summary) return null;
        return (
          <section key="summary" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-1.5 uppercase">
              PROFESSIONAL SUMMARY
            </h2>
            <p className="text-justify" style={{ fontSize: baseFontSize, lineHeight: 1.4 }}>
              {cvData.summary}
            </p>
          </section>
        );
      
      case 'experience':
        if (!cvData.experience || cvData.experience.length === 0) return null;
        return (
          <section key="experience" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-2 uppercase">
              PROFESSIONAL EXPERIENCE
            </h2>
            {cvData.experience.map((exp, idx) => {
              const companyDisplay = exp.client ? exp.client : exp.company;
              const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
              return (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-semibold" style={{ fontSize: baseFontSize }}>
                      {exp.title}
                      {companyDisplay && <span className="font-normal">, {companyDisplay}{companySuffix}</span>}
                    </p>
                    <span className="text-xs text-gray-600" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <ul className="mt-1 space-y-0.5 list-disc pl-5" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt`, lineHeight: 1.3 }}>
                    {exp.bullets.map((bullet, bidx) => (
                      <li key={bidx} className="text-gray-800">{bullet}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        );
      
      case 'education':
        if (!cvData.education || cvData.education.length === 0) return null;
        return (
          <section key="education" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-2 uppercase">
              EDUCATION
            </h2>
            {cvData.education.map((edu, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold" style={{ fontSize: baseFontSize }}>{edu.degree}</p>
                  <span className="text-xs text-gray-600" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{edu.year}</span>
                </div>
                <p className="text-sm text-gray-700" style={{ fontSize: `${Math.max(9, fontSize - 1)}pt` }}>
                  {edu.institution}
                </p>
                {edu.details && (
                  <p className="text-xs text-gray-600 mt-0.5" style={{ fontSize: `${Math.max(8, fontSize - 2)}pt` }}>
                    {edu.details}
                  </p>
                )}
              </div>
            ))}
          </section>
        );
      
      case 'skills':
        if (!cvData.skills || cvData.skills.length === 0) return null;
        return (
          <section key="skills" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-1.5 uppercase">
              SKILLS
            </h2>
            <p style={{ fontSize: baseFontSize, lineHeight: 1.4 }}>
              {cvData.skills.join(' • ')}
            </p>
          </section>
        );
      
      case 'certifications':
        if (!cvData.certifications || cvData.certifications.length === 0) return null;
        return (
          <section key="certifications" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-1.5 uppercase">
              CERTIFICATIONS
            </h2>
            <div className="space-y-1">
              {cvData.certifications.map((cert, idx) => (
                <div key={idx}>
                  <p className="font-semibold" style={{ fontSize: baseFontSize }}>{cert.name}</p>
                  {cert.issuer && (
                    <p className="text-xs text-gray-600" style={{ fontSize: `${Math.max(8, fontSize - 2)}pt` }}>
                      {cert.issuer}{cert.year ? `, ${cert.year}` : ''}
                    </p>
                  )}
                  {cert.details && (
                    <p className="text-xs text-gray-600 mt-0.5" style={{ fontSize: `${Math.max(8, fontSize - 2)}pt` }}>
                      {cert.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      
      case 'languages':
        if (!cvData.languages || cvData.languages.length === 0) return null;
        return (
          <section key="languages" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-1.5 uppercase">
              LANGUAGES
            </h2>
            <p style={{ fontSize: baseFontSize, lineHeight: 1.4 }}>
              {cvData.languages.map((lang, idx) => (
                <span key={idx}>
                  {lang.name}{lang.level ? ` (${lang.level})` : ''}
                  {idx < cvData.languages!.length - 1 ? ' • ' : ''}
                </span>
              ))}
            </p>
          </section>
        );
      
      case 'hobbies':
        if (!cvData.hobbies || cvData.hobbies.length === 0) return null;
        return (
          <section key="hobbies" className="mb-4">
            <h2 className="text-xs font-semibold tracking-[0.4em] text-gray-900 mb-1.5 uppercase">
              INTERESTS
            </h2>
            <p style={{ fontSize: baseFontSize, lineHeight: 1.4 }}>
              {cvData.hobbies.join(' • ')}
            </p>
          </section>
        );
      
      default:
        return null;
    }
    };
    
    return order.map(sectionId => renderSection(sectionId));
  }, [order, cvData, baseFontSize, fontSize, fontStack]);
  
  return (
    <div
      className="text-gray-900"
      style={{
        fontFamily: fontStack,
        fontSize: baseFontSize,
        lineHeight: 1.4,
      }}
    >
      {/* Header - Centered with name in uppercase (Harvard OCS standard) */}
      <div className="text-center mb-4 pb-2 border-b border-gray-300" style={{ marginBottom: '16px', paddingBottom: '8px' }}>
        <h1 
          className="font-semibold uppercase tracking-wide"
          style={{ fontSize: nameFontSize, letterSpacing: '0.05em', marginBottom: '4px' }}
        >
          {cvData.personalInfo.name}
        </h1>
        {contactLine && (
          <p className="mt-1" style={{ fontSize: `${Math.max(9, fontSize - 1)}pt`, color: '#4a5568' }}>
            {contactLine}
          </p>
        )}
      </div>

      {/* Render sections in the order specified by sectionOrder */}
      {renderedSections}
    </div>
  );
}

// Tech Minimalist Template (Google/Linear Style)
function TechMinimalistTemplate({ cvData }: { cvData: CVData }) {
  return (
    <div
      className="text-gray-900"
      style={{
        fontFamily: FONT_STACK_SANS,
        fontSize: '10.5pt',
        lineHeight: 1.6,
      }}
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{cvData.personalInfo.name}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-3">
          {[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.location]
            .filter(Boolean)
            .map((item, idx) => (
              <span key={idx}>
                {idx > 0 && <span className="mx-2 text-gray-400">•</span>}
                {item}
              </span>
            ))}
        </div>
        {cvData.personalInfo.linkedin && (
          <p className="text-sm text-gray-500 mt-1">{cvData.personalInfo.linkedin}</p>
        )}
      </header>

      {cvData.summary && (
        <section className="mb-8">
          <p className="text-base text-gray-700">{cvData.summary}</p>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gray-200"></div>
          <h2 className="text-xs font-semibold tracking-[0.35em] text-gray-500">
            EXPERIENCE
          </h2>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        {cvData.experience.map((exp, idx) => {
          const companyDisplay = exp.client ? exp.client : exp.company;
          const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
          return (
          <div key={idx} className="mb-6 border border-gray-100 rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{exp.title}</p>
                <p className="text-sm text-gray-600">{companyDisplay}{companySuffix}</p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {exp.startDate} – {exp.endDate}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {exp.bullets.map((bullet, bidx) => (
                <li key={bidx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          );
        })}
      </section>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold tracking-[0.35em] text-gray-500">
            SKILLS
          </h2>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {cvData.skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full border border-gray-200 text-xs font-semibold text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold tracking-[0.35em] text-gray-500">
              EDUCATION
            </h2>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>
          {cvData.education.map((edu, idx) => (
            <div key={idx} className="mb-4">
              <p className="font-semibold text-sm">{edu.degree}</p>
              <p className="text-sm text-gray-600">{edu.institution}</p>
              <p className="text-xs text-gray-500 mt-1">{edu.year}</p>
              {edu.details && <p className="text-xs text-gray-600 mt-1">{edu.details}</p>}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {cvData.languages && cvData.languages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold tracking-[0.35em] text-gray-500">
                  LANGUAGES
                </h2>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {cvData.languages.map((language, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700"
                  >
                    {language.name}
                    {language.level ? ` • ${language.level}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cvData.certifications && cvData.certifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold tracking-[0.35em] text-gray-500">
                  CERTIFICATIONS
                </h2>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                {cvData.certifications.map((cert, idx) => (
                  <div key={idx}>
                    <p className="font-semibold">{cert.name}</p>
                    <p className="text-xs text-gray-500">
                      {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
                    </p>
                    {cert.details && <p className="text-xs mt-1">{cert.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cvData.hobbies && cvData.hobbies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold tracking-[0.35em] text-gray-500">
                  INTERESTS
                </h2>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <p className="text-sm text-gray-700">{cvData.hobbies.join(' • ')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Notion Template (Clean Hierarchy)
function NotionTemplate({ cvData, fontFamily = 'Arial', fontSize = 10.5, sectionOrder }: { cvData: CVData; fontFamily?: FontFamily; fontSize?: number; sectionOrder?: string[] }) {
  const contactLine = buildContactLine(cvData.personalInfo);
  const fontStack = FONT_FAMILIES[fontFamily];
  
  // Default order if not provided - memoized to prevent re-renders
  const defaultOrder = useMemo(() => ['summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'hobbies'], []);
  const order = useMemo(() => sectionOrder || defaultOrder, [sectionOrder, defaultOrder]);
  
  // Render section based on sectionId - respecting sectionOrder
  const renderSection = useCallback((sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!cvData.summary) return null;
        return (
          <section key="summary" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Summary</h2>
            <p className="text-sm text-gray-700" style={{ fontSize: `${fontSize}pt`, lineHeight: 1.4 }}>{cvData.summary}</p>
          </section>
        );
      
      case 'experience':
        if (!cvData.experience || cvData.experience.length === 0) return null;
        return (
          <section key="experience" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-2.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Experience</h2>
            <div className="space-y-3">
              {cvData.experience.map((exp, idx) => {
                const companyDisplay = exp.client ? exp.client : exp.company;
                const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm" style={{ fontSize: `${fontSize}pt` }}>{exp.title}</p>
                        <p className="text-sm text-gray-600" style={{ fontSize: `${Math.max(9, fontSize - 1)}pt` }}>{companyDisplay}{companySuffix}</p>
                      </div>
                      <span className="text-xs text-gray-500" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {exp.bullets.map((bullet, bidx) => (
                        <li key={bidx} className="text-sm text-gray-700 flex gap-1.5" style={{ fontSize: `${Math.max(9, fontSize - 0.5)}pt`, lineHeight: 1.3 }}>
                          <span className="text-purple-400">▸</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      
      case 'education':
        if (!cvData.education || cvData.education.length === 0) return null;
        return (
          <section key="education" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-2" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Education</h2>
            {cvData.education.map((edu, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-sm" style={{ fontSize: `${fontSize}pt` }}>{edu.degree}</p>
                  <span className="text-xs text-gray-500" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{edu.year}</span>
                </div>
                <p className="text-sm text-gray-600" style={{ fontSize: `${Math.max(9, fontSize - 1)}pt` }}>{edu.institution}</p>
                {edu.details && <p className="text-xs text-gray-500 mt-0.5" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{edu.details}</p>}
              </div>
            ))}
          </section>
        );
      
      case 'skills':
        if (!cvData.skills || cvData.skills.length === 0) return null;
        return (
          <section key="skills" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-2" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Skills</h2>
            <SkillsChips skills={cvData.skills} />
          </section>
        );
      
      case 'certifications':
        if (!cvData.certifications || cvData.certifications.length === 0) return null;
        return (
          <section key="certifications" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-2" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Certifications</h2>
            <CertificationSection certifications={cvData.certifications} />
          </section>
        );
      
      case 'languages':
        if (!cvData.languages || cvData.languages.length === 0) return null;
        return (
          <section key="languages" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-2" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Languages</h2>
            <LanguagesChips languages={cvData.languages} />
          </section>
        );
      
      case 'hobbies':
        if (!cvData.hobbies || cvData.hobbies.length === 0) return null;
        return (
          <section key="hobbies" className="mb-4 bg-gray-50 rounded-xl p-3">
            <h2 className="text-xs font-semibold text-gray-700 mb-2" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>Interests</h2>
            <HobbiesSection hobbies={cvData.hobbies} />
          </section>
        );
      
      default:
        return null;
    }
  }, [cvData, fontSize]);
  
  // Memoize rendered sections to prevent flickering
  const renderedSections = useMemo(() => {
    return order.map(sectionId => renderSection(sectionId));
  }, [order, renderSection]);
  
  return (
    <div
      className="text-gray-900"
      style={{
        fontFamily: fontStack,
        fontSize: `${fontSize}pt`,
        lineHeight: 1.4,
      }}
    >
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h1 className="text-2xl font-semibold mb-0.5" style={{ fontSize: `${fontSize + 6}pt` }}>{cvData.personalInfo.name}</h1>
        {cvData.personalInfo.title && (
          <p className="text-sm text-gray-600" style={{ fontSize: `${Math.max(9, fontSize - 1)}pt` }}>{cvData.personalInfo.title}</p>
        )}
        {contactLine && (
          <p className="text-sm text-gray-500" style={{ fontSize: `${Math.max(9, fontSize - 1)}pt` }}>{contactLine}</p>
        )}
      </div>

      {/* Render sections in the order specified by sectionOrder */}
      {renderedSections}
    </div>
  );
}

// Apple Template (Ultra-Minimal Elegant)
function AppleTemplate({ cvData }: { cvData: CVData }) {
  const languages = cvData.languages || [];
  const certifications = cvData.certifications || [];
  const hobbies = cvData.hobbies || [];

  return (
    <div
      className="text-gray-900"
      style={{
        fontFamily: '"SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
        fontSize: '11pt',
        lineHeight: 1.7,
        letterSpacing: '-0.01em',
      }}
    >
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light tracking-tight">{cvData.personalInfo.name}</h1>
        <p className="text-sm text-gray-500 mt-3">
          {[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.location]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {cvData.summary && (
        <section className="mb-12 text-center max-w-3xl mx-auto">
          <p className="text-sm text-gray-600">{cvData.summary}</p>
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-[11px] font-semibold mb-6 uppercase tracking-[0.5em] text-gray-400">
          EXPERIENCE
        </h2>
        {cvData.experience.map((exp, idx) => (
          <div key={idx} className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <p className="font-semibold text-base">{exp.title}</p>
              <span className="text-xs text-gray-400">{exp.startDate} – {exp.endDate}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{exp.company}</p>
            <ul className="space-y-2">
              {exp.bullets.map((bullet, bidx) => (
                <li key={bidx} className="text-sm text-gray-700">{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-10 grid grid-cols-2 gap-10">
        <div>
          <h2 className="text-[11px] font-semibold mb-4 uppercase tracking-[0.5em] text-gray-400">
            SKILLS
          </h2>
          <p className="text-sm text-gray-700">{cvData.skills.join(' · ')}</p>
        </div>
        <div>
          <h2 className="text-[11px] font-semibold mb-4 uppercase tracking-[0.5em] text-gray-400">
            LANGUAGES
          </h2>
          {languages.length > 0 ? (
            <p className="text-sm text-gray-700">
              {languages.map((language, idx) => (
                <span key={idx} className="mr-3">
                  {language.name}{language.level ? ` — ${language.level}` : ''}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Add languages to showcase fluency</p>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-[11px] font-semibold mb-4 uppercase tracking-[0.5em] text-gray-400">
          EDUCATION
        </h2>
        {cvData.education.map((edu, idx) => (
          <div key={idx} className="mb-4">
            <div className="flex justify-between items-baseline">
              <p className="font-semibold text-sm">{edu.degree}</p>
              <span className="text-xs text-gray-400">{edu.year}</span>
            </div>
            <p className="text-sm text-gray-500">{edu.institution}</p>
            {edu.details && <p className="text-xs text-gray-500 mt-1">{edu.details}</p>}
          </div>
        ))}
      </section>

      {(certifications.length > 0 || hobbies.length > 0) && (
        <section className="grid grid-cols-2 gap-10">
          {certifications.length > 0 && (
            <div>
              <h2 className="text-[11px] font-semibold mb-4 uppercase tracking-[0.5em] text-gray-400">
                CERTIFICATIONS
              </h2>
              <div className="text-sm text-gray-700 space-y-2">
                {certifications.map((cert, idx) => (
                  <div key={idx}>
                    <p className="font-semibold">{cert.name}</p>
                    <p className="text-xs text-gray-500">
                      {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
                    </p>
                    {cert.details && <p className="text-xs text-gray-500">{cert.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hobbies.length > 0 && (
            <div>
              <h2 className="text-[11px] font-semibold mb-4 uppercase tracking-[0.5em] text-gray-400">
                INTERESTS
              </h2>
              <p className="text-sm text-gray-700">{hobbies.join(' · ')}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Consulting Template (McKinsey/BCG Metrics-First)
function ConsultingTemplate({ cvData, fontFamily = 'Arial', fontSize = 10, sectionOrder }: { cvData: CVData; fontFamily?: FontFamily; fontSize?: number; sectionOrder?: string[] }) {
  const fontStack = FONT_FAMILIES[fontFamily];
  
  // Default order if not provided - memoized to prevent re-renders
  const defaultOrder = useMemo(() => ['summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'hobbies'], []);
  const order = useMemo(() => sectionOrder || defaultOrder, [sectionOrder, defaultOrder]);
  
  // Render section based on sectionId - respecting sectionOrder
  const renderSection = useCallback((sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!cvData.summary) return null;
        return (
          <section key="summary" className="mb-4">
            <h2 className="text-xs font-bold mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>PROFESSIONAL PROFILE</h2>
            <p className="text-xs" style={{ fontSize: `${fontSize}pt`, lineHeight: 1.4 }}>{cvData.summary}</p>
          </section>
        );
      
      case 'experience':
        if (!cvData.experience || cvData.experience.length === 0) return null;
        return (
          <section key="experience" className="mb-4">
            <h2 className="text-xs font-bold mb-2" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>PROFESSIONAL EXPERIENCE</h2>
            {cvData.experience.map((exp, idx) => {
              const companyDisplay = exp.client ? exp.client : exp.company;
              const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
              return (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-xs" style={{ fontSize: `${fontSize}pt` }}>{companyDisplay}{companySuffix} — {exp.title}</p>
                    <span className="text-xs text-gray-600" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <ul className="space-y-1">
                    {exp.bullets.map((bullet, bidx) => (
                      <li key={bidx} className="text-xs flex gap-1.5" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt`, lineHeight: 1.3 }}>
                        <span className="font-bold text-gray-700">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        );
      
      case 'education':
        if (!cvData.education || cvData.education.length === 0) return null;
        return (
          <section key="education" className="mb-4">
            <h2 className="text-xs font-bold mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>EDUCATION</h2>
            {cvData.education.map((edu, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-xs" style={{ fontSize: `${fontSize}pt` }}>{edu.degree}</span>
                  <span className="text-xs text-gray-600" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{edu.year}</span>
                </div>
                <p className="text-xs" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt` }}>{edu.institution}</p>
                {edu.details && <p className="text-xs text-gray-500" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>{edu.details}</p>}
              </div>
            ))}
          </section>
        );
      
      case 'skills':
        if (!cvData.skills || cvData.skills.length === 0) return null;
        return (
          <section key="skills" className="mb-4">
            <h2 className="text-xs font-bold mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>KEY SKILLS & COMPETENCIES</h2>
            <p className="text-xs" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt`, lineHeight: 1.3 }}>{cvData.skills.join(' • ')}</p>
          </section>
        );
      
      case 'certifications':
        if (!cvData.certifications || cvData.certifications.length === 0) return null;
        return (
          <section key="certifications" className="mb-4">
            <h2 className="text-xs font-bold mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>CERTIFICATIONS</h2>
            <div className="text-xs space-y-1" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt` }}>
              {cvData.certifications.map((cert, idx) => (
                <div key={idx}>
                  <p className="font-semibold">{cert.name}</p>
                  <p className="text-gray-500">
                    {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
                  </p>
                  {cert.details && <p className="text-gray-500">{cert.details}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      
      case 'languages':
        if (!cvData.languages || cvData.languages.length === 0) return null;
        return (
          <section key="languages" className="mb-4">
            <h2 className="text-xs font-bold mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>LANGUAGES</h2>
            <ul className="text-xs space-y-0.5" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt` }}>
              {cvData.languages.map((language, idx) => (
                <li key={idx}>
                  {language.name}
                  {language.level ? ` — ${language.level}` : ''}
                </li>
              ))}
            </ul>
          </section>
        );
      
      case 'hobbies':
        if (!cvData.hobbies || cvData.hobbies.length === 0) return null;
        return (
          <section key="hobbies" className="mb-4">
            <h2 className="text-xs font-bold mb-1.5" style={{ fontSize: `${Math.max(9, fontSize)}pt` }}>INTERESTS</h2>
            <p className="text-xs" style={{ fontSize: `${Math.max(8, fontSize - 0.5)}pt` }}>{cvData.hobbies.join(' • ')}</p>
          </section>
        );
      
      default:
        return null;
    }
  }, [cvData, fontSize]);
  
  // Memoize rendered sections to prevent flickering
  const renderedSections = useMemo(() => {
    return order.map(sectionId => renderSection(sectionId));
  }, [order, renderSection]);

  return (
    <div
      className="text-gray-900"
      style={{ 
        fontFamily: fontStack, 
        fontSize: `${fontSize}pt`, 
        lineHeight: 1.4,
      }}
    >
      {/* Header */}
      <div className="mb-4 pb-2 border-b-2 border-gray-900">
        <h1 className="text-xl font-bold" style={{ fontSize: `${fontSize + 4}pt` }}>{cvData.personalInfo.name}</h1>
        <p className="text-xs mt-0.5" style={{ fontSize: `${Math.max(8, fontSize - 1)}pt` }}>
          {[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.location]
            .filter(Boolean)
            .join(' | ')}
        </p>
      </div>

      {/* Render sections in the order specified by sectionOrder */}
      {renderedSections}
    </div>
  );
}

// Notion Template is already defined above, so let's use it

// ATS Boost Template (Keyword-Optimized)
function ATSBoostTemplate({ cvData }: { cvData: CVData }) {
  const certifications = cvData.certifications || [];
  const languages = cvData.languages || [];
  const hobbies = cvData.hobbies || [];
  const spotlightSkills = cvData.skills.slice(0, 8);

  return (
    <div
      className="text-gray-900"
      style={{ fontFamily: FONT_STACK_SANS, fontSize: '10.5pt', lineHeight: 1.5 }}
    >
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{cvData.personalInfo.name}</h1>
        <p className="text-sm text-gray-600 mt-2">
          {[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.location]
            .filter(Boolean)
            .join(' | ')}
        </p>
        {cvData.personalInfo.linkedin && (
          <p className="text-sm text-gray-500">{cvData.personalInfo.linkedin}</p>
        )}
      </div>

      {cvData.summary && (
        <section className="mb-5">
          <h2 className="text-base font-bold mb-2">PROFESSIONAL SUMMARY</h2>
          <p className="text-sm">{cvData.summary}</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold tracking-[0.3em] text-gray-500 mb-2">
            CORE COMPETENCIES
          </h3>
          <p className="text-sm leading-relaxed">{cvData.skills.join(' | ')}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
          <h3 className="text-xs font-semibold tracking-[0.3em] text-gray-500 mb-2">
            ATS HIGHLIGHTS
          </h3>
          <div className="flex flex-wrap gap-2">
            {spotlightSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-purple-50 text-[11px] font-semibold text-purple-700 border border-purple-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold mb-3">PROFESSIONAL EXPERIENCE</h2>
        {cvData.experience.map((exp, idx) => {
          const companyDisplay = exp.client ? exp.client : exp.company;
          const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
          return (
          <div key={idx} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-sm">{exp.title}</h3>
              <span className="text-xs text-gray-500">{exp.startDate} – {exp.endDate}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{companyDisplay}{companySuffix}</p>
            <ul className="space-y-1.5">
              {exp.bullets.map((bullet, bidx) => (
                <li key={bidx} className="text-sm flex gap-2">
                  <span className="text-purple-500">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          );
        })}
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold mb-2">EDUCATION</h2>
        {cvData.education.map((edu, idx) => (
          <div key={idx} className="mb-3">
            <div className="flex justify-between items-baseline">
              <p className="font-semibold text-sm">{edu.degree}</p>
              <span className="text-xs text-gray-500">{edu.year}</span>
            </div>
            <p className="text-sm text-gray-600">{edu.institution}</p>
            {edu.details && <p className="text-xs text-gray-500">{edu.details}</p>}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold tracking-[0.3em] text-gray-500 mb-2">
            LANGUAGES
          </h3>
          {languages.length > 0 ? (
            <ul className="text-xs space-y-1">
              {languages.map((language, idx) => (
                <li key={idx}>
                  {language.name}
                  {language.level ? ` • ${language.level}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">Add languages</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold tracking-[0.3em] text-gray-500 mb-2">
            CERTIFICATIONS
          </h3>
          {certifications.length > 0 ? (
            <div className="text-xs space-y-2">
              {certifications.map((cert, idx) => (
                <div key={idx}>
                  <p className="font-semibold">{cert.name}</p>
                  <p className="text-gray-500">
                    {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
                  </p>
                  {cert.details && <p className="text-gray-500">{cert.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Highlight credentials</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold tracking-[0.3em] text-gray-500 mb-2">
            INTERESTS
          </h3>
          {hobbies.length > 0 ? (
            <p className="text-xs">{hobbies.join(' • ')}</p>
          ) : (
            <p className="text-xs text-gray-400">Optional personal touch</p>
          )}
        </div>
      </section>
    </div>
  );
}

