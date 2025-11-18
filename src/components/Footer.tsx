import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail } from 'lucide-react';
import FirebaseImage from './FirebaseImage';

export default function Footer() {
  return (
    <footer className="bg-[#2A2831] text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <Link to="/" className="inline-block hover:text-white transition-colors">
              <FirebaseImage 
                path="images/logo.png" 
                alt="Jobz.ai Logo" 
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-gray-100 dark:text-gray-200 text-sm">
              Revolutionizing job search with AI-powered personalized applications.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-100 dark:text-gray-200 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-100 dark:text-gray-200 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-100 dark:text-gray-200 hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-100 dark:text-gray-200 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-100 dark:text-gray-200 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-100 dark:text-gray-200 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
            <p className="text-gray-100 dark:text-gray-200 text-sm mb-4">
              Subscribe to our newsletter for the latest updates and tips.
            </p>
            <form className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-[hsl(var(--primary))] font-semibold rounded-r hover:bg-white/90 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-100 text-sm">
              ┬® {new Date().getFullYear()} Jobz AI. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6">
                <li>
                  <Link to="/privacy" className="text-gray-100 hover:text-white text-sm transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-100 hover:text-white text-sm transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-gray-100 hover:text-white text-sm transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
