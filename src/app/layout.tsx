import './globals.css';
import { Questrial } from 'next/font/google';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={questrial.className}>
      <body>{children}</body>
    </html>
  );
}
