'use client';

import Image from 'next/image';
import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { number: '50+', label: t('aboutUs.stat1Label') },
    { number: '100+', label: t('aboutUs.stat2Label') },
    { number: '10.000+', label: t('aboutUs.stat3Label') },
    { number: '99%', label: t('aboutUs.stat4Label') },
  ];

  const values = [
    { title: t('aboutUs.v1Title'), description: t('aboutUs.v1Desc') },
    { title: t('aboutUs.v2Title'), description: t('aboutUs.v2Desc') },
    { title: t('aboutUs.v3Title'), description: t('aboutUs.v3Desc') },
  ];

  const team = [
    { name: t('aboutUs.m1Name'), role: t('aboutUs.m1Role'), description: t('aboutUs.m1Desc') },
    { name: t('aboutUs.m2Name'), role: t('aboutUs.m2Role'), description: t('aboutUs.m2Desc') },
    { name: t('aboutUs.m3Name'), role: t('aboutUs.m3Role'), description: t('aboutUs.m3Desc') },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-25 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            {t('aboutUs.heroTitle')}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            {t('aboutUs.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              {t('aboutUs.storyTitle')}
            </h2>
            <div className="space-y-5 text-lg text-gray-700 leading-relaxed">
              <p>{t('aboutUs.storyP1')}</p>
              <p>{t('aboutUs.storyP2')}</p>
              <p>{t('aboutUs.storyP3')}</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/about/story.jpg"
              alt={t('aboutUs.storyImageAlt')}
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
          <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/about/mission.jpg"
              alt={t('aboutUs.missionImageAlt')}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              {t('aboutUs.missionTitle')}
            </h2>
            <div className="space-y-5 text-lg text-gray-700 leading-relaxed">
              <p>{t('aboutUs.missionP1')}</p>
              <p>{t('aboutUs.missionP2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              {t('aboutUs.valuesTitle')}
            </h2>
            <p className="text-xl text-gray-600">{t('aboutUs.valuesSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
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
              {t('aboutUs.teamTitle')}
            </h2>
            <p className="text-xl text-gray-600">{t('aboutUs.teamSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center"
              >
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
                <p className="text-gray-600 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            {t('aboutUs.ctaTitle')}
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            {t('aboutUs.ctaSubtitle')}
          </p>
          <a
            href="/"
            className="inline-block bg-white text-orange-500 font-bold text-lg px-10 py-4 rounded-full hover:bg-orange-50 transition-colors"
          >
            {t('aboutUs.ctaBtn')}
          </a>
        </div>
      </section>
      </div>
      <Footer />
    </>
  );
}
