'use client';

import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Bus, MapPin, Calendar, Users, BarChart } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Dodajte rute',
    description:
      'Kreirajte nove linije sa polazištem i odredištem. Svaka ruta može imati自定义 razdaljinu i prosečno trajanje putovanja.',
  },
  {
    icon: Calendar,
    title: 'Planirajte polaske',
    description:
      'Kreirajte polaske za svaku rutu — izaberite datum, vreme i broj slobodnih sedišta. Jednostavno upravljanje svim polascima.',
  },
  {
    icon: Users,
    title: 'Pregled rezervacija',
    description:
      'Pratite sve rezervacije na jednom mestu. Vidite ko je rezervisao, koliko sedišta i status svake rezervacije.',
  },
  {
    icon: BarChart,
    title: 'Statistika i uvid',
    description:
      'Pregled svih vaših ruta, polazaka i popularnosti. Donosite bolje poslovne odluke na osnovu podataka.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Registrujte firmu',
    description:
      'Popunite formu za registraciju sa nazivom firme, email adresom i lozinkom. Proces je brz i jednostavan.',
  },
  {
    number: '02',
    title: 'Dodajte rute',
    description:
      'Kreirajte rute koje nudite — svaka ruta povezuje dva grada sa informacijama o razdaljini i trajanju.',
  },
  {
    number: '03',
    title: 'Kreirajte polaske',
    description:
      'Za svaku rutu dodajte polaske sa tačnim datumom, vremenom i brojem sedišta. Sprječite preklapanje termina.',
  },
  {
    number: '04',
    title: 'Primitite rezervacije',
    description:
      'Putnici rezervišu sedišta direktno preko platforme. Sve rezervacije automatski možete pregledati u svom panelu.',
  },
];

export default function ForCompaniesPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-25 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-b from-orange-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              Za firme
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              UhvatBus platforma pruža vam alat za upravljanje autobuskim linijama,
              polascima i rezervacijama — sve na jednom mestu.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Kako funkcioniše?
              </h2>
              <p className="text-xl text-gray-600">
                Četiri jednostavna koraka do digitalizacije vašeg poslovanja
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <div className="text-7xl font-bold text-orange-100 absolute -top-4 -left-2">
                    {step.number}
                  </div>
                  <Card className="hover:shadow-lg transition-shadow h-60 pt-12">
                    <CardHeader>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Mogućnosti platforme
              </h2>
              <p className="text-xl text-gray-600">
                Sve što vam treba za upravljanje prevozom
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-orange-500" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Zašto UhvatBus?
              </h2>
              <p className="text-xl text-gray-600">
                Prednosti korišćenja naše platforme
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                'Jednostavno dodavanje i upravljanje ruta',
                'Automatsko praćenje rezervacija',
                'Sprečavanje preklapanja polazaka',
                'Pregled popularnosti linija',
                'Digitalizacija bez dodatnih troškova',
                'Podrška za sve veličine prevoznika',
                'Intuitivan interfejs',
                'Sigurno čuvanje podataka',
                'Pristup statistici u realnom vremenu',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <Bus className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Spremni da se pridružite?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Registrujte svoju firmu i počnite da upravljate linijama već danas.
              Brza registracija, instant pristup panelu.
            </p>
            <a
              href="/?auth=register"
              className="inline-block bg-white text-orange-500 font-bold text-lg px-10 py-4 rounded-full hover:bg-orange-50 transition-colors"
            >
              Registruj firmu
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
