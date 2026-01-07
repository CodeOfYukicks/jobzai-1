import { useEffect, useState, useCallback, useRef } from 'react';
import './StickyNavbar.css';

interface NavItem {
    label: string;
    href: string;
    hasDropdown?: boolean;
}

interface StickyNavbarProps {
    logo?: React.ReactNode;
    logoText?: string;
    navItems?: NavItem[];
    loginHref?: string;
    ctaText?: string;
    ctaHref?: string;
    onCtaClick?: () => void;
    scrollThreshold?: number;
    enableSlideIn?: boolean;
    darkMode?: boolean;
    className?: string;
}

const defaultNavItems: NavItem[] = [
    { label: 'Products', href: '#products', hasDropdown: true },
    { label: 'AI', href: '#ai' },
    { label: 'Blog', href: '#blog' },
    { label: 'Pricing', href: '#pricing' },
];

// Default logo SVG (cube icon from the uploaded image)
const DefaultLogo = () => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
        />
        <path
            d="M16 12L22 8.5M16 12L10 8.5M16 12V19M22 15.5V22L16 26M10 15.5V22L16 26"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export function StickyNavbar({
    logo,
    logoText = 'Cubbbe',
    navItems = defaultNavItems,
    loginHref = '/login',
    ctaText = 'Get Started',
    ctaHref = '/signup',
    onCtaClick,
    scrollThreshold = 12,
    enableSlideIn = true,
    darkMode = false,
    className = '',
}: StickyNavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [hasSlideIn, setHasSlideIn] = useState(false);
    const hasScrolledOnce = useRef(false);

    const handleScroll = useCallback(() => {
        const scrollY = window.scrollY;
        const shouldBeScrolled = scrollY > scrollThreshold;

        if (shouldBeScrolled !== isScrolled) {
            setIsScrolled(shouldBeScrolled);

            // Trigger slide-in animation only on first scroll
            if (shouldBeScrolled && enableSlideIn && !hasScrolledOnce.current) {
                hasScrolledOnce.current = true;
                setHasSlideIn(true);
                // Remove slide-in class after animation completes
                setTimeout(() => setHasSlideIn(false), 400);
            }
        }
    }, [isScrolled, scrollThreshold, enableSlideIn]);

    useEffect(() => {
        // Check initial scroll position
        handleScroll();

        // Use passive listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const navbarClasses = [
        'sticky-navbar',
        isScrolled ? 'scrolled' : '',
        hasSlideIn ? 'slide-in' : '',
        darkMode ? 'dark-mode' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <nav className={navbarClasses} role="navigation" aria-label="Main navigation">
            {/* Logo */}
            <a href="/" className="navbar-logo" aria-label="Home">
                <div className="navbar-logo-icon">
                    {logo || <DefaultLogo />}
                </div>
                {logoText && <span className="navbar-logo-text">{logoText}</span>}
            </a>

            {/* Navigation Links */}
            <ul className="navbar-nav">
                {navItems.map((item) => (
                    <li key={item.label} className="navbar-nav-item">
                        <a
                            href={item.href}
                            className={`navbar-nav-link ${item.hasDropdown ? 'has-dropdown' : ''}`}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>

            {/* Actions */}
            <div className="navbar-actions">
                <a href={loginHref} className="navbar-login">
                    Log in
                </a>
                {onCtaClick ? (
                    <button className="navbar-cta" onClick={onCtaClick}>
                        {ctaText}
                    </button>
                ) : (
                    <a href={ctaHref} className="navbar-cta">
                        {ctaText}
                    </a>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    className="navbar-mobile-toggle"
                    aria-label="Toggle menu"
                    aria-expanded="false"
                >
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}

export default StickyNavbar;
