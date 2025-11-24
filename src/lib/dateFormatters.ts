// Date formatting utilities for CV templates

export type DateFormat = 'jan-24' | 'january-2024' | '01-2024' | '2024-01';

/**
 * Format a date string (YYYY-MM format from month input) according to the specified format
 */
export function formatCVDate(dateString: string, format: DateFormat): string {
  if (!dateString) return '';

  const [year, month] = dateString.split('-');
  if (!year || !month) return dateString;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthIndex = parseInt(month) - 1;
  const monthName = monthNames[monthIndex];
  const monthShort = monthShortNames[monthIndex];
  const yearShort = year.slice(-2);

  switch (format) {
    case 'jan-24':
      return `${monthShort} '${yearShort}`;
    case 'january-2024':
      return `${monthName} ${year}`;
    case '01-2024':
      return `${month}/${year}`;
    case '2024-01':
      return `${year}-${month}`;
    default:
      return `${monthShort} '${yearShort}`;
  }
}

/**
 * Format a date range for experience/education
 */
export function formatDateRange(
  startDate: string,
  endDate: string,
  isCurrent: boolean,
  format: DateFormat
): string {
  const start = formatCVDate(startDate, format);
  
  if (isCurrent) {
    return `${start} - Present`;
  }
  
  const end = formatCVDate(endDate, format);
  return `${start} - ${end}`;
}

