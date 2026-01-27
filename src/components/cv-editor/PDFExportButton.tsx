import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { CVData, CVLayoutSettings, CVTemplate } from '../../types/cvEditor';
import ModernProfessionalPDF from './pdf-templates/ModernProfessionalPDF';
import ExecutiveClassicPDF from './pdf-templates/ExecutiveClassicPDF';

interface PDFExportButtonProps {
    cvData: CVData;
    template: CVTemplate;
    settings?: CVLayoutSettings;
    className?: string;
}

import { registerPDFFonts } from '../../lib/pdfFonts';

// Register fonts once
registerPDFFonts();

const PDFExportButton: React.FC<PDFExportButtonProps> = ({ cvData, template, settings, className }) => {
    // Generate filename
    const firstName = cvData.personalInfo.firstName || 'CV';
    const lastName = cvData.personalInfo.lastName || '';
    const fileName = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');

    const renderDocument = () => {
        switch (template) {
            case 'executive-classic':
                return <ExecutiveClassicPDF data={cvData} settings={settings} />;
            case 'modern-professional':
            default:
                return <ModernProfessionalPDF data={cvData} settings={settings} />;
        }
    };

    return (
        <PDFDownloadLink
            document={renderDocument()}
            fileName={fileName}
            className={`
        group relative flex items-center gap-1.5 px-4 py-1.5 
        bg-[#b7e219] 
        hover:bg-[#a5cb17] 
        active:bg-[#9fc015]
        text-gray-900 
        rounded-xl 
        shadow-sm 
        hover:shadow-md 
        transition-all duration-200 
        font-semibold text-xs
        ${className || ''}
      `}
        >
            {({ blob, url, loading, error }) => {
                if (error) {
                    console.error('PDF Generation Error:', error);
                    return <span>Error</span>;
                }
                return (
                    <>
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Download className="w-3.5 h-3.5 group-hover:animate-bounce" style={{ animationDuration: '0.6s', animationIterationCount: '1' }} />
                        )}
                        <span className="hidden md:inline">
                            {loading ? 'Generating...' : 'Export PDF (Beta)'}
                        </span>
                    </>
                );
            }}
        </PDFDownloadLink>
    );
};

export default PDFExportButton;
