import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { getEnabledSections, sortSections } from '../../../lib/cvEditorUtils';
import { formatCVDate, formatDateRange as formatDateRangeUtil } from '../../../lib/dateFormatters';

interface ModernProfessionalPDFProps {
    data: CVData;
    settings?: CVLayoutSettings;
}

// Color map for accent colors
const COLOR_HEX_MAP: Record<string, string> = {
    slate: '#64748b',
    gray: '#6b7280',
    zinc: '#71717a',
    neutral: '#737373',
    stone: '#78716c',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
};

const ModernProfessionalPDF: React.FC<ModernProfessionalPDFProps> = ({ data, settings }) => {
    const { personalInfo, summary, experiences, education, skills, languages, projects, certifications, sections } = data;
    const enabledSections = getEnabledSections(sortSections(sections));

    // Settings
    const baseFontSize = settings?.fontSize || 10;
    const lineHeight = settings?.lineHeight || 1.4;
    const fontFamily = settings?.fontFamily || 'Helvetica';
    const accentColor = settings?.accentColor ? COLOR_HEX_MAP[settings.accentColor] : '#3b82f6';

    const experienceSpacing = settings?.experienceSpacing ?? 6;
    const expItemGap = experienceSpacing * 2;

    const formatDate = (date: string) => formatCVDate(date, settings?.dateFormat as any);
    const formatDateRange = (start: string, end: string, isCurrent: boolean) =>
        formatDateRangeUtil(start, end, isCurrent, settings?.dateFormat as any);

    // Styles - All values in POINTS
    const styles = StyleSheet.create({
        page: {
            fontFamily: fontFamily,
            fontSize: baseFontSize,
            lineHeight: lineHeight,
            padding: 40,
            color: '#111827',
            backgroundColor: '#FFFFFF',
        },

        header: {
            marginBottom: 18,
        },

        name: {
            fontSize: baseFontSize * 2.2,
            fontWeight: 700,
            marginBottom: 2,
            lineHeight: 1.2,
            color: '#111827',
        },

        title: {
            fontSize: baseFontSize * 1.2,
            color: '#374151',
            marginBottom: 8,
            marginTop: 2,
            lineHeight: 1.3,
        },

        // Contact row - simple text approach like HarvardClassic
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 4,
        },

        contactText: {
            fontSize: baseFontSize * 0.85,
            color: '#4B5563',
        },

        separator: {
            marginHorizontal: 4,
            color: accentColor,
        },

        section: {
            marginBottom: 16,
        },

        sectionTitle: {
            fontSize: baseFontSize,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
            paddingBottom: 3,
            color: '#374151',
            borderBottomWidth: 2,
            borderBottomColor: accentColor,
        },

        itemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 3,
        },

        itemTitle: {
            fontWeight: 700,
            fontSize: baseFontSize,
            color: '#111827',
        },

        itemSubtitle: {
            fontSize: baseFontSize * 0.95,
            color: '#374151',
            marginTop: 1,
        },

        dateText: {
            fontSize: baseFontSize * 0.85,
            color: '#4B5563',
            textAlign: 'right',
        },

        description: {
            fontSize: baseFontSize * 0.95,
            color: '#374151',
            marginBottom: 4,
            lineHeight: 1.4,
        },

        bulletRow: {
            flexDirection: 'row',
            marginBottom: 2,
        },
        bullet: {
            width: 10,
            fontSize: baseFontSize * 0.95,
            color: '#374151',
        },
        bulletText: {
            flex: 1,
            fontSize: baseFontSize * 0.95,
            color: '#374151',
            lineHeight: 1.4,
        },

        // Skills - inline text like HarvardClassic (more reliable for page breaks)
        skillsText: {
            fontSize: baseFontSize * 0.95,
            color: '#374151',
            lineHeight: 1.5,
        },

        langRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        langItem: {
            fontSize: baseFontSize * 0.95,
            color: '#374151',
        },
    });

    // Render sections
    const renderSection = (type: string) => {
        switch (type) {
            case 'summary':
                return summary && typeof summary === 'string' && summary.trim() ? (
                    <View style={styles.section} key="summary">
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={30}>Professional Summary</Text>
                        <Text style={styles.description}>{summary}</Text>
                    </View>
                ) : null;

            case 'experience':
                return experiences.length > 0 ? (
                    <View style={styles.section} key="experience">
                        {/* Section title with minPresenceAhead to prevent orphan headers */}
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={50}>Work Experience</Text>
                        {experiences.map((exp, idx) => {
                            // Filter and validate bullets
                            const validBullets = (exp.bullets || []).filter(
                                (b): b is string => typeof b === 'string' && b.trim().length > 0
                            );

                            return (
                                // Experience container - ALLOW wrapping across pages
                                <View key={exp.id} style={{ marginBottom: idx === experiences.length - 1 ? 0 : expItemGap }}>
                                    {/* Header row ONLY - keep together */}
                                    <View style={styles.itemHeader} wrap={false}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemTitle}>{exp.title || ''}</Text>
                                            <Text style={styles.itemSubtitle}>
                                                {exp.company || ''}{exp.location ? ` • ${exp.location}` : ''}
                                            </Text>
                                        </View>
                                        <Text style={styles.dateText}>
                                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                        </Text>
                                    </View>
                                    {/* Description - flows naturally */}
                                    {exp.description && typeof exp.description === 'string' && exp.description.trim() && (
                                        <Text style={styles.description}>{exp.description}</Text>
                                    )}
                                    {/* All bullets - flow naturally across pages */}
                                    {validBullets.map((bullet, bulletIdx) => (
                                        <View key={bulletIdx} style={styles.bulletRow}>
                                            <Text style={styles.bullet}>•</Text>
                                            <Text style={styles.bulletText}>{bullet}</Text>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </View>
                ) : null;

            case 'education':
                return education.length > 0 ? (
                    <View style={styles.section} key="education">
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={50}>Education</Text>
                        {education.map((edu, idx) => (
                            <View key={edu.id} style={{ marginBottom: idx === education.length - 1 ? 0 : 8 }}>
                                {/* Header - keep together */}
                                <View style={styles.itemHeader} wrap={false}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemTitle}>
                                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                        </Text>
                                        <Text style={styles.itemSubtitle}>
                                            {edu.institution}{edu.location ? ` • ${edu.location}` : ''}
                                        </Text>
                                        {edu.gpa && (
                                            <Text style={{ fontSize: baseFontSize * 0.85, color: '#4B5563', marginTop: 1 }}>
                                                GPA: {edu.gpa}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.dateText}>{formatDate(edu.endDate)}</Text>
                                </View>
                                {edu.honors && edu.honors.length > 0 && (
                                    <Text style={{ fontSize: baseFontSize * 0.85, color: '#4B5563', marginTop: 2 }}>
                                        Honors: {edu.honors.join(', ')}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                ) : null;

            case 'skills':
                // Skills as inline text - handles page breaks properly
                const shouldShowLevel = settings?.showSkillLevel !== false;
                const levelLabels: Record<string, string> = {
                    'beginner': 'Beginner',
                    'intermediate': 'Intermediate',
                    'advanced': 'Advanced',
                    'expert': 'Expert'
                };
                return skills.length > 0 ? (
                    <View style={styles.section} key="skills">
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={30}>Skills</Text>
                        <Text style={styles.skillsText}>
                            {skills.map((skill, index) => {
                                const level = skill.level || 'intermediate';
                                const levelText = shouldShowLevel ? ` (${levelLabels[level] || level})` : '';
                                return (
                                    <Text key={skill.id}>
                                        {skill.name}{levelText}
                                        {index < skills.length - 1 ? ' • ' : ''}
                                    </Text>
                                );
                            })}
                        </Text>
                    </View>
                ) : null;

            case 'certifications':
                return certifications.length > 0 ? (
                    <View style={styles.section} key="certifications">
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={30}>Certifications</Text>
                        {certifications.map((cert, idx) => (
                            <View key={cert.id} style={{ marginBottom: idx === certifications.length - 1 ? 0 : 6 }} wrap={false}>
                                <Text style={styles.itemTitle}>{cert.name}</Text>
                                <Text style={{ fontSize: baseFontSize * 0.9, color: '#4B5563' }}>
                                    {cert.issuer} • {formatDate(cert.date)}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null;

            case 'projects':
                return projects.length > 0 ? (
                    <View style={styles.section} key="projects">
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={50}>Projects</Text>
                        {projects.map((project, idx) => (
                            // Project container - allow wrapping
                            <View key={project.id} style={{ marginBottom: idx === projects.length - 1 ? 0 : 10 }}>
                                {/* Header - keep together */}
                                <View style={styles.itemHeader} wrap={false}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.itemTitle}>{project.name}</Text>
                                        {project.url && (
                                            <Text style={{ fontSize: baseFontSize * 0.85, color: accentColor }}>
                                                {project.url.replace(/^https?:\/\//, '')}
                                            </Text>
                                        )}
                                    </View>
                                    {project.startDate && (
                                        <Text style={styles.dateText}>
                                            {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.description}>{project.description}</Text>
                                {project.technologies.length > 0 && (
                                    <Text style={{ fontSize: baseFontSize * 0.85, color: '#4B5563' }}>
                                        Technologies: {project.technologies.join(', ')}
                                    </Text>
                                )}
                                {project.highlights.map((highlight, i) => (
                                    <View key={i} style={styles.bulletRow}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{highlight}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                ) : null;

            case 'languages':
                return languages.length > 0 ? (
                    <View style={styles.section} key="languages">
                        <Text style={styles.sectionTitle} wrap={false} minPresenceAhead={30}>Languages</Text>
                        <Text style={styles.skillsText}>
                            {languages.map((lang, index) => (
                                <Text key={lang.id}>
                                    <Text style={{ fontWeight: 700 }}>{lang.name}</Text>
                                    {lang.proficiency ? ` - ${lang.proficiency}` : ''}
                                    {index < languages.length - 1 ? ' • ' : ''}
                                </Text>
                            ))}
                        </Text>
                    </View>
                ) : null;

            default:
                return null;
        }
    };

    // Build contact items array
    const contactItems: string[] = [];
    if (personalInfo.email) contactItems.push(personalInfo.email);
    if (personalInfo.phone) contactItems.push(personalInfo.phone);
    if (personalInfo.location) contactItems.push(personalInfo.location);

    const linkItems: string[] = [];
    if (personalInfo.linkedin) linkItems.push(personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, ''));
    if (personalInfo.github) linkItems.push(personalInfo.github.replace(/^https?:\/\/(www\.)?/, ''));
    if (personalInfo.portfolio) linkItems.push(personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ''));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>
                        {personalInfo.firstName} {personalInfo.lastName}
                    </Text>

                    {personalInfo.title && (
                        <Text style={styles.title}>{personalInfo.title}</Text>
                    )}

                    {/* Contact Row - Email, Phone, Location */}
                    {contactItems.length > 0 && (
                        <View style={styles.contactRow}>
                            {contactItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    <Text style={styles.contactText}>{item}</Text>
                                    {index < contactItems.length - 1 && (
                                        <Text style={[styles.contactText, styles.separator]}>|</Text>
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    )}

                    {/* Links Row - LinkedIn, GitHub, Portfolio */}
                    {linkItems.length > 0 && (
                        <View style={styles.contactRow}>
                            {linkItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    <Text style={[styles.contactText, { color: accentColor }]}>{item}</Text>
                                    {index < linkItems.length - 1 && (
                                        <Text style={[styles.contactText, styles.separator]}>|</Text>
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    )}
                </View>

                {/* Sections */}
                {enabledSections.map(section => renderSection(section.type))}
            </Page>
        </Document>
    );
};

export default ModernProfessionalPDF;
