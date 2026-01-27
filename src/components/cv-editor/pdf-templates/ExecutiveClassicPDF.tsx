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
        marginBottom: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937', // gray-800
        paddingBottom: 16,
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    title: {
        fontSize: 14,
        color: '#374151', // gray-700
        marginBottom: 12,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        fontSize: 9,
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
        fontSize: 9,
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        color: '#1F2937', // gray-800
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
        fontSize: 10,
        fontStyle: 'italic',
        color: '#374151',
    },
    jobTitle: {
        fontWeight: 'bold',
        fontSize: 11,
        color: '#111827',
    },
    dateLocation: {
        fontSize: 9,
        color: '#4B5563',
        fontStyle: 'italic',
    },
    description: {
        marginBottom: 4,
        fontSize: 10,
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
        fontSize: 10,
        color: '#374151',
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
        color: '#374151',
        textAlign: 'justify',
    },
    educationItem: {
        marginBottom: 12,
    },
    skillItem: {
        fontSize: 10,
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
    // Web uses (value * 4)px. 1px approx 0.75pt. So value * 3pt is a good approximation.
    const spacing = (settings?.experienceSpacing || 6) * 3;

    const dynamicStyles = StyleSheet.create({
        page: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            lineHeight: lineHeight,
        },
        experienceItem: {
            marginBottom: spacing,
        },
        sectionTitle: {
            fontSize: fontSize + 1,
            letterSpacing: 1,
            marginBottom: 12,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: '#1F2937',
        },
        name: {
            fontSize: fontSize * 2.4,
            fontWeight: 'bold',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
        },
        title: {
            fontSize: fontSize * 1.4,
            color: '#374151',
            marginBottom: 12,
            fontStyle: 'italic',
            textAlign: 'center',
        },
    });

    const renderSection = (type: string) => {
        switch (type) {
            case 'summary':
                return summary && (
                    <View style={styles.section} key="summary">
                        <Text style={dynamicStyles.sectionTitle}>Executive Summary</Text>
                        <Text style={{ fontSize: fontSize, color: '#374151', textAlign: 'justify', lineHeight: lineHeight }}>{summary}</Text>
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
                                        <Text style={{ ...styles.jobTitle, fontSize: fontSize + 1 }}>{exp.title}</Text>
                                        <Text style={{ ...styles.dateLocation, fontSize: fontSize - 1 }}>
                                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                        </Text>
                                    </View>
                                    <Text style={{ ...styles.companyName, fontSize: fontSize }}>
                                        {exp.company}
                                        {exp.location && ` — ${exp.location}`}
                                    </Text>
                                </View>
                                {exp.description && <Text style={{ ...styles.description, fontSize: fontSize }}>{exp.description}</Text>}
                                {exp.bullets.map((bullet, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={{ ...styles.bullet, fontSize: fontSize }}>•</Text>
                                        <Text style={{ ...styles.bulletText, fontSize: fontSize }}>{bullet}</Text>
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
                                    <Text style={{ ...styles.jobTitle, fontSize: fontSize + 1 }}>{project.name}</Text>
                                    {project.startDate && (
                                        <Text style={{ ...styles.dateLocation, fontSize: fontSize - 1 }}>
                                            {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                        </Text>
                                    )}
                                </View>
                                <Text style={{ ...styles.description, fontSize: fontSize }}>{project.description}</Text>
                                {project.highlights.map((highlight, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={{ ...styles.bullet, fontSize: fontSize }}>•</Text>
                                        <Text style={{ ...styles.bulletText, fontSize: fontSize }}>{highlight}</Text>
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
                                <Text style={{ fontWeight: 'bold', fontSize: fontSize + 1, color: '#111827' }}>{edu.degree}</Text>
                                {edu.field && <Text style={{ fontSize: fontSize, fontStyle: 'italic', color: '#374151' }}>{edu.field}</Text>}
                                <Text style={{ fontSize: fontSize, color: '#374151' }}>{edu.institution}</Text>
                                <Text style={{ fontSize: fontSize - 1, fontStyle: 'italic', color: '#4B5563' }}>{formatDate(edu.endDate)}</Text>
                                {edu.gpa && <Text style={{ fontSize: fontSize - 1, color: '#4B5563' }}>GPA: {edu.gpa}</Text>}
                                {edu.honors && edu.honors.length > 0 && (
                                    <Text style={{ fontSize: fontSize - 1, fontStyle: 'italic', color: '#4B5563', marginTop: 2 }}>
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
                                const levelLabels: Record<string, string> = {
                                    'beginner': 'Beginner',
                                    'intermediate': 'Intermediate',
                                    'advanced': 'Advanced',
                                    'expert': 'Expert'
                                };
                                return (
                                    <Text key={skill.id} style={{ ...styles.skillItem, fontSize: fontSize }}>
                                        • {skill.name}
                                        {skill.level && (
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
                                <Text style={{ fontWeight: 'bold', fontSize: fontSize, color: '#111827' }}>{cert.name}</Text>
                                <Text style={{ fontSize: fontSize - 1, fontStyle: 'italic', color: '#4B5563' }}>
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
                                <Text style={{ fontSize: fontSize, color: '#374151' }}>
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
                        {personalInfo.email && <Text style={{ ...styles.contactItem, fontSize: fontSize - 1 }}>{personalInfo.email}</Text>}
                        {personalInfo.email && personalInfo.phone && <Text> • </Text>}
                        {personalInfo.phone && <Text style={{ ...styles.contactItem, fontSize: fontSize - 1 }}>{personalInfo.phone}</Text>}
                        {(personalInfo.email || personalInfo.phone) && personalInfo.location && <Text> • </Text>}
                        {personalInfo.location && <Text style={{ ...styles.contactItem, fontSize: fontSize - 1 }}>{personalInfo.location}</Text>}
                    </View>

                    {(personalInfo.linkedin || personalInfo.portfolio) && (
                        <View style={styles.linksRow}>
                            {personalInfo.linkedin && (
                                <Text style={{ ...styles.contactItem, fontSize: fontSize - 1 }}>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</Text>
                            )}
                            {personalInfo.linkedin && personalInfo.portfolio && <Text> • </Text>}
                            {personalInfo.portfolio && (
                                <Text style={{ ...styles.contactItem, fontSize: fontSize - 1 }}>{personalInfo.portfolio.replace(/^https?:\/\//, '')}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Two Column Layout */}
                <View style={styles.mainContainer}>
                    {/* Left Column */}
                    <View style={styles.leftColumn}>
                        {enabledSections.map(section => {
                            if (['summary', 'experience', 'projects'].includes(section.type)) {
                                return renderSection(section.type);
                            }
                            return null;
                        })}
                    </View>

                    {/* Right Column */}
                    <View style={styles.rightColumn}>
                        {enabledSections.map(section => {
                            if (['education', 'skills', 'certifications', 'languages'].includes(section.type)) {
                                return renderSection(section.type);
                            }
                            return null;
                        })}
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default ExecutiveClassicPDF;
