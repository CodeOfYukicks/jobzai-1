import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { formatDate, formatDateRange, getEnabledSections, sortSections } from '../../../lib/cvEditorUtils';

// Register fonts - Commented out to avoid loading errors for now
// Font.register({
//     family: 'Inter',
//     fonts: [
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf' }, // Regular
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf', fontWeight: 600 }, // SemiBold
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.ttf', fontWeight: 700 }, // Bold
//     ]
// });

interface ModernProfessionalPDFProps {
    data: CVData;
    settings?: CVLayoutSettings;
}

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica', // Use standard font
        fontSize: 10,
        lineHeight: 1.5,
        color: '#111827', // gray-900
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB', // gray-200
        paddingBottom: 24,
    },
    name: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 14,
        color: '#4B5563', // gray-600
        marginBottom: 12,
        fontWeight: 500,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 9,
        color: '#6B7280', // gray-500
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        color: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: '#111827', // Black underline for section headers
        paddingBottom: 4,
    },
    experienceItem: {
        marginBottom: 12,
    },
    experienceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    companyName: {
        fontWeight: 700,
        fontSize: 10,
    },
    jobTitle: {
        fontWeight: 600,
        fontSize: 10,
        color: '#374151', // gray-700
    },
    dateLocation: {
        fontSize: 9,
        color: '#6B7280', // gray-500
        textAlign: 'right',
    },
    description: {
        marginBottom: 4,
        fontSize: 10,
        color: '#374151',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 2,
        paddingLeft: 8,
    },
    bullet: {
        width: 10,
        fontSize: 10,
        color: '#374151',
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillItem: {
        backgroundColor: '#F3F4F6', // gray-100
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 9,
        color: '#374151',
    },
    educationItem: {
        marginBottom: 8,
    },
});

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

    // Default settings
    const fontSize = settings?.fontSize || 10;
    const lineHeight = settings?.lineHeight || 1.5;
    const fontFamily = settings?.fontFamily || 'Helvetica';
    const accentColor = settings?.accentColor ? COLOR_HEX_MAP[settings.accentColor] : '#3b82f6';

    // Spacing
    const spacingValue = settings?.experienceSpacing ?? 6;
    const itemSpacing = spacingValue; // Reduced from * 2 to * 1 for compactness

    const dynamicStyles = StyleSheet.create({
        page: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            lineHeight: 1.3,
            padding: 24, // Reduced padding
            color: '#111827',
        },
        sectionTitle: {
            fontSize: fontSize + 1,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
            color: '#374151',
            borderBottomWidth: 2,
            borderBottomColor: accentColor,
            paddingBottom: 4,
        },
        name: {
            fontSize: fontSize * 2.4,
            fontWeight: 700,
            marginBottom: 8, // Increased to prevent overlap
            lineHeight: 1.2,
            color: '#111827',
        },
        title: {
            fontSize: fontSize * 1.25,
            color: '#4B5563',
            marginBottom: 8,
        },
        header: {
            marginBottom: 16,
            // Removed border and padding to match preview
        },
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8, // Reduced gap
            marginTop: 4,
            fontSize: fontSize * 0.85, // Smaller font for contact info
            color: '#6B7280',
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        link: {
            color: accentColor,
            textDecoration: 'none',
        },
        experienceItem: {
            marginBottom: itemSpacing,
        },
        // Role/Degree - Bold
        itemTitle: {
            fontWeight: 700,
            fontSize: fontSize,
            color: '#111827',
        },
        // Company/Institution - Regular/Medium
        itemSubtitle: {
            fontSize: fontSize,
            color: '#374151',
        },
        dateLocation: {
            fontSize: fontSize * 0.9,
            color: '#6B7280',
            textAlign: 'right',
        },
        description: {
            marginBottom: 2, // Reduced margin
            fontSize: fontSize,
            color: '#374151',
            textAlign: 'justify',
        },
        bulletPoint: {
            flexDirection: 'row',
            marginBottom: 1, // Reduced margin
            paddingLeft: 8,
        },
        bullet: {
            width: 10,
            fontSize: fontSize,
            color: '#374151',
        },
        bulletText: {
            flex: 1,
            fontSize: fontSize,
            color: '#374151',
            textAlign: 'justify',
        },
        section: {
            marginBottom: 12,
        },
        experienceHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 2,
        },
        skillItem: {
            backgroundColor: '#F3F4F6',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 50,
            fontSize: fontSize * 0.9,
            color: '#374151',
            flexDirection: 'row',
            alignItems: 'center',
        },
        skillLevel: {
            fontSize: fontSize * 0.75,
            color: '#635BFF',
            backgroundColor: 'rgba(99, 91, 255, 0.1)',
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 4,
            marginLeft: 6,
        }
    });

    const renderSection = (type: string) => {
        switch (type) {
            case 'summary':
                return summary && (
                    <View style={dynamicStyles.section} key="summary">
                        <Text style={dynamicStyles.sectionTitle}>Professional Summary</Text>
                        <Text style={dynamicStyles.description}>{summary}</Text>
                    </View>
                );
            case 'experience':
                return experiences.length > 0 && (
                    <View style={dynamicStyles.section} key="experience">
                        <Text style={dynamicStyles.sectionTitle}>Work Experience</Text>
                        {experiences.map((exp) => (
                            <View key={exp.id} style={dynamicStyles.experienceItem}>
                                <View style={dynamicStyles.experienceHeader}>
                                    <View>
                                        <Text style={dynamicStyles.itemTitle}>{exp.title}</Text>
                                        <Text style={dynamicStyles.itemSubtitle}>
                                            {exp.company}
                                            {exp.location && ` • ${exp.location}`}
                                        </Text>
                                    </View>
                                    <Text style={dynamicStyles.dateLocation}>
                                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                    </Text>
                                </View>
                                {exp.description && <Text style={dynamicStyles.description}>{exp.description}</Text>}
                                {exp.bullets.map((bullet, index) => (
                                    <View key={index} style={dynamicStyles.bulletPoint}>
                                        <Text style={dynamicStyles.bullet}>•</Text>
                                        <Text style={dynamicStyles.bulletText}>{bullet}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                );
            case 'education':
                return education.length > 0 && (
                    <View style={dynamicStyles.section} key="education">
                        <Text style={dynamicStyles.sectionTitle}>Education</Text>
                        {education.map((edu) => (
                            <View key={edu.id} style={dynamicStyles.experienceItem}>
                                <View style={dynamicStyles.experienceHeader}>
                                    <View>
                                        <Text style={dynamicStyles.itemTitle}>
                                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                        </Text>
                                        <Text style={dynamicStyles.itemSubtitle}>
                                            {edu.institution}
                                            {edu.location && ` • ${edu.location}`}
                                        </Text>
                                        {edu.gpa && <Text style={{ ...dynamicStyles.dateLocation, textAlign: 'left' }}>GPA: {edu.gpa}</Text>}
                                    </View>
                                    <Text style={dynamicStyles.dateLocation}>
                                        {formatDate(edu.endDate)}
                                    </Text>
                                </View>
                                {edu.honors && edu.honors.length > 0 && (
                                    <Text style={{ ...dynamicStyles.description, fontStyle: 'italic' }}>
                                        Honors: {edu.honors.join(', ')}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                );
            case 'skills':
                return skills.length > 0 && (
                    <View style={dynamicStyles.section} key="skills">
                        <Text style={dynamicStyles.sectionTitle}>Skills</Text>
                        <View style={styles.skillsContainer}>
                            {skills.map((skill) => {
                                const shouldShowLevel = settings?.showSkillLevel !== false;
                                const levelLabels: Record<string, string> = {
                                    'beginner': 'Beginner',
                                    'intermediate': 'Intermediate',
                                    'advanced': 'Advanced',
                                    'expert': 'Expert'
                                };
                                return (
                                    <View key={skill.id} style={dynamicStyles.skillItem}>
                                        <Text>{skill.name}</Text>
                                        {shouldShowLevel && skill.level && (
                                            <Text style={dynamicStyles.skillLevel}>
                                                {levelLabels[skill.level] || skill.level}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            case 'projects':
                return projects.length > 0 && (
                    <View style={dynamicStyles.section} key="projects">
                        <Text style={dynamicStyles.sectionTitle}>Projects</Text>
                        {projects.map((project) => (
                            <View key={project.id} style={dynamicStyles.experienceItem}>
                                <View style={dynamicStyles.experienceHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={dynamicStyles.itemTitle}>{project.name}</Text>
                                        {project.url && (
                                            <Text style={{ ...dynamicStyles.link, fontSize: fontSize * 0.9 }}>
                                                {project.url.replace(/^https?:\/\//, '')}
                                            </Text>
                                        )}
                                    </View>
                                    {project.startDate && (
                                        <Text style={dynamicStyles.dateLocation}>
                                            {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                        </Text>
                                    )}
                                </View>
                                <Text style={dynamicStyles.description}>{project.description}</Text>
                                {project.technologies.length > 0 && (
                                    <Text style={{ ...dynamicStyles.description, color: '#6B7280', fontSize: fontSize * 0.9 }}>
                                        Technologies: {project.technologies.join(', ')}
                                    </Text>
                                )}
                                {project.highlights.map((highlight, index) => (
                                    <View key={index} style={dynamicStyles.bulletPoint}>
                                        <Text style={dynamicStyles.bullet}>•</Text>
                                        <Text style={dynamicStyles.bulletText}>{highlight}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                );
            case 'certifications':
                return certifications.length > 0 && (
                    <View style={dynamicStyles.section} key="certifications">
                        <Text style={dynamicStyles.sectionTitle}>Certifications</Text>
                        {certifications.map((cert) => (
                            <View key={cert.id} style={{ marginBottom: 8 }}>
                                <Text style={dynamicStyles.itemTitle}>{cert.name}</Text>
                                <Text style={{ ...dynamicStyles.dateLocation, textAlign: 'left' }}>
                                    {cert.issuer} • {formatDate(cert.date)}
                                </Text>
                            </View>
                        ))}
                    </View>
                );
            case 'languages':
                return languages.length > 0 && (
                    <View style={dynamicStyles.section} key="languages">
                        <Text style={dynamicStyles.sectionTitle}>Languages</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {languages.map((lang) => (
                                <Text key={lang.id} style={{ fontSize: fontSize * 0.95, color: '#374151' }}>
                                    <Text style={{ fontWeight: 700, color: '#111827' }}>{lang.name}</Text>
                                    {lang.proficiency ? ` - ${lang.proficiency}` : ''}
                                </Text>
                            ))}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <Document>
            <Page size="A4" style={dynamicStyles.page}>
                {/* Header */}
                <View style={dynamicStyles.header}>
                    <Text style={dynamicStyles.name}>{personalInfo.firstName} {personalInfo.lastName}</Text>
                    {personalInfo.title && <Text style={dynamicStyles.title}>{personalInfo.title}</Text>}

                    <View style={dynamicStyles.contactRow}>
                        {personalInfo.email && (
                            <View style={dynamicStyles.contactItem}>
                                <Text style={{ color: accentColor, marginRight: 4 }}>✉</Text>
                                <Text>{personalInfo.email}</Text>
                            </View>
                        )}
                        {personalInfo.phone && (
                            <View style={dynamicStyles.contactItem}>
                                <Text style={{ color: accentColor, marginRight: 4 }}>📞</Text>
                                <Text>{personalInfo.phone}</Text>
                            </View>
                        )}
                        {personalInfo.location && (
                            <View style={dynamicStyles.contactItem}>
                                <Text style={{ color: accentColor, marginRight: 4 }}>📍</Text>
                                <Text>{personalInfo.location}</Text>
                            </View>
                        )}
                        {personalInfo.linkedin && (
                            <View style={dynamicStyles.contactItem}>
                                <Text style={{ color: accentColor, marginRight: 4 }}>in</Text>
                                <Text>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</Text>
                            </View>
                        )}
                        {personalInfo.github && (
                            <View style={dynamicStyles.contactItem}>
                                <Text style={{ color: accentColor, marginRight: 4 }}>gh</Text>
                                <Text>{personalInfo.github.replace(/^https?:\/\//, '')}</Text>
                            </View>
                        )}
                        {personalInfo.portfolio && (
                            <View style={dynamicStyles.contactItem}>
                                <Text style={{ color: accentColor, marginRight: 4 }}>🌐</Text>
                                <Text>{personalInfo.portfolio.replace(/^https?:\/\//, '')}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Sections */}
                {enabledSections.map(section => renderSection(section.type))}
            </Page>
        </Document>
    );
};

export default ModernProfessionalPDF;
