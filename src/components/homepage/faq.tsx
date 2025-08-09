'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  return (
    <section className="max-w-3xl mx-auto py-15 px-5 sm:py-50">
      <h2 className="text-6xl font-bold mb-6 sm:text-center">
        Najčešće postavljana pitanja
      </h2>
      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl">
            Kako mogu da rezervišem kartu?
          </AccordionTrigger>
          <AccordionContent className="text-base">
            Popunite formular za rezervaciju sa rutom, datumom i brojem sedišta,
            kliknite na “Rezerviši” i vaša karta će biti zabeležena.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl">
            Da li mi je potreban nalog za rezervaciju?
          </AccordionTrigger>
          <AccordionContent className="text-base">
            Nije potreban nalog. Dovoljno je da popunite podatke u formularu i
            izvršite rezervaciju.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl">
            Da li mogu da otkažem ili izmenim rezervaciju?
          </AccordionTrigger>
          <AccordionContent className="text-base">
            Možete nas kontaktirati za otkazivanje ili izmenu rezervacije
            najkasnije 24 sata pre polaska.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-xl">
            Kako i gde mogu da platim kartu?
          </AccordionTrigger>
          <AccordionContent className="text-base">
            Plaćanje se vrši u autobusu. U zavisnosti od prevoznika kartu
            plaćate gotovinom ili karticama.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
