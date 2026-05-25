'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Services() {
  const { t } = useTranslation();

  const services = [
    { title: t('services.s1Title'), description: t('services.s1Desc') },
    { title: t('services.s2Title'), description: t('services.s2Desc') },
    { title: t('services.s3Title'), description: t('services.s3Desc') },
  ];

  return (
    <section className="px-5 py-15 sm:px-15 sm:py-50 md:px-25 lg:px-40 bg-gray-100 mb-20">
      <div className="max-w-6xl mx-auto text-left mb-12 sm:text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">{t('services.title')}</h1>
        <h3 className="text-gray-600 text-xl">{t('services.subtitle')}</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((service, index) => (
          <Card
            key={index}
            className="shadow-md hover:shadow-lg transition-shadow h-70 sm:py-15 sm:h-auto"
          >
            <CardHeader>
              <CardTitle className="text-2xl pb-5">{service.title}</CardTitle>
              <CardDescription className="text-lg">
                {service.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
