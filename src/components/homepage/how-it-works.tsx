'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    title: '1. Pretraži rutu',
    description:
      'Unesi grad polaska i destinaciju, zatim odaberi datum putovanja.',
  },
  {
    title: '2. Rezerviši sedište',
    description:
      'Odaberi broj sedišta i potvrdi rezervaciju jednostavnim korakom.',
  },
  {
    title: '3. Putuj bez stresa',
    description: 'Dobij svoju digitalnu kartu i spremi se za udoban put.',
  },
];

export default function HowItWorks() {
  return (
    <section className="px-5 py-15 sm:px-15 md:px-20 lg:px-30 bg-gray-50 flex flex-col justify-center gap-5 sm:gap-40 items-center sm:flex-row">
      <div className="">
        <h1 className="text-6xl md:text-6xl font-bold mb-4">
          Kako funkcioniše?
        </h1>
        <h3 className="text-gray-600 text-lg mb-10">
          Rezerviši kartu za samo par minuta uz tri jednostavna koraka.
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
