'use client';

import Image from 'next/image';
import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';

const team = [
  {
    name: 'Stefan Petrović',
    role: 'Osnivač i CEO',
    description:
      'Sa preko 10 godina iskustva u transportnoj industriji, Stefan je započeo UhvatBus sa vizijom da digitalizuje autobuski prevoz u regionu.',
  },
  {
    name: 'Marija Jovanović',
    role: 'Glavni tehnički direktor',
    description:
      'Marija vodi razvoj platforme, osiguravajući pouzdan i siguran sistem za sve korisnike.',
  },
  {
    name: 'Nikola Marković',
    role: 'Direktor operacija',
    description:
      'Nikola koordinira saradnju sa prevoznicima i brine se da svaki voz stigne na vreme.',
  },
];

const stats = [
  { number: '50+', label: 'Gradova' },
  { number: '100+', label: 'Prevoznika' },
  { number: '10.000+', label: 'Rezervacija mesečno' },
  { number: '99%', label: 'Zadovoljnih korisnika' },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-25 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            O nama
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            UhvatBus je platforma koja povezuje putnike sa autobuskih prevoznicima,
            čineći rezervaciju karata brzom, jednostavnom i pouzdanom.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Naša priča
            </h2>
            <div className="space-y-5 text-lg text-gray-700 leading-relaxed">
              <p>
                UhvatBus je nastao iz jednostavne ideje — zašto rezervacija
                autobuske karte mora biti komplikovana? Godine 2024. trio
                entuzijasta odlučio je da promeni način na koji ljudi putuju
                autobusom kroz Srbiju i region.
              </p>
              <p>
                Krenuli smo sa samo nekoliko linija i danas smo izrastli u
                platformu koja povezuje hiljade putnika sa desetinama
                pouzdanih prevoznika. Naš cilj nije samo da prodamo kartu —
                želimo da svako putovanje bude iskustvo koje se pamti.
              </p>
              <p>
                Bilo da putujete na poslovni sastanak, porodičnu posetu ili
                avanturu, UhvatBus je vaš pouzdani saputnik na putu.
              </p>
            </div>
          </div>

          {/* Image placeholder - add your image to /public/about/story.jpg */}
          <div className="order-1 lg:order-2 relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/about/story.jpg"
              alt="Naša priča"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40 bg-orange-500 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-6xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg sm:text-xl text-orange-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image placeholder - add your image to /public/about/mission.jpg */}
          <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/about/mission.jpg"
              alt="Naša misija"
              fill
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Naša misija
            </h2>
            <div className="space-y-5 text-lg text-gray-700 leading-relaxed">
              <p>
                Naša misija je da modernizujemo i pojednostavimo međugradski
                prevoz. Verujemo da svako zaslužuje brz, pouzdan i pristupačan
                način da stigne do svog cilja.
              </p>
              <p>
                Kroz inovativnu tehnologiju, korisnički orijentisan pristup i
                saradnju sa pouzdanim prevoznicima, činimo putovanje
                jednostavnim iskustvom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Naše vrednosti
            </h2>
            <p className="text-xl text-gray-600">
              Ono što nas pokreće svakog dana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Pouzdanost',
                description:
                  'Saradnjom samo sa proverenim prevoznicima osiguravamo da vaše putovanje protekne bez problema.',
              },
              {
                title: 'Jednostavnost',
                description:
                  'Naša platforma je dizajnirana da rezervacija bude brza i intuitivna — bez skrivenih koraka.',
              },
              {
                title: 'Transparetnost',
                description:
                  'Jasne cene, tačne informacije o polascima i real-time dostupnost sedišta.',
              },
            ].map((value) => (
              <div
                key={value.title}
                className="p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Upoznajte naš tim
            </h2>
            <p className="text-xl text-gray-600">
              Ljudi koji stoje iza UhvatBus platforme
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center"
              >
                {/* Team image placeholder - add images to /public/about/team/*.jpg */}
                <div className="relative w-32 h-32 mx-auto mb-6 bg-gray-200 rounded-full overflow-hidden">
                  <Image
                    src={`/about/team/${member.name.split(' ')[0].toLowerCase()}.jpg`}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-orange-500 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Spremni za putovanje?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Pridružite se hiljadama zadovoljnih korisnika i rezervišite svoju kartu danas.
          </p>
          <a
            href="/"
            className="inline-block bg-white text-orange-500 font-bold text-lg px-10 py-4 rounded-full hover:bg-orange-50 transition-colors"
          >
            Rezerviši kartu
          </a>
        </div>
      </section>
      </div>
      <Footer />
    </>
  );
}
