import jsPDF from 'jspdf';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    planName: string;
    amount: number;
    currency: string;
    status: string;
}

interface UserInfo {
    email: string;
    fullName?: string;
    company?: string;
    address?: string;
}

interface CompanyInfo {
    name: string;
    tagline: string;
    address: string[];
    email: string;
    website: string;
    vatNumber: string;
}

const COMPANY_INFO: CompanyInfo = {
    name: 'Cubbbe',
    tagline: 'AI-Powered Job Search Platform',
    address: [
        '42 Avenue des Champs-Élysées',
        '75008 Paris, France',
    ],
    email: 'billing@cubbbe.com',
    website: 'www.cubbbe.com',
    vatNumber: 'FR12345678901',
};

/**
 * Convert image URL to base64 for PDF embedding
 */
const getImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

/**
 * Get logo from Firebase Storage
 */
const getLogoBase64 = async (): Promise<string | null> => {
    try {
        const storage = getStorage();
        const logoRef = ref(storage, 'images/logo-only.png');
        const logoUrl = await getDownloadURL(logoRef);
        return await getImageAsBase64(logoUrl);
    } catch (error) {
        console.warn('Could not load logo for PDF:', error);
        return null;
    }
};

/**
 * Generate a premium branded PDF invoice
 */
export const generateInvoicePDF = async (
    invoice: InvoiceData,
    userEmail: string,
    userName?: string
): Promise<void> => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    let y = 25;

    // Colors
    const primaryColor: [number, number, number] = [99, 91, 255]; // #635bff
    const darkText: [number, number, number] = [17, 24, 39]; // gray-900
    const grayText: [number, number, number] = [107, 114, 128]; // gray-500
    const lightGray: [number, number, number] = [243, 244, 246]; // gray-100
    const successGreen: [number, number, number] = [34, 197, 94]; // green-500

    // Try to load logo
    const logoBase64 = await getLogoBase64();

    // === PREMIUM HEADER WITH GRADIENT BAR ===

    // Top gradient bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 8, 'F');

    y = 25;

    // Logo or company name
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, y, 35, 35);
        } catch {
            // Fallback to text
            doc.setFontSize(32);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('Cubbbe', margin, y + 20);
        }
    } else {
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Cubbbe', margin, y + 20);
    }

    // Invoice title (right side)
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text('INVOICE', pageWidth - margin, y + 15, { align: 'right' });

    // Invoice number below title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text(invoice.invoiceNumber, pageWidth - margin, y + 25, { align: 'right' });

    y += 50;

    // Elegant divider
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 25;

    // === TWO COLUMN INFO SECTION ===

    const colWidth = (pageWidth - margin * 2) / 2;

    // Left Column - Bill To
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BILL TO', margin, y);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    // Use full name if provided, otherwise capitalize email username
    const displayName = userName || userEmail.split('@')[0].split('.').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
    doc.text(displayName, margin, y + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text(userEmail, margin, y + 18);

    // Right Column - Invoice Details
    const rightX = pageWidth - margin;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('INVOICE DETAILS', rightX - 80, y);

    // Calculate due date (same as invoice date for paid invoices, or 30 days later for pending)
    const dueDate = new Date(invoice.date);
    if (invoice.status !== 'paid') {
        dueDate.setDate(dueDate.getDate() + 30);
    }

    const details = [
        { label: 'Invoice Date', value: invoice.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) },
        { label: 'Due Date', value: dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) },
        { label: 'Status', value: invoice.status.toUpperCase(), isStatus: true },
    ];

    let detailY = y + 10;
    details.forEach(detail => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayText);
        doc.text(detail.label, rightX - 80, detailY);

        doc.setFont('helvetica', 'bold');
        if (detail.isStatus) {
            doc.setTextColor(...(invoice.status === 'paid' ? successGreen : primaryColor));
        } else {
            doc.setTextColor(...darkText);
        }
        doc.text(detail.value, rightX, detailY, { align: 'right' });
        detailY += 8;
    });

    y += 45;

    // === PREMIUM TABLE ===

    // Table header with rounded corners effect
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayText);
    doc.text('DESCRIPTION', margin + 8, y + 9);
    doc.text('QTY', pageWidth / 2, y + 9, { align: 'center' });
    doc.text('AMOUNT', pageWidth - margin - 8, y + 9, { align: 'right' });

    y += 20;

    // Table row
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    doc.text(invoice.planName, margin + 8, y + 8);

    doc.setTextColor(...grayText);
    doc.text('1', pageWidth / 2, y + 8, { align: 'center' });

    const currencySymbol = invoice.currency === 'eur' ? '€' : '$';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(`${currencySymbol}${invoice.amount.toFixed(2)}`, pageWidth - margin - 8, y + 8, { align: 'right' });

    y += 18;

    // Subtle divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 15;

    // Subtotal & Total section
    const totalsX = pageWidth - margin - 100;

    // Subtotal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text('Subtotal', totalsX, y);
    doc.setTextColor(...darkText);
    doc.text(`${currencySymbol}${invoice.amount.toFixed(2)}`, pageWidth - margin - 8, y, { align: 'right' });

    y += 8;

    // Tax
    doc.setTextColor(...grayText);
    doc.text('Tax (0%)', totalsX, y);
    doc.setTextColor(...darkText);
    doc.text(`${currencySymbol}0.00`, pageWidth - margin - 8, y, { align: 'right' });

    y += 15;

    // Total box with premium styling
    doc.setFillColor(...primaryColor);
    doc.roundedRect(totalsX - 10, y - 5, pageWidth - margin - totalsX + 18, 20, 4, 4, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', totalsX, y + 8);
    doc.setFontSize(14);
    doc.text(`${currencySymbol}${invoice.amount.toFixed(2)}`, pageWidth - margin - 8, y + 8, { align: 'right' });

    // === PREMIUM FOOTER ===

    const footerY = pageHeight - 45;

    // Footer divider
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

    // Company info (left)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(COMPANY_INFO.name, margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text(COMPANY_INFO.tagline, margin, footerY + 5);
    doc.text(COMPANY_INFO.address.join(' • '), margin, footerY + 10);
    doc.text(`${COMPANY_INFO.email} • ${COMPANY_INFO.website}`, margin, footerY + 15);

    // VAT & Thank you (right)
    doc.setTextColor(...grayText);
    doc.text(`VAT: ${COMPANY_INFO.vatNumber}`, pageWidth - margin, footerY, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...primaryColor);
    doc.text('Thank you for your business!', pageWidth - margin, footerY + 10, { align: 'right' });

    // Powered by badge
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text('Powered by Cubbbe • AI-Powered Job Search', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const fileName = `Cubbbe_Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
};

export default generateInvoicePDF;
