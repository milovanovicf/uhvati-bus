'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const services = [
  {
    title: 'Brza Rezervacija',
    description:
      'UhvatiBus pojednostavljuje pretragu autobuskih ruta, čineći lako pronalaženje savršenog putovanja autobusom prema vašim preferencama i putnim potrebama.',
  },
  {
    title: 'Pouzdane Rute',
    description:
      'Uživajte u praktičnosti izbora željenog sedišta pomoću našeg intuitivnog alata za izbor sedišta, obezbeđujući udobno i uživajuće putovanje sa UhvatiBus.',
  },
  {
    title: 'Korisnička Podrška',
    description:
      'Naš tim je uvek tu za vas – bilo da imate pitanje, problem ili predlog.',
  },
];

export default function Services() {
  return (
    <section className="px-5 py-15 sm:px-15 sm:py-50 md:px-25 lg:px-40 bg-gray-100 mb-20">
      <div className="max-w-6xl mx-auto text-left mb-12 sm:text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">Naše Usluge</h1>
        <h3 className="text-gray-600 text-xl">
          Sve što vam je potrebno za udobno i bezbrižno putovanje – na jednom
          mestu.
        </h3>
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
