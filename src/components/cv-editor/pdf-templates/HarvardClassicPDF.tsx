import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { formatDate, formatDateRange, getEnabledSections, sortSections } from '../../../lib/cvEditorUtils';

interface HarvardClassicPDFProps {
    data: CVData;
    settings?: CVLayoutSettings;
}

const HarvardClassicPDF: React.FC<HarvardClassicPDFProps> = ({ data, settings }) => {
    const { personalInfo, summary, experiences, education, skills, languages, projects, certifications, sections } = data;
    const enabledSections = getEnabledSections(sortSections(sections));

    // Default settings
    const fontSize = settings?.fontSize || 10;
    const lineHeight = settings?.lineHeight || 1.3;
    const fontFamily = settings?.fontFamily || 'Merriweather'; // Default to Serif
    // const accentColor = settings?.accentColor || '#000000'; // Harvard is usually black/grayscale

    // Spacing
    const spacingValue = settings?.experienceSpacing ?? 6;
    const itemSpacing = spacingValue * 1.75;

    const dynamicStyles = StyleSheet.create({
        page: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            lineHeight: lineHeight,
            paddingVertical: 20,
            paddingHorizontal: 40,
            color: '#111827',
        },
        // Header Styles
        header: {
            alignItems: 'center',
            marginBottom: 8, // Reduced margin
            borderBottomWidth: 1,
            borderBottomColor: '#9CA3AF', // gray-400
            paddingBottom: 12,
        },
        name: {
            fontSize: fontSize * 2.4,
            fontWeight: 700,
            marginBottom: 4, // Reduced margin to bring title closer
            lineHeight: 1.2,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: '#111827',
            textAlign: 'center',
        },
        title: {
            fontSize: fontSize * 1.1,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: '#4B5563', // gray-600
            textAlign: 'center',
        },
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 4,
            fontSize: fontSize * 0.85,
            color: '#4B5563', // gray-600 (was gray-700)
            marginBottom: 2,
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        separator: {
            marginHorizontal: 4,
            color: '#4B5563',
        },
        link: {
            color: '#4B5563',
            textDecoration: 'none',
        },

        // Section Styles
        section: {
            marginBottom: 6, // Reduced margin
        },
        sectionTitle: {
            fontSize: fontSize + 1,
            fontWeight: 600, // Reduced weight (was 700)
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 4, // Reduced margin
            color: '#1F2937', // gray-800
            borderBottomWidth: 1,
            borderBottomColor: '#D1D5DB', // gray-300
            paddingBottom: 2,
        },

        // Item Styles
        experienceItem: {
            marginBottom: itemSpacing,
        },
        experienceHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 2,
        },
        // Company/Institution - Bold
        itemTitle: {
            fontWeight: 700,
            fontSize: fontSize,
            color: '#111827',
        },
        // Title/Degree - Italic
        itemSubtitle: {
            fontSize: fontSize,
            fontStyle: 'italic',
            color: '#4B5563', // gray-600
        },
        dateLocation: {
            fontSize: fontSize * 0.9,
            color: '#4B5563', // gray-600
            textAlign: 'right',
        },
        description: {
            marginBottom: 2,
            fontSize: fontSize,
            color: '#4B5563', // gray-600
            textAlign: 'justify',
        },
        bulletPoint: {
            flexDirection: 'row',
            marginBottom: 1,
            paddingLeft: 12,
        },
        bullet: {
            width: 10,
            fontSize: fontSize,
            color: '#4B5563',
        },
        bulletText: {
            flex: 1,
            fontSize: fontSize,
            color: '#4B5563',
            textAlign: 'justify',
        },

        // Skills & Languages (Inline)
        inlineList: {
            // flexDirection: 'row', // Removed flex layout
            // flexWrap: 'wrap',
        },
        inlineItem: {
            fontSize: fontSize,
            color: '#4B5563',
        }
    });

    const renderSection = (type: string) => {
        switch (type) {
            case 'summary':
                return summary && (
                    <View style={dynamicStyles.section} key="summary">
                        <Text style={dynamicStyles.sectionTitle}>Summary</Text>
                        <Text style={dynamicStyles.description}>{summary}</Text>
                    </View>
                );
            case 'experience':
                return experiences.length > 0 && (
                    <View style={dynamicStyles.section} key="experience">
                        <Text style={dynamicStyles.sectionTitle}>Experience</Text>
                        {experiences.map((exp, index) => (
                            <View key={exp.id} style={{ ...dynamicStyles.experienceItem, marginBottom: index === experiences.length - 1 ? 0 : itemSpacing }}>
                                <View style={dynamicStyles.experienceHeader}>
                                    <View>
                                        <Text style={dynamicStyles.itemTitle}>{exp.company}</Text>
                                        <Text style={dynamicStyles.itemSubtitle}>{exp.title}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {exp.location && <Text style={dynamicStyles.dateLocation}>{exp.location}</Text>}
                                        <Text style={dynamicStyles.dateLocation}>
                                            {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                        </Text>
                                    </View>
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
                        {education.map((edu, index) => (
                            <View key={edu.id} style={{ ...dynamicStyles.experienceItem, marginBottom: index === education.length - 1 ? 0 : itemSpacing }}>
                                <View style={dynamicStyles.experienceHeader}>
                                    <View>
                                        <Text style={dynamicStyles.itemTitle}>{edu.institution}</Text>
                                        <Text style={dynamicStyles.itemSubtitle}>
                                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                        </Text>
                                        {edu.gpa && <Text style={{ ...dynamicStyles.dateLocation, textAlign: 'left' }}>GPA: {edu.gpa}</Text>}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {edu.location && <Text style={dynamicStyles.dateLocation}>{edu.location}</Text>}
                                        <Text style={dynamicStyles.dateLocation}>
                                            {formatDate(edu.endDate)}
                                        </Text>
                                    </View>
                                </View>
                                {edu.honors && edu.honors.length > 0 && (
                                    <Text style={{ ...dynamicStyles.description, fontStyle: 'italic' }}>
                                        {edu.honors.join(', ')}
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
                        <Text style={{ ...dynamicStyles.description, textAlign: 'justify' }}>
                            {skills.map((skill, index) => (
                                <Text key={skill.id}>
                                    {skill.name}
                                    {index < skills.length - 1 ? ' • ' : ''}
                                </Text>
                            ))}
                        </Text>
                    </View>
                );
            case 'projects':
                return projects.length > 0 && (
                    <View style={dynamicStyles.section} key="projects">
                        <Text style={dynamicStyles.sectionTitle}>Projects</Text>
                        {projects.map((project, index) => (
                            <View key={project.id} style={{ ...dynamicStyles.experienceItem, marginBottom: index === projects.length - 1 ? 0 : itemSpacing }}>
                                <View style={dynamicStyles.experienceHeader}>
                                    <Text style={dynamicStyles.itemTitle}>{project.name}</Text>
                                    {project.startDate && (
                                        <Text style={dynamicStyles.dateLocation}>
                                            {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                        </Text>
                                    )}
                                </View>
                                <Text style={dynamicStyles.description}>{project.description}</Text>
                                {project.technologies.length > 0 && (
                                    <Text style={{ ...dynamicStyles.description, fontStyle: 'italic' }}>
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
                            <View key={cert.id} style={{ marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={{ ...dynamicStyles.itemTitle, marginRight: 4 }}>{cert.name}</Text>
                                    <Text style={dynamicStyles.itemSubtitle}>— {cert.issuer}</Text>
                                </View>
                                <Text style={dynamicStyles.dateLocation}>{formatDate(cert.date)}</Text>
                            </View>
                        ))}
                    </View>
                );
            case 'languages':
                return languages.length > 0 && (
                    <View style={dynamicStyles.section} key="languages">
                        <Text style={dynamicStyles.sectionTitle}>Languages</Text>
                        <Text style={{ ...dynamicStyles.description, textAlign: 'justify' }}>
                            {languages.map((lang, index) => (
                                <Text key={lang.id}>
                                    {lang.name} {lang.proficiency ? `(${lang.proficiency})` : ''}
                                    {index < languages.length - 1 ? ' • ' : ''}
                                </Text>
                            ))}
                        </Text>
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

                    {/* Contact Info Row 1: Location, Phone, Email */}
                    <View style={dynamicStyles.contactRow}>
                        {personalInfo.location && (
                            <>
                                <Text>{personalInfo.location}</Text>
                                {(personalInfo.phone || personalInfo.email) && <Text style={dynamicStyles.separator}>|</Text>}
                            </>
                        )}
                        {personalInfo.phone && (
                            <>
                                <Text>{personalInfo.phone}</Text>
                                {personalInfo.email && <Text style={dynamicStyles.separator}>|</Text>}
                            </>
                        )}
                        {personalInfo.email && (
                            <Text>{personalInfo.email}</Text>
                        )}
                    </View>

                    {/* Contact Info Row 2: Links */}
                    {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.github) && (
                        <View style={dynamicStyles.contactRow}>
                            {personalInfo.linkedin && (
                                <>
                                    <Text style={dynamicStyles.link}>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</Text>
                                    {(personalInfo.portfolio || personalInfo.github) && <Text style={dynamicStyles.separator}>|</Text>}
                                </>
                            )}
                            {personalInfo.github && (
                                <>
                                    <Text style={dynamicStyles.link}>{personalInfo.github.replace(/^https?:\/\//, '')}</Text>
                                    {personalInfo.portfolio && <Text style={dynamicStyles.separator}>|</Text>}
                                </>
                            )}
                            {personalInfo.portfolio && (
                                <Text style={dynamicStyles.link}>{personalInfo.portfolio.replace(/^https?:\/\//, '')}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Sections */}
                {enabledSections.map(section => renderSection(section.type))}
            </Page>
        </Document>
    );
};

export default HarvardClassicPDF;
