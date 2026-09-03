import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, BookOpen, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';
import { instituteInfo } from '../../data/instituteInfo';

const AboutSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT IMAGE COLLAGE */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border-4 border-amber-100 shadow-2xl">
              <img
                src="/images/computer-category.jpg"
                alt="Institute Campus Lab"
                className="w-full h-80 sm:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent"></div>
            </div>

            {/* Overlapping Badge Card */}
            <div className="absolute -bottom-6 -right-2 sm:right-6 bg-white p-5 rounded-3xl shadow-xl border border-amber-200 max-w-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
                10+
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-950">Years Excellence</div>
                <div className="text-xs text-slate-500 font-semibold">Transforming Careers</div>
              </div>
            </div>
          </div>

          {/* RIGHT TEXT CONTENT */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>About AurumFX</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight">
              Bridging the Gap Between Talent & Industry Demands.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Welcome to AurumFX, a premier multi-disciplinary educational institution committed to bridging the gap between talent and industry demands. Founded on the principles of academic excellence, skill-based learning, and character building, AurumFX empowers individuals to transform their passions into successful, long-term careers.
            </p>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              We offer specialized, career-focused programs through three dedicated academies: <span className="font-semibold text-slate-900">Fashion Designing Institute</span>, <span className="font-semibold text-slate-900">Computer Training Institute</span>, and <span className="font-semibold text-slate-900">Hospitality Management Institute</span>.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-colors">
                <div className="text-2xl font-extrabold text-slate-950">5,000+</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Students Trained</div>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-colors">
                <div className="text-2xl font-extrabold text-slate-950">20+</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Job-Ready Courses</div>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-colors">
                <div className="text-2xl font-extrabold text-slate-950">30+</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Expert Instructors</div>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-colors">
                <div className="text-2xl font-extrabold text-slate-950">94%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Placement Record</div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                to="/about"
                variant="primary"
                size="lg"
                icon={ArrowRight}
              >
                Learn More About Us
              </Button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
