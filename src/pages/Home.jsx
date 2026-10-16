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
        <section className="relative overflow-hidden bg-[linear-gradient(115deg,#fffaf0_0%,#ffffff_48%,#fff4c7_100%)] py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-16 lg:px-8">
            <div className="relative lg:col-span-2">
              <div className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-white p-2 shadow-xl shadow-amber-900/10">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=85"
                  alt="Students studying together in an academy classroom"
                  className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[440px]"
                />
              </div>
              <div className="absolute -bottom-4 -right-2 rounded-2xl border border-amber-200 bg-white px-5 py-3 shadow-lg sm:right-5">
                <p className="text-sm font-extrabold text-slate-900">Learn with confidence</p>
                <p className="mt-0.5 text-xs text-slate-500">Academy guidance, made clear</p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <SectionHeading
                align="left"
                className="mb-8 sm:mb-10"
                badge="Have Questions?"
                title="Frequently Asked Questions"
                subtitle="Find quick answers about our academies, course eligibility, certificates, and placement guidance."
              />
              <FAQAccordion items={faqs} />
            </div>
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
