'use client';

import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Mail, Phone } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-muted px-5 py-15 text-md text-muted-foreground sm:px-15 md:px-20 lg:px-30">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <h4 className="font-semibold text-foreground text-lg mb-2">
            {t('footer.aboutTitle')}
          </h4>
          <p className="text-md leading-relaxed">{t('footer.aboutText')}</p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground text-lg mb-2">
            {t('footer.contactTitle')}
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> +381 64 123 4567
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> kontakt@uhvatibus.rs
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground text-lg mb-2">
            {t('footer.socialTitle')}
          </h4>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="hover:text-foreground">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-foreground">
              <Facebook className="w-6 h-6" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-foreground text-lg mb-2">
            {t('footer.newsletterTitle')}
          </h4>
          <form className="flex items-center space-x-2 md:flex-col md:items-baseline md:space-y-3">
            <Input
              type="email"
              placeholder={t('footer.newsletterPlaceholder')}
              className="flex-1 text-md md:flex-auto md:w-60"
            />
            <Button type="submit" className="text-md">
              {t('footer.newsletterBtn')}
            </Button>
          </form>
        </div>
      </div>

      <Separator className="my-6" />

      <p className="text-md text-center">
        {t('footer.copyright', { year: String(new Date().getFullYear()) })}
      </p>
    </footer>
  );
}
