import { redirect } from 'next/navigation';
import Header from '../components/homepage/header';
import Footer from '../components/homepage/footer';
import FAQ from '../components/homepage/faq';
import Hero from '../components/homepage/hero';
import HowItWorks from '../components/homepage/how-it-works';
import MissionSection from '../components/homepage/mission';
import Services from '../components/homepage/services';
import { getCompanyFromToken } from './api/lib/auth';

export default async function HomePage() {
  const company = await getCompanyFromToken();

  if (company) {
    redirect('/company');
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <MissionSection />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
