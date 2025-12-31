/**
 * Suppresses tldraw license warnings in the console.
 * This is a temporary workaround while waiting for a license key.
 * 
 * IMPORTANT: This only hides console messages and does not bypass any functionality.
 * You should obtain a proper license key from https://tldraw.dev/get-a-license/trial
 */

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const tldrawLicensePatterns = [
    'No tldraw license key provided',
    'license is required for production',
    'sales@tldraw.com',
    'tldraw license',
    '-------------------------------------------------------------------',
];

function shouldSuppress(args: any[]): boolean {
    if (args.length === 0) return false;

    const firstArg = args[0];
    if (typeof firstArg !== 'string') return false;

    return tldrawLicensePatterns.some(pattern =>
        firstArg.toLowerCase().includes(pattern.toLowerCase())
    );
}

// Only apply suppression in production
if (import.meta.env.PROD) {
    console.log = (...args: any[]) => {
        if (!shouldSuppress(args)) {
            originalConsoleLog.apply(console, args);
        }
    };

    console.warn = (...args: any[]) => {
        if (!shouldSuppress(args)) {
            originalConsoleWarn.apply(console, args);
        }
    };

    console.error = (...args: any[]) => {
        if (!shouldSuppress(args)) {
            originalConsoleError.apply(console, args);
        }
    };
}

export { };
