'use client';

import BookingForm from './booking-form';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <div
      className="relative flex items-center justify-end min-h-screen bg-cover bg-center py-15 px-5 sm:px-15 md:pl-25 md:pr-10 md:py-10 lg:pl-40 lg:pr-16"
      style={{ backgroundImage: "url('/hero-background.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/60 md:hidden" />

      <div className="relative z-10 flex gap-4 flex-col w-full sm:w-auto">
        <h1 className="text-4xl xl:text-6xl 2xl:text-8xl text-white max-w-[270px] xl:max-w-[460px] 2xl:max-w-[750px]">
          {t('hero.title')}
        </h1>
        <h3 className="text-xl text-gray-400">{t('hero.subtitle')}</h3>
        <BookingForm />
      </div>
    </div>
  );
}
