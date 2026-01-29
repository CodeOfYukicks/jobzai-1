import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Path, Image } from '@react-pdf/renderer';
import { CVData, CVLayoutSettings } from '../../../types/cvEditor';
import { getEnabledSections, sortSections, formatURL } from '../../../lib/cvEditorUtils';
import { formatCVDate, formatDateRange as formatDateRangeUtil } from '../../../lib/dateFormatters';

interface SwissPhotoPDFProps {
    data: CVData;
    settings?: CVLayoutSettings;
}

// Icons - Using Filled/Stroke versions for better PDF rendering (Path only)
const MailIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={2} fill="none" />
        <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

const PhoneIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
        <Path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            stroke={color}
            strokeWidth={2}
            fill="none"
        />
    </Svg>
);

const MapPinIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

const LinkedinIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
        <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M2 9h4v12H2z" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

const GithubIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
        <Path
            d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
            stroke={color}
            strokeWidth={2}
            fill="none"
        />
        <Path d="M9 18c-4.51 2-5-2-7-2" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

const GlobeIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
        <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M2 12h20" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

const UserIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: 40, height: 40 }}>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
);

const SwissPhotoPDF: React.FC<SwissPhotoPDFProps> = ({ data, settings }) => {
    const { personalInfo, summary, experiences, education, skills, languages, projects, certifications, sections } = data;
    const enabledSections = getEnabledSections(sortSections(sections));

    // Default settings
    const fontSize = settings?.fontSize || 10;
    const lineHeight = settings?.lineHeight || 1.3;
    const fontFamily = settings?.fontFamily || 'Helvetica';
    const accentColor = '#6B7280'; // Gray-500 for icons (was #374151)

    // Spacing
    const spacingValue = settings?.experienceSpacing ?? 6;
    const itemSpacing = spacingValue * 1.1;

    const formatDate = (date: string) => {
        return formatCVDate(date, settings?.dateFormat as any);
    };

    const formatDateRange = (start: string, end: string, isCurrent: boolean) => {
        return formatDateRangeUtil(start, end, isCurrent, settings?.dateFormat as any);
    };

    // Split sections
    const sidebarSections = ['skills', 'education', 'languages', 'certifications'];
    const mainSections = enabledSections.filter(s => !sidebarSections.includes(s.type) && s.type !== 'personal');
    const sidebarEnabledSections = enabledSections.filter(s => sidebarSections.includes(s.type));

    const styles = StyleSheet.create({
        page: {
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            padding: 30,
            fontFamily: fontFamily,
            fontSize: fontSize,
            lineHeight: lineHeight,
            color: '#111827',
        },
        // Left Sidebar (30%)
        sidebar: {
            width: '28%',
            paddingRight: 10,
            borderRightWidth: 1,
            borderRightColor: '#E5E7EB', // gray-200
        },
        // Right Main Content (70%)
        main: {
            width: '72%',
            paddingLeft: 20,
        },
        // Profile Photo
        photoContainer: {
            alignItems: 'center',
            marginBottom: 15,
        },
        photo: {
            width: 72,
            height: 72,
            borderRadius: 36,
            objectFit: 'cover',
            borderWidth: 2,
            borderColor: '#E5E7EB',
        },
        photoPlaceholder: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#F3F4F6',
            borderWidth: 2,
            borderColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
        },
        // Name & Title
        name: {
            fontSize: fontSize * 1.4,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 4,
            color: '#111827',
        },
        title: {
            fontSize: fontSize * 0.8,
            textAlign: 'center',
            color: '#4B5563',
            marginBottom: 12,
        },
        // Contact Info
        contactContainer: {
            marginBottom: 18,
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
        },
        contactIcon: {
            marginRight: 8,
        },
        contactText: {
            fontSize: fontSize * 0.85,
            color: '#374151',
            flex: 1,
        },
        // Section Headers
        sidebarTitle: {
            fontSize: fontSize * 0.8,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            borderBottomWidth: 1,
            borderBottomColor: '#D1D5DB',
            paddingBottom: 4,
            marginBottom: 5,
            color: '#1F2937',
        },
        mainTitle: {
            fontSize: fontSize * 0.85,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            borderBottomWidth: 1,
            borderBottomColor: '#D1D5DB',
            paddingBottom: 4,
            marginBottom: 8,
            color: '#1F2937',
        },
        // Content Items
        itemContainer: {
            marginBottom: itemSpacing,
        },
        itemTitle: {
            fontSize: fontSize,
            fontWeight: 700,
            color: '#111827',
        },
        itemSubtitle: {
            fontSize: fontSize * 0.9,
            color: '#4B5563',
        },
        dateLocation: {
            fontSize: fontSize * 0.85,
            color: '#6B7280',
        },
        description: {
            fontSize: fontSize * 0.9,
            color: '#374151',
            marginTop: 2,
            textAlign: 'justify',
        },
        bulletPoint: {
            flexDirection: 'row',
            marginTop: 2,
            paddingLeft: 8,
        },
        bullet: {
            width: 10,
            fontSize: fontSize * 0.9,
            color: '#374151',
        },
        bulletText: {
            flex: 1,
            fontSize: fontSize * 0.9,
            color: '#374151',
            textAlign: 'justify',
        },
        // Sidebar Specific
        skillItem: {
            fontSize: fontSize * 0.9,
            color: '#374151',
            marginBottom: 3,
        },
        langItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 3,
            fontSize: fontSize * 0.9,
        },
    });

    const renderSidebarSection = (type: string) => {
        switch (type) {
            case 'skills':
                return skills.length > 0 ? (
                    <View style={{ marginBottom: 15 }} key="skills">
                        <Text style={styles.sidebarTitle}>Skills</Text>
                        <View>
                            {skills.map(skill => (
                                <Text key={skill.id} style={styles.skillItem}>{skill.name}</Text>
                            ))}
                        </View>
                    </View>
                ) : null;
            case 'languages':
                return languages.length > 0 ? (
                    <View style={{ marginBottom: 15 }} key="languages">
                        <Text style={styles.sidebarTitle}>Languages</Text>
                        <View>
                            {languages.map(lang => (
                                <View key={lang.id} style={styles.langItem}>
                                    <Text style={{ color: '#374151' }}>{lang.name}</Text>
                                    <Text style={{ color: '#6B7280' }}>{lang.proficiency}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null;
            case 'certifications':
                return certifications.length > 0 ? (
                    <View style={{ marginBottom: 15 }} key="certifications">
                        <Text style={styles.sidebarTitle}>Certifications</Text>
                        {certifications.map(cert => (
                            <View key={cert.id} style={{ marginBottom: 6 }}>
                                <Text style={{ ...styles.itemTitle, fontSize: fontSize * 0.85 }}>{cert.name}</Text>
                                <Text style={{ ...styles.itemSubtitle, fontSize: fontSize * 0.85 }}>{cert.issuer}</Text>
                                <Text style={{ ...styles.dateLocation, color: '#9CA3AF' }}>{formatDate(cert.date)}</Text>
                            </View>
                        ))}
                    </View>
                ) : null;
            case 'education':
                return education.length > 0 ? (
                    <View style={{ marginBottom: 15 }} key="education">
                        <Text style={styles.sidebarTitle}>Education</Text>
                        {education.map(edu => (
                            <View key={edu.id} style={{ marginBottom: 6 }}>
                                <Text style={{ ...styles.itemTitle, fontSize: fontSize * 0.85 }}>
                                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                </Text>
                                <Text style={{ ...styles.itemSubtitle, fontSize: fontSize * 0.85 }}>{edu.institution}</Text>
                                <Text style={{ ...styles.dateLocation, color: '#9CA3AF' }}>{formatDate(edu.endDate)}</Text>
                            </View>
                        ))}
                    </View>
                ) : null;
            default:
                return null;
        }
    };

    const renderMainSection = (type: string) => {
        switch (type) {
            case 'summary':
                return summary ? (
                    <View style={{ marginBottom: 15 }} key="summary">
                        <Text style={styles.mainTitle}>Profile</Text>
                        <Text style={{ ...styles.description, fontSize: fontSize * 0.95 }}>{summary}</Text>
                    </View>
                ) : null;
            case 'experience':
                return experiences.length > 0 ? (
                    <View style={{ marginBottom: 15 }} key="experience">
                        <Text style={styles.mainTitle}>Experience</Text>
                        {experiences.map(exp => (
                            <View key={exp.id} style={styles.itemContainer}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemTitle}>{exp.title}</Text>
                                        <Text style={styles.itemSubtitle}>
                                            {exp.company}{exp.location ? `, ${exp.location}` : ''}
                                        </Text>
                                    </View>
                                    <Text style={styles.dateLocation}>
                                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                                    </Text>
                                </View>
                                {exp.description ? <Text style={styles.description}>{exp.description}</Text> : null}
                                {exp.bullets.map((bullet, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={styles.bullet}>–</Text>
                                        <Text style={styles.bulletText}>{bullet}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                ) : null;
            case 'projects':
                return projects.length > 0 ? (
                    <View style={{ marginBottom: 15 }} key="projects">
                        <Text style={styles.mainTitle}>Projects</Text>
                        {projects.map(project => (
                            <View key={project.id} style={styles.itemContainer}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <Text style={styles.itemTitle}>{project.name}</Text>
                                    {project.startDate ? (
                                        <Text style={styles.dateLocation}>
                                            {formatDateRange(project.startDate, project.endDate || '', !project.endDate)}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={styles.description}>{project.description}</Text>
                                {project.technologies.length > 0 ? (
                                    <Text style={{ ...styles.description, color: '#6B7280', fontSize: fontSize * 0.85 }}>
                                        {project.technologies.join(' • ')}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Left Sidebar */}
                <View style={styles.sidebar}>
                    {/* Photo & Personal Info */}
                    <View style={styles.photoContainer}>
                        {personalInfo.photoUrl ? (
                            <Image
                                src={personalInfo.photoUrl}
                                style={styles.photo}
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <UserIcon color="#9CA3AF" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>
                        {personalInfo.firstName}
                        {'\n'}
                        {personalInfo.lastName}
                    </Text>

                    {personalInfo.title ? <Text style={styles.title}>{personalInfo.title}</Text> : null}

                    <View style={styles.contactContainer}>
                        {personalInfo.email ? (
                            <View style={styles.contactItem}>
                                <View style={styles.contactIcon}><MailIcon color={accentColor} /></View>
                                <Text style={styles.contactText}>{personalInfo.email}</Text>
                            </View>
                        ) : null}
                        {personalInfo.phone ? (
                            <View style={styles.contactItem}>
                                <View style={styles.contactIcon}><PhoneIcon color={accentColor} /></View>
                                <Text style={styles.contactText}>{personalInfo.phone}</Text>
                            </View>
                        ) : null}
                        {personalInfo.location ? (
                            <View style={styles.contactItem}>
                                <View style={styles.contactIcon}><MapPinIcon color={accentColor} /></View>
                                <Text style={styles.contactText}>{personalInfo.location}</Text>
                            </View>
                        ) : null}
                        {personalInfo.linkedin ? (
                            <View style={styles.contactItem}>
                                <View style={styles.contactIcon}><LinkedinIcon color={accentColor} /></View>
                                <Text style={styles.contactText}>{formatURL(personalInfo.linkedin)}</Text>
                            </View>
                        ) : null}
                        {personalInfo.github ? (
                            <View style={styles.contactItem}>
                                <View style={styles.contactIcon}><GithubIcon color={accentColor} /></View>
                                <Text style={styles.contactText}>{formatURL(personalInfo.github)}</Text>
                            </View>
                        ) : null}
                        {personalInfo.portfolio ? (
                            <View style={styles.contactItem}>
                                <View style={styles.contactIcon}><GlobeIcon color={accentColor} /></View>
                                <Text style={styles.contactText}>{formatURL(personalInfo.portfolio)}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Sidebar Sections */}
                    {sidebarEnabledSections.map(section => renderSidebarSection(section.type))}
                </View>

                {/* Right Main Content */}
                <View style={styles.main}>
                    {mainSections.map(section => renderMainSection(section.type))}
                </View>
            </Page>
        </Document>
    );
};

export default SwissPhotoPDF;
