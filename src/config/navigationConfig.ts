import {
    LayoutDashboard,
    ScrollText,
    Lightbulb,
    User,
    CreditCard,
    FileSearch,
    LayoutGrid,
    Briefcase,
    Calendar,
    Clock,
    FileEdit,
    Mic,
    Target,
    Home,
    Settings,
    type LucideIcon
} from 'lucide-react';

// Navigation item type
export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

// Navigation groups matching desktop sidebar - SINGLE SOURCE OF TRUTH
export const navigationGroups = {
    apply: [
        { name: 'Job Board', href: '/jobs', icon: LayoutGrid },
        { name: 'AutoPilot', href: '/campaigns', icon: ScrollText },
        { name: 'Campaigns', href: '/campaigns-auto', icon: Target },
        { name: 'Resume Lab', href: '/cv-analysis', icon: FileSearch },
    ] as NavItem[],
    track: [
        { name: 'Application Tracking', href: '/applications', icon: Briefcase },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
    ] as NavItem[],
    prepare: [
        { name: 'Interview Hub', href: '/upcoming-interviews', icon: Clock },
        { name: 'Mock Interview', href: '/mock-interview', icon: Mic },
        { name: 'Document Manager', href: '/resume-builder', icon: FileEdit },
    ] as NavItem[],
    improve: [
        { name: 'Professional Profile', href: '/professional-profile', icon: User },
        { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ] as NavItem[],
    account: [
        { name: 'Profile', href: '/professional-profile', icon: User },
        { name: 'Billing', href: '/billing', icon: CreditCard },
        { name: 'Settings', href: '/settings', icon: Settings },
    ] as NavItem[],
};

// Hub link (standalone)
export const hubLink: NavItem = { name: 'Hub', href: '/hub', icon: Home };

// Mobile bottom tab bar configuration
// Each tab represents an INTENT, tapping goes to the primary page for that intent
export const mobileTabBar = [
    { name: 'Hub', href: '/hub', icon: Home },
    { name: 'Apply', href: '/cv-analysis', icon: FileSearch }, // Primary Apply action
    { name: 'Track', href: '/applications', icon: Briefcase }, // Primary Track action
    { name: 'Prepare', href: '/upcoming-interviews', icon: Clock }, // Primary Prepare action
    // "Menu" is handled separately as it opens a modal, not a route
] as const;

// Helper to get all navigation items flattened (for route title resolution)
export const getAllNavItems = (): NavItem[] => [
    hubLink,
    ...navigationGroups.apply,
    ...navigationGroups.track,
    ...navigationGroups.prepare,
    ...navigationGroups.improve,
    ...navigationGroups.account,
];

// Paths that should highlight the "Apply" tab
export const applyPaths = navigationGroups.apply.map(item => item.href);

// Paths that should highlight the "Track" tab  
export const trackPaths = navigationGroups.track.map(item => item.href);

// Paths that should highlight the "Prepare" tab
export const preparePaths = navigationGroups.prepare.map(item => item.href);

// Paths that should highlight the "Menu" (more) tab (improve + account)
export const menuPaths = [
    ...navigationGroups.improve.map(item => item.href),
    ...navigationGroups.account.map(item => item.href),
];
