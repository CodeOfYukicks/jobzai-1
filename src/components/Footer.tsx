import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

// Logo URL
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/jobzai.firebasestorage.app/o/images%2Fjobzai-logo-footer.png?alt=media';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Mobile Footer */}
      <div className="md:hidden px-6 py-10">
        {/* Logo + Social - Centered */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-6">
            <img
              src={LOGO_URL}
              alt="Cubbbe"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class="text-xl font-bold text-gray-900">Cubbbe</span>';
              }}
            />
          </Link>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/cubbbejob/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Links - Single Row Each Category */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <Link to="/signup" className="text-sm text-gray-600 hover:text-gray-900">Get Started</Link>
            <Link to="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link>
            <a href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 mt-6 pt-6 text-center">
          <p className="text-xs text-gray-400 mb-2">
            © {new Date().getFullYear()} Cubbbe. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link>
            <span className="text-gray-300">·</span>
            <Link to="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms</Link>
            <span className="text-gray-300">·</span>
            <Link to="/cookies" className="text-xs text-gray-400 hover:text-gray-600">Cookies</Link>
          </div>
        </div>
      </div>

      {/* Desktop Footer - Original Layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="col-span-5 space-y-6">
            <Link to="/">
              <img
                src={LOGO_URL}
                alt="Cubbbe"
                className="h-28 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<span class="text-2xl font-bold text-gray-900">Cubbbe</span>';
                }}
              />
            </Link>

            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/cubbbejob/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="/#features" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/signup" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-3">
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Cubbbe. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
