import { Breadcrumb } from '@/components/ui/Breadcrumb';
import Hero from './components/Hero';
import LatestContent from './components/LatestContent';
import OpenSourceBanner from './components/OpenSourceBanner';
import ToolsShowcase from './components/ToolsShowcase';
import './styles.css';

export default function Home() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Accueil', current: true }]} hidden appName="#dataESR" />
      <Hero />
      <ToolsShowcase />
      <OpenSourceBanner />
      <LatestContent />
    </div>
  );
}
