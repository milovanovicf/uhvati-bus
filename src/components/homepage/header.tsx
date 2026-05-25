'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import AuthModal from '../auth/AuthModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { language, setLanguage, t } = useTranslation();

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const langToggle = (
    <button
      onClick={() => setLanguage(language === 'sr' ? 'en' : 'sr')}
      className="text-sm font-medium px-2.5 py-1 border rounded hover:bg-gray-50 transition-colors"
      title={language === 'sr' ? 'Switch to English' : 'Prebaci na srpski'}
    >
      {language === 'sr' ? 'EN' : 'SR'}
    </button>
  );

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between sm:px-50 sm:py-10">
      <a className="flex items-center gap-4" href="/">
        <img src="/logo/logo-big.png" alt="Logo" className="h-10" />
      </a>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-3">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/o-nama" className="text-md">
                {t('nav.aboutUs')}
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink href="/za-firme" className="text-md">
                {t('nav.forCompanies')}
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-md bg-transparent hover:bg-transparent">
                {t('nav.auth')}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="bg-white shadow-md rounded p-2">
                <ul className="flex flex-col gap-2 min-w-[160px]">
                  <li>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm cursor-pointer"
                    >
                      {t('nav.loginCompany')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm cursor-pointer"
                    >
                      {t('nav.registerCompany')}
                    </button>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {langToggle}
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
