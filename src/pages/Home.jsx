import React from 'react';
import Hero from '../components/sections/Hero';
import WhyChooseUs from '../components/sections/WhyChooseUs';
import LevelSelector from '../components/sections/LevelSelector';
import FeaturedCourses from '../components/sections/FeaturedCourses';
import AboutSection from '../components/sections/AboutSection';
import PlacementSection from '../components/sections/PlacementSection';
import Testimonials from '../components/sections/Testimonials';
import SectionHeading from '../components/common/SectionHeading';
import FAQAccordion from '../components/common/FAQAccordion';
import CTASection from '../components/sections/CTASection';
import ScrollReveal from '../components/common/ScrollReveal';
import { faqs } from '../data/faqs';

const Home = ({ onOpenApplyModal }) => {
  return (
    <div>
      {/* Hero Section */}
      <Hero onOpenApplyModal={onOpenApplyModal} />

      {/* Why Choose Us Grid */}
      <ScrollReveal>
        <WhyChooseUs />
      </ScrollReveal>

      {/* Interactive Level Selector */}
      <ScrollReveal>
        <LevelSelector onOpenApplyModal={onOpenApplyModal} />
      </ScrollReveal>

      {/* Featured Courses Showcase */}
      <ScrollReveal>
        <FeaturedCourses onApply={onOpenApplyModal} />
      </ScrollReveal>

      {/* Institute Story & Stats */}
      <ScrollReveal>
        <AboutSection />
      </ScrollReveal>

      {/* Dedicated Placement & Career Opportunities */}
      <ScrollReveal>
        <PlacementSection />
      </ScrollReveal>

      {/* Testimonials */}
      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>

      {/* Frequently Asked Questions */}
      <ScrollReveal>
        <section className="py-16 sm:py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              badge="Have Questions?"
              title="Frequently Asked Questions"
              subtitle="Find quick answers to common questions about our courses, eligibility, certificates, and placement guidance."
            />
            <FAQAccordion items={faqs} />
          </div>
        </section>
      </ScrollReveal>

      {/* Career & Admission CTA */}
      <ScrollReveal>
        <CTASection onOpenApplyModal={onOpenApplyModal} />
      </ScrollReveal>
    </div>
  );
};

export default Home;
