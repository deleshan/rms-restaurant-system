import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center md:justify-start">
              <span className="mr-2">🍽️</span>
              RMS Admin
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              AI-Enhanced Restaurant Management System
            </p>
            <p className="mt-4 text-sm text-gray-500">
              &copy; {currentYear} All rights reserved.
            </p>
          </div>

          {/* Center: Quick Links */}
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin/dashboard"
                  className="text-sm text-gray-600 hover:text-indigo-600 transition"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/support"
                  className="text-sm text-gray-600 hover:text-indigo-600 transition"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/privacy"
                  className="text-sm text-gray-600 hover:text-indigo-600 transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/terms"
                  className="text-sm text-gray-600 hover:text-indigo-600 transition"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Right: Social & Contact */}
          <div className="text-center md:text-right">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Connect With Us</h4>
            <div className="flex justify-center md:justify-end space-x-6 mb-6">
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition"
              >
                <Github className="w-6 h-6" />
              </a>
              <a
                href="https://twitter.com/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="https://linkedin.com/company/yourcompany"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 transition"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href="mailto:support@rms.com"
                className="text-gray-600 hover:text-indigo-600 transition"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Made with ❤️ for small & medium restaurants
            </p>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Version 1.0.0 • Built with React, Tailwind CSS & Redux Toolkit</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;