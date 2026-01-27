import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { formatDate, formatDateRange } from '../../../lib/cvEditorUtils';

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

const ModernProfessionalPDF: React.FC<ModernProfessionalPDFProps> = ({ data, settings }) => {
    const { personalInfo, summary, experiences, education, skills, languages, projects } = data;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{personalInfo.firstName} {personalInfo.lastName}</Text>
                    {personalInfo.title && <Text style={styles.title}>{personalInfo.title}</Text>}

                    <View style={styles.contactRow}>
                        {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
                        {personalInfo.phone && <Text style={styles.contactItem}>• {personalInfo.phone}</Text>}
                        {personalInfo.location && <Text style={styles.contactItem}>• {personalInfo.location}</Text>}
                        {personalInfo.linkedin && <Text style={styles.contactItem}>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</Text>}
                        {personalInfo.portfolio && <Text style={styles.contactItem}>• {personalInfo.portfolio.replace(/^https?:\/\//, '')}</Text>}
                    </View>
                </View>

                {/* Summary */}
                {summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={{ fontSize: 10, color: '#374151' }}>{summary}</Text>
                    </View>
                )}

                {/* Experience */}
                {experiences.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Experience</Text>
                        {experiences.map((exp) => (
                            <View key={exp.id} style={styles.experienceItem}>
                                <View style={styles.experienceHeader}>
                                    <View>
                                        <Text style={styles.companyName}>{exp.company}</Text>
                                        <Text style={styles.jobTitle}>{exp.title}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.dateLocation}>
                                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                        </Text>
                                        {exp.location && <Text style={styles.dateLocation}>{exp.location}</Text>}
                                    </View>
                                </View>
                                {exp.description && <Text style={styles.description}>{exp.description}</Text>}
                                {exp.bullets.map((bullet, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{bullet}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {education.map((edu) => (
                            <View key={edu.id} style={styles.experienceItem}>
                                <View style={styles.experienceHeader}>
                                    <View>
                                        <Text style={styles.companyName}>{edu.institution}</Text>
                                        <Text style={styles.jobTitle}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.dateLocation}>
                                            {edu.startDate ? `${formatDate(edu.startDate)} - ` : ''}{formatDate(edu.endDate)}
                                        </Text>
                                        {edu.location && <Text style={styles.dateLocation}>{edu.location}</Text>}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        <View style={styles.skillsContainer}>
                            {skills.map((skill) => (
                                <Text key={skill.id} style={styles.skillItem}>{skill.name}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Languages</Text>
                        <View style={styles.skillsContainer}>
                            {languages.map((lang) => (
                                <Text key={lang.id} style={styles.skillItem}>
                                    {lang.name} {lang.proficiency ? `(${lang.proficiency})` : ''}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default ModernProfessionalPDF;
