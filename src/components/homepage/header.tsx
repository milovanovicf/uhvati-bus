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

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between sm:px-50 sm:py-10">
      <div className="flex items-center gap-4">
        <img src="/logo/logo-big.png" alt="Logo" className="h-10" />
      </div>

      {/* Desktop Menu */}
      <NavigationMenu className="hidden md:flex gap-4 items-center">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/about" className="text-md">
              O nama
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink href="/for-companies" className="text-md">
              Za firme
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-md bg-transparent hover:bg-transparent">
              Prijava
            </NavigationMenuTrigger>
            <NavigationMenuContent className="bg-white shadow-md rounded p-2">
              <ul className="flex flex-col gap-2 min-w-[160px]">
                <li>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    Uloguj firmu
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    Registruj firmu
                  </button>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </NavigationMenuList>
      </NavigationMenu>

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
          ${
            isOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-1 opacity-0 pointer-events-none'
          }
        `}
      >
        <ul className="flex flex-col p-4 gap-2">
          <li>
            <a href="/about" className="block py-2 text-md">
              O nama
            </a>
          </li>
          <li>
            <a href="/about" className="block py-2 text-md">
              Za Firme
            </a>
          </li>
          <li>
            <Button
              variant="outline"
              className="w-full bg-chart-4 text-white text-md"
            >
              Uloguj se
            </Button>
          </li>
          <li>
            <Button className="w-full text-md">Prijavi se</Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
