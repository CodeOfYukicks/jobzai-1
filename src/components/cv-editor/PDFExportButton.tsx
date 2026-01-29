import React, { useState, useRef, useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Loader2, ChevronDown, FileText, File, FolderOpen } from 'lucide-react';
import { CVData, CVLayoutSettings, CVTemplate } from '../../types/cvEditor';
import ModernProfessionalPDF from './pdf-templates/ModernProfessionalPDF';
import { ExecutiveClassicPDF } from './pdf-templates/ExecutiveClassicPDF';
import HarvardClassicPDF from './pdf-templates/HarvardClassicPDF';
import SwissPhotoPDF from './pdf-templates/SwissPhotoPDF';
import { registerPDFFonts } from '../../lib/pdfFonts';
import { notify } from '../../lib/notify';

// Register fonts once
registerPDFFonts();

interface PDFExportButtonProps {
    cvData: CVData;
    template: CVTemplate;
    settings?: CVLayoutSettings;
    className?: string;
    onSaveToLibrary?: (blob: Blob, fileName: string) => void;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({ cvData, template, settings, className, onSaveToLibrary }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Generate filename
    const firstName = cvData.personalInfo.firstName || 'CV';
    const lastName = cvData.personalInfo.lastName || '';
    const fileName = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderDocument = () => {
        switch (template) {
            case 'executive-classic':
                return <ExecutiveClassicPDF data={cvData} settings={settings} />;
            case 'harvard-classic':
                return <HarvardClassicPDF data={cvData} settings={settings} />;
            case 'swiss-photo':
                return <SwissPhotoPDF data={cvData} settings={settings} />;
            case 'modern-professional':
            default:
                return <ModernProfessionalPDF data={cvData} settings={settings} />;
        }
    };

    // Use usePDF hook to generate the PDF instance
    const [instance, updateInstance] = usePDF({ document: renderDocument() });

    // Update instance when data changes
    useEffect(() => {
        updateInstance(renderDocument());
    }, [cvData, template, settings]);

    const handleDocxExport = () => {
        setIsOpen(false);
        notify.info('DOCX export is coming soon!');
    };

    const handleSaveToLibrary = () => {
        setIsOpen(false);
        if (onSaveToLibrary && instance.blob) {
            onSaveToLibrary(instance.blob, fileName);
        } else if (!instance.blob) {
            notify.error('PDF is still generating. Please wait a moment.');
        }
    };

    return (
        <div className={`relative inline-flex rounded-lg shadow-sm ${className || ''}`} ref={dropdownRef}>
            {/* Main Split Button Container */}
            <div className="flex items-center rounded-lg overflow-hidden bg-[#9ff019] hover:bg-[#8ec915] transition-colors shadow-sm hover:shadow-md">
                {/* Left Side: Direct PDF Download */}
                <a
                    href={instance.url || '#'}
                    download={fileName}
                    className={`flex items-center gap-2 px-3 py-1.5 text-gray-900 font-semibold text-xs transition-colors border-r border-black/10 hover:bg-black/5 ${instance.loading ? 'cursor-wait opacity-70' : ''}`}
                    onClick={(e) => {
                        if (instance.loading) e.preventDefault();
                    }}
                >
                    {instance.loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <span className="font-semibold">Download PDF</span>
                    )}
                </a>

                {/* Right Side: Dropdown Trigger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-1.5 py-1.5 text-gray-900 hover:bg-black/5 transition-colors h-full flex items-center justify-center"
                    aria-label="Export options"
                >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#2b2a2c] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {/* PDF Option */}
                        <a
                            href={instance.url || '#'}
                            download={fileName}
                            className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left w-full ${instance.loading ? 'cursor-wait opacity-70' : ''}`}
                            onClick={(e) => {
                                if (instance.loading) e.preventDefault();
                                setIsOpen(false);
                            }}
                        >
                            <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                                {instance.loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <FileText className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                                    {instance.loading ? 'Generating PDF...' : 'Export as PDF'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Recommended. Pixel-perfect and ready to send. Matches the preview exactly.
                                </div>
                            </div>
                        </a>

                        {/* Save to Library Option */}
                        {onSaveToLibrary && (
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={instance.loading}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left w-full disabled:opacity-50"
                            >
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                                        Save to Library
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        Save the PDF directly to your documents library.
                                    </div>
                                </div>
                            </button>
                        )}

                        {/* DOCX Option */}
                        <button
                            onClick={handleDocxExport}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left w-full"
                        >
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <File className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                                    Export as .DOCX
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Ideal for further editing in Word or Google Docs. Uses a standard template.
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDFExportButton;
