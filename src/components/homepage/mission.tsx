'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function MissionSection() {
  const { t } = useTranslation();

  return (
    <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12">
        <div className="w-full h-full">
          <Image
            src="/bus.jpg"
            alt="Bus driving on road"
            width={600}
            height={400}
            className="w-full h-auto rounded-xl shadow-md object-cover"
          />
        </div>

        <div>
          <h2 className="text-6xl font-bold mb-4">{t('mission.title')}</h2>
          <p className="text-gray-700 text-xl leading-relaxed">{t('mission.text')}</p>
        </div>
      </div>
    </section>
  );
}
