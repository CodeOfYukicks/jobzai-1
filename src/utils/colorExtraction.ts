/**
 * Color extraction and brand gradient generation utilities
 */

interface BrandColors {
  primary: string;
  secondary: string;
  gradient: string;
}

// Predefined brand colors for known companies
const COMPANY_BRAND_COLORS: Record<string, BrandColors> = {
  google: {
    primary: '#4285F4',
    secondary: '#34A853',
    gradient: 'linear-gradient(135deg, rgba(66, 133, 244, 0.08) 0%, rgba(52, 168, 83, 0.05) 100%)',
  },
  meta: {
    primary: '#0866FF',
    secondary: '#0A7CFF',
    gradient: 'linear-gradient(135deg, rgba(8, 102, 255, 0.08) 0%, rgba(10, 124, 255, 0.05) 100%)',
  },
  facebook: {
    primary: '#0866FF',
    secondary: '#0A7CFF',
    gradient: 'linear-gradient(135deg, rgba(8, 102, 255, 0.08) 0%, rgba(10, 124, 255, 0.05) 100%)',
  },
  apple: {
    primary: '#000000',
    secondary: '#555555',
    gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(85, 85, 85, 0.02) 100%)',
  },
  microsoft: {
    primary: '#00A4EF',
    secondary: '#7FBA00',
    gradient: 'linear-gradient(135deg, rgba(0, 164, 239, 0.08) 0%, rgba(127, 186, 0, 0.05) 100%)',
  },
  amazon: {
    primary: '#FF9900',
    secondary: '#146EB4',
    gradient: 'linear-gradient(135deg, rgba(255, 153, 0, 0.08) 0%, rgba(20, 110, 180, 0.05) 100%)',
  },
  netflix: {
    primary: '#E50914',
    secondary: '#B20710',
    gradient: 'linear-gradient(135deg, rgba(229, 9, 20, 0.08) 0%, rgba(178, 7, 16, 0.05) 100%)',
  },
  spotify: {
    primary: '#1DB954',
    secondary: '#1ED760',
    gradient: 'linear-gradient(135deg, rgba(29, 185, 84, 0.08) 0%, rgba(30, 215, 96, 0.05) 100%)',
  },
  tesla: {
    primary: '#CC0000',
    secondary: '#E82127',
    gradient: 'linear-gradient(135deg, rgba(204, 0, 0, 0.08) 0%, rgba(232, 33, 39, 0.05) 100%)',
  },
  airbnb: {
    primary: '#FF5A5F',
    secondary: '#FC642D',
    gradient: 'linear-gradient(135deg, rgba(255, 90, 95, 0.08) 0%, rgba(252, 100, 45, 0.05) 100%)',
  },
  uber: {
    primary: '#000000',
    secondary: '#5FB709',
    gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(95, 183, 9, 0.05) 100%)',
  },
  twitter: {
    primary: '#1DA1F2',
    secondary: '#14A1F0',
    gradient: 'linear-gradient(135deg, rgba(29, 161, 242, 0.08) 0%, rgba(20, 161, 240, 0.05) 100%)',
  },
  x: {
    primary: '#000000',
    secondary: '#333333',
    gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(51, 51, 51, 0.02) 100%)',
  },
  linkedin: {
    primary: '#0A66C2',
    secondary: '#004182',
    gradient: 'linear-gradient(135deg, rgba(10, 102, 194, 0.08) 0%, rgba(0, 65, 130, 0.05) 100%)',
  },
  salesforce: {
    primary: '#00A1E0',
    secondary: '#0070D2',
    gradient: 'linear-gradient(135deg, rgba(0, 161, 224, 0.08) 0%, rgba(0, 112, 210, 0.05) 100%)',
  },
  oracle: {
    primary: '#F80000',
    secondary: '#C74634',
    gradient: 'linear-gradient(135deg, rgba(248, 0, 0, 0.08) 0%, rgba(199, 70, 52, 0.05) 100%)',
  },
  ibm: {
    primary: '#0F62FE',
    secondary: '#054ADA',
    gradient: 'linear-gradient(135deg, rgba(15, 98, 254, 0.08) 0%, rgba(5, 74, 218, 0.05) 100%)',
  },
  adobe: {
    primary: '#FF0000',
    secondary: '#ED1C24',
    gradient: 'linear-gradient(135deg, rgba(255, 0, 0, 0.08) 0%, rgba(237, 28, 36, 0.05) 100%)',
  },
  slack: {
    primary: '#4A154B',
    secondary: '#611f69',
    gradient: 'linear-gradient(135deg, rgba(74, 21, 75, 0.08) 0%, rgba(97, 31, 105, 0.05) 100%)',
  },
  stripe: {
    primary: '#635BFF',
    secondary: '#0A2540',
    gradient: 'linear-gradient(135deg, rgba(99, 91, 255, 0.08) 0%, rgba(10, 37, 64, 0.05) 100%)',
  },
  shopify: {
    primary: '#96BF48',
    secondary: '#5E8E3E',
    gradient: 'linear-gradient(135deg, rgba(150, 191, 72, 0.08) 0%, rgba(94, 142, 62, 0.05) 100%)',
  },
  zoom: {
    primary: '#2D8CFF',
    secondary: '#0B5CFF',
    gradient: 'linear-gradient(135deg, rgba(45, 140, 255, 0.08) 0%, rgba(11, 92, 255, 0.05) 100%)',
  },
  notion: {
    primary: '#000000',
    secondary: '#37352F',
    gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(55, 53, 47, 0.02) 100%)',
  },
  figma: {
    primary: '#F24E1E',
    secondary: '#A259FF',
    gradient: 'linear-gradient(135deg, rgba(242, 78, 30, 0.08) 0%, rgba(162, 89, 255, 0.05) 100%)',
  },
  github: {
    primary: '#181717',
    secondary: '#4078c0',
    gradient: 'linear-gradient(135deg, rgba(24, 23, 23, 0.04) 0%, rgba(64, 120, 192, 0.05) 100%)',
  },
  gitlab: {
    primary: '#FC6D26',
    secondary: '#E24329',
    gradient: 'linear-gradient(135deg, rgba(252, 109, 38, 0.08) 0%, rgba(226, 67, 41, 0.05) 100%)',
  },
  dropbox: {
    primary: '#0061FF',
    secondary: '#0052CC',
    gradient: 'linear-gradient(135deg, rgba(0, 97, 255, 0.08) 0%, rgba(0, 82, 204, 0.05) 100%)',
  },
  atlassian: {
    primary: '#0052CC',
    secondary: '#0747A6',
    gradient: 'linear-gradient(135deg, rgba(0, 82, 204, 0.08) 0%, rgba(7, 71, 166, 0.05) 100%)',
  },
  asana: {
    primary: '#F06A6A',
    secondary: '#FC636B',
    gradient: 'linear-gradient(135deg, rgba(240, 106, 106, 0.08) 0%, rgba(252, 99, 107, 0.05) 100%)',
  },
  monday: {
    primary: '#FF3D57',
    secondary: '#FF158A',
    gradient: 'linear-gradient(135deg, rgba(255, 61, 87, 0.08) 0%, rgba(255, 21, 138, 0.05) 100%)',
  },
  trello: {
    primary: '#0079BF',
    secondary: '#026AA7',
    gradient: 'linear-gradient(135deg, rgba(0, 121, 191, 0.08) 0%, rgba(2, 106, 167, 0.05) 100%)',
  },
  pwc: {
    primary: '#D93954',
    secondary: '#E8684A',
    gradient: 'linear-gradient(135deg, rgba(217, 57, 84, 0.08) 0%, rgba(232, 104, 74, 0.05) 100%)',
  },
  deloitte: {
    primary: '#86BC25',
    secondary: '#0DB14B',
    gradient: 'linear-gradient(135deg, rgba(134, 188, 37, 0.08) 0%, rgba(13, 177, 75, 0.05) 100%)',
  },
  ey: {
    primary: '#FFE600',
    secondary: '#2E2E38',
    gradient: 'linear-gradient(135deg, rgba(255, 230, 0, 0.08) 0%, rgba(46, 46, 56, 0.05) 100%)',
  },
  kpmg: {
    primary: '#00338D',
    secondary: '#0077C8',
    gradient: 'linear-gradient(135deg, rgba(0, 51, 141, 0.08) 0%, rgba(0, 119, 200, 0.05) 100%)',
  },
};

// Default fallback gradient
const DEFAULT_GRADIENT: BrandColors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
};

/**
 * Normalize company name for lookup
 */
function normalizeCompanyName(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Get brand colors for a company
 */
export function getBrandColors(companyName: string): BrandColors {
  const normalized = normalizeCompanyName(companyName);
  
  // Try exact match first
  if (COMPANY_BRAND_COLORS[normalized]) {
    return COMPANY_BRAND_COLORS[normalized];
  }
  
  // Try partial match
  for (const [key, colors] of Object.entries(COMPANY_BRAND_COLORS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return colors;
    }
  }
  
  // Return default gradient
  return DEFAULT_GRADIENT;
}

/**
 * Get dark mode variant of gradient
 */
export function getDarkGradient(companyName: string): string {
  const colors = getBrandColors(companyName);
  
  // Extract RGB values from hex
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 99, g: 102, b: 241 };
  };
  
  const primary = hexToRgb(colors.primary);
  const secondary = hexToRgb(colors.secondary);
  
  // Create darker, more subtle gradient for dark mode
  return `linear-gradient(135deg, rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.12) 0%, rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.08) 100%)`;
}

/**
 * Generate CSS custom properties for company branding
 */
export function getBrandingStyles(companyName: string, isDark: boolean): React.CSSProperties {
  const colors = getBrandColors(companyName);
  const gradient = isDark ? getDarkGradient(companyName) : colors.gradient;
  
  return {
    background: gradient,
    '--brand-primary': colors.primary,
    '--brand-secondary': colors.secondary,
  } as React.CSSProperties;
}

