import Hero from '@/components/homepage/hero';
import Header from '../components/homepage/header';
import Services from '@/components/homepage/services';
import MissionSection from '@/components/homepage/mission';
import Footer from '@/components/homepage/footer';
import HowItWorks from '@/components/homepage/how-it-works';
import FAQ from '@/components/homepage/faq';

const routes = [];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero routes={routes} />
        <Services />
        <MissionSection />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
