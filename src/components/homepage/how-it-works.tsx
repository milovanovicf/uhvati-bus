'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { title: t('howItWorks.step1Title'), description: t('howItWorks.step1Desc') },
    { title: t('howItWorks.step2Title'), description: t('howItWorks.step2Desc') },
    { title: t('howItWorks.step3Title'), description: t('howItWorks.step3Desc') },
  ];

  return (
    <section className="px-5 py-15 sm:px-15 md:px-20 lg:px-30 bg-gray-50 flex flex-col justify-center gap-5 sm:gap-40 items-center sm:flex-row">
      <div className="">
        <h1 className="text-6xl md:text-6xl font-bold mb-4">
          {t('howItWorks.title')}
        </h1>
        <h3 className="text-gray-600 text-lg mb-10">
          {t('howItWorks.subtitle')}
        </h3>
      </div>
      <div className="flex flex-col gap-5">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="text-xl">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
