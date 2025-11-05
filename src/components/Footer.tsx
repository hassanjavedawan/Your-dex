import React from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { FaGithub, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#01221f] border-t border-[#65ffe9]/10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#65ffe9]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#65ffe9]/5 rounded-full blur-3xl"></div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-[#65ffe9] leading-tight">
                Your Dex
              </h2>
            </div>
            <p className="text-sm text-white/70 mb-6">First limitless DEX</p>
            <div className="flex space-x-4 ">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#65ffe9]/70 hover:text-[#65ffe9] transition-colors"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#65ffe9]/70 hover:text-[#65ffe9] transition-colors"
              >
                <FaTelegram className="w-5 h-5" />
              </a>
              {/* 
              <a
                href="#"
                className="text-[#65ffe9]/70 hover:text-[#65ffe9] transition-colors"
              >
                <FaGithub className="w-5 h-5" />
              </a> */}
            </div>
          </div>

          {/* Links sections */}
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>Documentation</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>About</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>Team</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>Contact</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>Blog</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>FAQ</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-[#65ffe9] transition-colors flex items-center gap-1 group"
                >
                  <span>Support</span>
                  <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="mt-12 pt-6 border-t border-[#65ffe9]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-xs text-white/50">
            © {currentYear} Your Dex. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a
              href="#"
              className="text-xs text-white/50 hover:text-[#65ffe9] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs text-white/50 hover:text-[#65ffe9] transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-xs text-white/50 hover:text-[#65ffe9] transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
