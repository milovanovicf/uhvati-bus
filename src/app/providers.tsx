'use client';

import { LanguageProvider, Language } from '@/lib/i18n/LanguageContext';

export default function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      {children}
    </LanguageProvider>
  );
}
