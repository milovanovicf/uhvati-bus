import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';
import RoutesResults from '@/components/routes/RoutesResults';
import { getCompanyFromToken } from '@/app/api/lib/auth';
import { prisma } from '@/app/utils/db';
import { slugToCity, slugify } from '@/lib/slug';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://uhvati-bus.vercel.app'

interface Params {
  from: string;
  to: string;
  date: string;
}

interface Props {
  params: Promise<Params>;
  searchParams: Promise<{ povratak?: string }>;
}

async function resolveCities(fromSlug: string, toSlug: string) {
  const cities = await prisma.city.findMany({ select: { id: true, name: true } });
  const fromCity = slugToCity(fromSlug, cities);
  const toCity = slugToCity(toSlug, cities);
  return { fromCity, toCity };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { from, to } = await params;
  const { fromCity, toCity } = await resolveCities(from, to);

  if (!fromCity || !toCity) {
    return { title: 'UhvatiBus' };
  }

  const title = `Autobus ${fromCity.name} - ${toCity.name} | UhvatiBus`;
  const description = `Kupite kartu za autobus od ${fromCity.name} do ${toCity.name}. Pronađite slobodna mesta i rezervišite online brzo i lako.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/rute/${slugify(fromCity.name)}/${slugify(toCity.name)}`,
    },
  };
}

export default async function RutePage({ params, searchParams }: Props) {
  const company = await getCompanyFromToken();
  if (company) redirect('/company');

  const { from, to, date } = await params;
  const { povratak } = await searchParams;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const { fromCity, toCity } = await resolveCities(from, to);
  if (!fromCity || !toCity) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Početna',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Autobus ${fromCity.name} - ${toCity.name}`,
        item: `${siteUrl}/rute/${slugify(fromCity.name)}/${slugify(toCity.name)}`,
      },
    ],
  };

  const routeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Autobus ${fromCity.name} - ${toCity.name}`,
    description: `Rezervacija autobuskih karata od ${fromCity.name} do ${toCity.name} online.`,
    provider: {
      '@type': 'Organization',
      name: 'UhvatiBus',
      url: siteUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Serbia',
    },
    serviceType: 'Bus Transportation',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(routeSchema) }}
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Autobus {fromCity.name} – {toCity.name}
            </h1>
            <p className="text-gray-600">
              Dostupne polazne linije za odabrani datum
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="ml-2 text-gray-600">Učitavanje...</span>
              </div>
            }
          >
            <RoutesResults
              fromId={fromCity.id.toString()}
              toId={toCity.id.toString()}
              date={date}
              returnDate={povratak}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
