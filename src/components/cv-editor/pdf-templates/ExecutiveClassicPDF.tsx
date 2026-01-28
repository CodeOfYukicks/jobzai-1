import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { formatDate, formatDateRange, sortSections, getEnabledSections } from '../../../lib/cvEditorUtils';

interface ExecutiveClassicPDFProps {
    data: CVData;
    settings?: CVLayoutSettings;
}

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Times-Roman',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#111827',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937', // gray-800
        paddingBottom: 16,
        alignItems: 'center',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        color: '#4B5563', // gray-600
        marginBottom: 4,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    linksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        color: '#4B5563', // gray-600
        marginTop: 2,
    },
    mainContainer: {
        flexDirection: 'row',
        gap: 24,
    },
    leftColumn: {
        width: '70%',
    },
    rightColumn: {
        width: '28%', // Slightly less than 30 to account for gap
    },
    section: {
        marginBottom: 16,
    },
    experienceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    companyName: {
        fontStyle: 'italic',
        color: '#374151',
    },
    jobTitle: {
        fontWeight: 'bold',
        color: '#111827',
    },
    dateLocation: {
        color: '#4B5563',
        fontStyle: 'italic',
    },
    description: {
        marginBottom: 4,
        color: '#374151',
        textAlign: 'justify',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 2,
        paddingLeft: 8,
    },
    bullet: {
        width: 10,
        color: '#374151',
    },
    bulletText: {
        flex: 1,
        color: '#374151',
        textAlign: 'justify',
    },
    educationItem: {
        marginBottom: 12,
    },
    skillItem: {
        marginBottom: 2,
        color: '#374151',
    },
    skillLevel: {
        fontStyle: 'italic',
        color: '#6B7280',
    },
});

const ExecutiveClassicPDF: React.FC<ExecutiveClassicPDFProps> = ({ data, settings }) => {
    const { personalInfo, summary, experiences, education, skills, languages, projects, certifications, sections } = data;
    const enabledSections = getEnabledSections(sortSections(sections));

    // Default settings if not provided
    const fontSize = settings?.fontSize || 10;
    const lineHeight = settings?.lineHeight || 1.4;
    const fontFamily = settings?.fontFamily || 'Times-Roman';

    // Match Preview logic: (value * 4)px. 
    // Converting to points: 1px approx 0.75pt. 
    // So (value * 4) * 0.75 = value * 3.
    const spacingValue = settings?.experienceSpacing ?? 6;
    const spacing = spacingValue * 3;

    const dynamicStyles = StyleSheet.create({
        page: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            lineHeight: lineHeight,
            padding: 30,
        },
        experienceItem: {
            marginBottom: spacing,
        },
        sectionTitle: {
            fontSize: fontSize, // 1em
            letterSpacing: 1,
            marginBottom: 8,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: '#1F2937',
        },
        name: {
            fontSize: fontSize * 2.25, // 2.25em
            fontWeight: 'bold',
            marginBottom: 16, // Increased to 16 to fix title spacing
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
        },
        title: {
            fontSize: fontSize * 1.25, // 1.25em
            color: '#374151',
            marginBottom: 12,
            fontStyle: 'italic',
            textAlign: 'center',
        },
        // Font size helpers matching Preview em values
        text09: { fontSize: fontSize * 0.9 },
        text095: { fontSize: fontSize * 0.95 },
        text10: { fontSize: fontSize },
    });

    const LEFT_COLUMN_TYPES = ['summary', 'experience', 'projects'];
    const RIGHT_COLUMN_TYPES = ['education', 'skills', 'certifications', 'languages'];

    const leftSections = enabledSections.filter(s => LEFT_COLUMN_TYPES.includes(s.type));
    const rightSections = enabledSections.filter(s => RIGHT_COLUMN_TYPES.includes(s.type));

    const renderSection = (type: string) => {
        switch (type) {
            case 'summary':
                return summary && (
                    <View style={styles.section} key="summary">
                        <Text style={dynamicStyles.sectionTitle}>Executive Summary</Text>
                        <Text style={{ ...dynamicStyles.text10, color: '#374151', textAlign: 'justify', lineHeight: lineHeight }}>{summary}</Text>
                    </View>
                );
            case 'experience':
                return experiences.length > 0 && (
                    <View style={styles.section} key="experience">
                        <Text style={dynamicStyles.sectionTitle}>Professional Experience</Text>
                        {experiences.map((exp) => (
                            <View key={exp.id} style={dynamicStyles.experienceItem}>
                                <View style={{ marginBottom: 4 }}>
                                    <View style={styles.experienceHeader}>
                                        <Text style={{ ...styles.jobTitle, ...dynamicStyles.text10 }}>{exp.title}</Text>
                                        <Text style={{ ...styles.dateLocation, ...dynamicStyles.text09 }}>
                                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                        </Text>
                                    </View>
                                    <Text style={{ ...styles.companyName, ...dynamicStyles.text095 }}>
                                        {exp.company}
                                        {exp.location && ` — ${exp.location}`}
                                    </Text>
                                </View>
                                {exp.description && <Text style={{ ...styles.description, ...dynamicStyles.text095 }}>{exp.description}</Text>}
                                {exp.bullets.map((bullet, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={{ ...styles.bullet, ...dynamicStyles.text095 }}>•</Text>
                                        <Text style={{ ...styles.bulletText, ...dynamicStyles.text095 }}>{bullet}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                );
            case 'projects':
                return projects.length > 0 && (
                    <View style={styles.section} key="projects">
                        <Text style={dynamicStyles.sectionTitle}>Key Projects</Text>
                        {projects.map((project) => (
                            <View key={project.id} style={dynamicStyles.experienceItem}>
                                <View style={styles.experienceHeader}>
                                    <Text style={{ ...styles.jobTitle, ...dynamicStyles.text10 }}>{project.name}</Text>
                                    {project.startDate && (
                                        <Text style={{ ...styles.dateLocation, ...dynamicStyles.text09 }}>
                                            {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                        </Text>
                                    )}
                                </View>
                                <Text style={{ ...styles.description, ...dynamicStyles.text095 }}>{project.description}</Text>
                                {project.highlights.map((highlight, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={{ ...styles.bullet, ...dynamicStyles.text095 }}>•</Text>
                                        <Text style={{ ...styles.bulletText, ...dynamicStyles.text095 }}>{highlight}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                );
            case 'education':
                return education.length > 0 && (
                    <View style={styles.section} key="education">
                        <Text style={dynamicStyles.sectionTitle}>Education</Text>
                        {education.map((edu) => (
                            <View key={edu.id} style={styles.educationItem}>
                                <Text style={{ fontWeight: 'bold', ...dynamicStyles.text10, color: '#111827' }}>{edu.degree}</Text>
                                {edu.field && <Text style={{ ...dynamicStyles.text095, fontStyle: 'italic', color: '#374151' }}>{edu.field}</Text>}
                                <Text style={{ ...dynamicStyles.text095, color: '#374151' }}>{edu.institution}</Text>
                                <Text style={{ ...dynamicStyles.text09, fontStyle: 'italic', color: '#4B5563' }}>{formatDate(edu.endDate)}</Text>
                                {edu.gpa && <Text style={{ ...dynamicStyles.text09, color: '#4B5563' }}>GPA: {edu.gpa}</Text>}
                                {edu.honors && edu.honors.length > 0 && (
                                    <Text style={{ ...dynamicStyles.text09, fontStyle: 'italic', color: '#4B5563', marginTop: 2 }}>
                                        {edu.honors.join(', ')}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                );
            case 'skills':
                return skills.length > 0 && (
                    <View style={styles.section} key="skills">
                        <Text style={dynamicStyles.sectionTitle}>Core Competencies</Text>
                        <View>
                            {skills.map((skill) => {
                                const shouldShowLevel = settings?.showSkillLevel !== false;
                                const levelLabels: Record<string, string> = {
                                    'beginner': 'Beginner',
                                    'intermediate': 'Intermediate',
                                    'advanced': 'Advanced',
                                    'expert': 'Expert'
                                };
                                return (
                                    <Text key={skill.id} style={{ ...styles.skillItem, ...dynamicStyles.text095 }}>
                                        • {skill.name}
                                        {shouldShowLevel && skill.level && (
                                            <Text style={styles.skillLevel}> ({levelLabels[skill.level] || skill.level})</Text>
                                        )}
                                    </Text>
                                );
                            })}
                        </View>
                    </View>
                );
            case 'certifications':
                return certifications.length > 0 && (
                    <View style={styles.section} key="certifications">
                        <Text style={dynamicStyles.sectionTitle}>Certifications</Text>
                        {certifications.map((cert) => (
                            <View key={cert.id} style={{ marginBottom: 8 }}>
                                <Text style={{ fontWeight: 'bold', ...dynamicStyles.text095, color: '#111827' }}>{cert.name}</Text>
                                <Text style={{ ...dynamicStyles.text09, fontStyle: 'italic', color: '#4B5563' }}>
                                    {cert.issuer}, {formatDate(cert.date)}
                                </Text>
                            </View>
                        ))}
                    </View>
                );
            case 'languages':
                return languages.length > 0 && (
                    <View style={styles.section} key="languages">
                        <Text style={dynamicStyles.sectionTitle}>Languages</Text>
                        {languages.map((lang) => (
                            <View key={lang.id} style={{ marginBottom: 4 }}>
                                <Text style={{ ...dynamicStyles.text095, color: '#374151' }}>
                                    <Text style={{ fontWeight: 'bold' }}>{lang.name}</Text>
                                    <Text style={{ fontStyle: 'italic', color: '#4B5563' }}> — {lang.proficiency}</Text>
                                </Text>
                            </View>
                        ))}
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <Document>
            <Page size="A4" style={[styles.page, dynamicStyles.page]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={dynamicStyles.name}>{personalInfo.firstName} {personalInfo.lastName}</Text>
                    {personalInfo.title && <Text style={dynamicStyles.title}>{personalInfo.title}</Text>}

                    <View style={styles.contactRow}>
                        {personalInfo.email && <Text style={{ ...styles.contactItem, ...dynamicStyles.text09 }}>{personalInfo.email}</Text>}
                        {personalInfo.email && personalInfo.phone && <Text> • </Text>}
                        {personalInfo.phone && <Text style={{ ...styles.contactItem, ...dynamicStyles.text09 }}>{personalInfo.phone}</Text>}
                        {(personalInfo.email || personalInfo.phone) && personalInfo.location && <Text> • </Text>}
                        {personalInfo.location && <Text style={{ ...styles.contactItem, ...dynamicStyles.text09 }}>{personalInfo.location}</Text>}
                    </View>

                    {(personalInfo.linkedin || personalInfo.portfolio) && (
                        <View style={styles.linksRow}>
                            {personalInfo.linkedin && (
                                <Text style={{ ...styles.contactItem, ...dynamicStyles.text09 }}>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</Text>
                            )}
                            {personalInfo.linkedin && personalInfo.portfolio && <Text> • </Text>}
                            {personalInfo.portfolio && (
                                <Text style={{ ...styles.contactItem, ...dynamicStyles.text09 }}>{personalInfo.portfolio.replace(/^https?:\/\//, '')}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Two Column Layout */}
                <View style={styles.mainContainer}>
                    {/* Left Column */}
                    <View style={styles.leftColumn}>
                        {leftSections.map(section => renderSection(section.type))}
                    </View>

                    {/* Right Column */}
                    <View style={styles.rightColumn}>
                        {rightSections.map(section => renderSection(section.type))}
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export { ExecutiveClassicPDF };
