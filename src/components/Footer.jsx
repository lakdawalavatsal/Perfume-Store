import React from 'react';
import { BRAND_INFO } from '../data/products';
import { LotusIcon, GoldDivider } from './LotusIcon';

export function Footer({ onOpenTracker }) {
  return (
    <footer className="bg-brand-emerald-950 text-brand-ivory-100 border-t border-brand-gold-500/30 pt-16 pb-12 relative overflow-hidden">
      {/* Background subtle botanical pattern */}
      <div 
        className="absolute inset-0 lotus-pattern opacity-15 pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          {/* Brand Logo - As Supplied */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-brand-gold-400 p-1 shadow-gold-glow mb-4">
            <img
              src={BRAND_INFO.logoWebp}
              alt="MANGAALAM Perfumes"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.25em] text-brand-gold-300">
            MANGAALAM
          </h3>
          <p className="font-serif italic text-base sm:text-lg text-brand-ivory-200 mt-2 max-w-md">
            “{BRAND_INFO.tagline}”
          </p>
          <span className="text-xs uppercase tracking-[0.2em] text-brand-gold-400/80 mt-1">
            Indian Fragrance House · Established 2026 by Mrs. Manisha Mehta
          </span>

          <GoldDivider className="my-6 max-w-xs" />

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs uppercase tracking-widest text-brand-ivory-200/80 my-4" aria-label="Footer Navigation">
            <a href="#home" className="hover:text-brand-gold-300 transition-colors">
              Home
            </a>
            <a href="#signature-showcase" className="hover:text-brand-gold-300 transition-colors">
              Signature 50 ml
            </a>
            <a href="#shop" className="hover:text-brand-gold-300 transition-colors">
              Shop Fragrances
            </a>
            <a href="#story" className="hover:text-brand-gold-300 transition-colors">
              Our Story
            </a>
            <a href="#contact" className="hover:text-brand-gold-300 transition-colors">
              Contact Concierge
            </a>
            <button
              type="button"
              onClick={onOpenTracker}
              className="hover:text-brand-gold-300 transition-colors uppercase tracking-widest text-xs"
            >
              Track Order
            </button>
          </nav>
        </div>

        {/* Pricing & Transparency Notice */}
        <div className="pt-8 border-t border-brand-gold-500/20 text-center text-xs text-brand-ivory-300/70 space-y-2 max-w-2xl mx-auto font-light">
          <p>
            Collection Portfolio: Six 50 ml flacons at ₹799 each · Five 20 ml flacons at ₹449 each.
          </p>
          <p className="text-[11px] text-brand-ivory-400/60">
            © 2026 MANGAALAM Perfumes. All brand rights reserved. Founded by Mrs. Manisha Mehta.
          </p>
        </div>
      </div>
    </footer>
  );
}
