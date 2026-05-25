'use client';

import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Bus,
  MapPin,
  Calendar,
  Users,
  BarChart,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ForCompaniesPage() {
  const { t } = useTranslation();

  const steps = [
    {
      number: '01',
      title: t('forCompanies.s1Title'),
      description: t('forCompanies.s1Desc'),
    },
    {
      number: '02',
      title: t('forCompanies.s2Title'),
      description: t('forCompanies.s2Desc'),
    },
    {
      number: '03',
      title: t('forCompanies.s3Title'),
      description: t('forCompanies.s3Desc'),
    },
    {
      number: '04',
      title: t('forCompanies.s4Title'),
      description: t('forCompanies.s4Desc'),
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: t('forCompanies.f1Title'),
      description: t('forCompanies.f1Desc'),
    },
    {
      icon: Calendar,
      title: t('forCompanies.f2Title'),
      description: t('forCompanies.f2Desc'),
    },
    {
      icon: Users,
      title: t('forCompanies.f3Title'),
      description: t('forCompanies.f3Desc'),
    },
    {
      icon: BarChart,
      title: t('forCompanies.f4Title'),
      description: t('forCompanies.f4Desc'),
    },
  ];

  const benefits = [
    t('forCompanies.b1'),
    t('forCompanies.b2'),
    t('forCompanies.b3'),
    t('forCompanies.b4'),
    t('forCompanies.b5'),
    t('forCompanies.b6'),
    t('forCompanies.b7'),
    t('forCompanies.b8'),
    t('forCompanies.b9'),
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-25 px-5 sm:px-15 md:px-25 lg:px-40 bg-gradient-to-b from-orange-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              {t('forCompanies.heroTitle')}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t('forCompanies.heroSubtitle')}
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-15 px-5 sm:px-15 md:px-25 lg:px-40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                {t('forCompanies.howTitle')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('forCompanies.howSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <div className="text-7xl font-bold text-orange-100 absolute -top-4 -left-2">
                    {step.number}
                  </div>
                  <Card className="hover:shadow-lg transition-shadow min-h-80 pt-12">
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
                {t('forCompanies.featuresTitle')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('forCompanies.featuresSubtitle')}
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
                {t('forCompanies.benefitsTitle')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('forCompanies.benefitsSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {benefits.map((benefit) => (
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
              {t('forCompanies.ctaTitle')}
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              {t('forCompanies.ctaSubtitle')}
            </p>
            <a
              href="/?auth=register"
              className="inline-block bg-white text-orange-500 font-bold text-lg px-10 py-4 rounded-full hover:bg-orange-50 transition-colors"
            >
              {t('forCompanies.ctaBtn')}
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
