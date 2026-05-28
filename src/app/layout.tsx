import './globals.css';
import { Questrial } from 'next/font/google';
import { cookies } from 'next/headers';
import Providers from './providers';
import type { Language } from '@/lib/i18n/LanguageContext';

const questrial = Questrial({
  weight: '400',
  subsets: ['latin'],
});

export const metadata = {
  title: 'UhvatiBus | Brzo i lako do svoje destinacije',
  description: 'Brzo i lako do svoje destinacije',
  icons: {
    icon: '/logo/logo-small.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('language')?.value;
  const initialLanguage: Language = langCookie === 'en' ? 'en' : 'sr';

  return (
    <html lang="sr" className={questrial.className}>
      <body>
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
