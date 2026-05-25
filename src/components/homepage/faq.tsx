'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function FAQ() {
  const { t } = useTranslation();

  const items = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];

  return (
    <section className="max-w-3xl mx-auto py-15 px-5 sm:py-50">
      <h2 className="text-6xl font-bold mb-6 sm:text-center">
        {t('faq.title')}
      </h2>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i + 1}`}>
            <AccordionTrigger className="text-xl">{item.q}</AccordionTrigger>
            <AccordionContent className="text-base">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
