import ClarityDemo from '../components/home/ClarityDemo';
import ClosingCta from '../components/home/ClosingCta';
import HomeFaq from '../components/home/HomeFaq';
import HomeHero from '../components/home/HomeHero';
import PatternSection from '../components/home/PatternSection';
import PracticeJourney from '../components/home/PracticeJourney';
import ProductPreview from '../components/home/ProductPreview';
import SentenceAnatomy from '../components/home/SentenceAnatomy';
import TopicIndex from '../components/home/TopicIndex';

/**
 * "The English Atelier": the homepage tells one story, from confusion to clarity. Every claim on it
 * describes a feature that exists today; the examples are hand-written and labelled as such.
 */
const HomePage = () => (
  <div className="bg-paper">
    <HomeHero />
    <ClarityDemo />
    <PatternSection />
    <SentenceAnatomy />
    <PracticeJourney />
    <TopicIndex />
    <ProductPreview />
    <HomeFaq />
    <ClosingCta />
  </div>
);

export default HomePage;
