import React from 'react';
import { Heart, Sparkles, Award, Compass, Feather } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { LotusIcon, GoldDivider } from './LotusIcon';

export function OurStory() {
  return (
    <section id="story" className="py-24 sm:py-32 bg-brand-ivory-200 text-brand-emerald-950 relative overflow-hidden">
      {/* Subtle Lotus Background Watermarks */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 opacity-10 pointer-events-none" 
        aria-hidden="true"
      >
        <LotusIcon className="w-full h-full text-brand-emerald-800" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-brand-gold-600 text-xs uppercase tracking-[0.25em] font-semibold mb-3">
            <LotusIcon className="w-4 h-4 text-brand-gold-500" />
            <span>The Founder's Journey</span>
            <LotusIcon className="w-4 h-4 text-brand-gold-500" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-brand-emerald-950 mb-4">
            Our Story & Heritage
          </h2>
          <p className="text-base text-stone-600 font-light">
            Founded in 2026 by Mrs. Manisha Mehta — celebrating the beauty of creation at any stage of life.
          </p>
          <GoldDivider className="my-6 max-w-xs mx-auto" />
        </div>

        {/* Narrative Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-14 shadow-luxury-card border border-stone-200/90 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Brand Emblem & Founder Plaque */}
            <div className="lg:col-span-5 flex flex-col items-center text-center p-6 rounded-2xl bg-brand-emerald-950 text-brand-ivory-100 border border-brand-gold-500/30 shadow-emerald-deep">
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-brand-gold-400 p-1 shadow-gold-glow mb-5">
                <img
                  src={BRAND_INFO.logoWebp}
                  alt="MANGAALAM Golden Emblem"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <span className="font-serif text-2xl font-bold tracking-widest text-brand-gold-300">
                MANGAALAM
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold-200/70 mt-1">
                Indian Fragrance House
              </span>

              <div className="w-16 h-[1px] bg-brand-gold-500/40 my-4" />

              <p className="font-serif italic text-xs text-brand-ivory-200/90 max-w-xs leading-relaxed">
                “Khushboo Jo Dil Mein Bas Jaye”
              </p>

              <div className="mt-5 pt-4 border-t border-brand-gold-500/20 w-full text-center">
                <span className="text-[11px] uppercase tracking-wider text-brand-gold-400 font-semibold block">
                  Established 2026
                </span>
                <span className="text-xs text-brand-ivory-300 block mt-0.5">
                  Founded by Mrs. Manisha Mehta
                </span>
              </div>
            </div>

            {/* Right: Narrative Prose */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-5 text-base sm:text-lg text-stone-700 leading-relaxed font-light">
                <p className="first-letter:font-serif first-letter:text-5xl first-letter:font-bold first-letter:text-brand-emerald-900 first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                  MANGAALAM is an Indian fragrance brand established in 2026, built on the belief that fragrance is an emotion, a memory and an expression of individuality.
                </p>

                <p>
                  Founded by <strong className="font-semibold text-brand-emerald-950">Mrs. Manisha Mehta</strong>, a passionate 61-year-old working woman, the brand reflects her belief that the joy of working and creating has no age limit.
                </p>

                <p>
                  Its thoughtfully curated collection includes unisex fragrances, selected fragrances for men and women, and car fragrances for everyday journeys. MANGAALAM aims to make memorable fragrance experiences accessible to everyone.
                </p>
              </div>

              {/* Concluding Signature Quote */}
              <div className="mt-8 pt-6 border-t border-stone-200">
                <blockquote className="font-serif text-xl sm:text-2xl italic font-semibold text-brand-emerald-900 leading-snug">
                  “Some fragrances are not just smelled; they are remembered.”
                </blockquote>
                <div className="mt-2 text-xs uppercase tracking-widest text-brand-gold-600 font-semibold">
                  — MANGAALAM Philosophy
                </div>
              </div>
            </div>
          </div>

          {/* Three Foundational Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-10 border-t border-stone-100">
            <div className="p-5 rounded-2xl bg-brand-ivory-50 border border-stone-200/80">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald-900 text-brand-gold-300 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-brand-emerald-950 mb-1">
                Emotion & Memory
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Each flacon is composed to evoke deeply personal memories, turning everyday presence into an emotional connection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-ivory-50 border border-stone-200/80">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald-900 text-brand-gold-300 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-brand-emerald-950 mb-1">
                Ageless Passion
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Founded by Mrs. Manisha Mehta at 61, proving the creative spirit and entrepreneurial vision know no boundaries of age.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-ivory-50 border border-stone-200/80">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald-900 text-brand-gold-300 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-brand-emerald-950 mb-1">
                Accessible Luxury
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Premium 50 ml flacons at ₹799 and pocket 20 ml scents at ₹449, bringing regal Indian scents within everyone's reach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
