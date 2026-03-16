import React from 'react';
import StarField from './StarField';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import DemoSection from './DemoSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import CTASection from './CTASection';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div data-testid="landing-page" className="min-h-screen bg-orbit-black text-gray-100 overflow-x-hidden">
      <StarField />
      <LandingNav />
      <div className="relative z-10">
        <HeroSection />
        <div id="demo">
          <DemoSection />
        </div>
        <FeaturesSection />
        <div id="pricing">
          <PricingSection />
        </div>
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
