'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '../auth/AuthModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
    setDropdownOpen(false);
  };

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between sm:px-50 sm:py-10">
      <a className="flex items-center gap-4" href="/">
        <img src="/logo/logo-big.png" alt="Logo" className="h-10" />
      </a>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-5">
        <a href="/o-nama" className="text-md hover:text-gray-600 transition-colors">
          {t('nav.aboutUs')}
        </a>
        <a href="/za-firme" className="text-md hover:text-gray-600 transition-colors">
          {t('nav.forCompanies')}
        </a>

        {/* Auth dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-1 text-md hover:text-gray-600 transition-colors"
            onClick={() => setDropdownOpen((o) => !o)}
          >
            {t('nav.auth')}
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border rounded-md shadow-md py-1 min-w-[160px] z-50">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {t('nav.loginCompany')}
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {t('nav.registerCompany')}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
          className="text-sm font-medium px-2.5 py-1 border rounded hover:bg-gray-50 transition-colors"
          title={language === 'sr' ? 'Switch to English' : 'Prebaci na srpski'}
        >
          {language === 'sr' ? 'EN' : 'SR'}
        </button>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
      />

      {/* Hamburger Icon */}
      <button
        className="md:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Dropdown Menu */}
      <div
        className={`absolute top-18 left-0 w-full bg-white border-t shadow-md transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0 pointer-events-none'}`}
      >
        <ul className="flex flex-col p-4 gap-2">
          <li>
            <a href="/o-nama" className="block py-2 text-md">
              {t('nav.aboutUs')}
            </a>
          </li>
          <li>
            <a href="/za-firme" className="block py-2 text-md">
              {t('nav.forCompanies')}
            </a>
          </li>
          <li>
            <Button
              variant="outline"
              className="w-full bg-chart-4 text-white text-md"
              onClick={() => { setIsOpen(false); openAuthModal('login'); }}
            >
              {t('nav.loginBtn')}
            </Button>
          </li>
          <li>
            <Button
              className="w-full text-md"
              onClick={() => { setIsOpen(false); openAuthModal('register'); }}
            >
              {t('nav.registerBtn')}
            </Button>
          </li>
          <li>
            <button
              onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
              className="w-full text-left py-2 text-sm text-gray-500"
            >
              {language === 'sr' ? '🌐 English' : '🌐 Srpski'}
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
