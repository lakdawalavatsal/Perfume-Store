import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Eye, ShoppingBag, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCTS, BRAND_INFO } from '../data/products';
import { useCart } from '../context/CartContext';
import { LotusIcon, GoldDivider } from './LotusIcon';

const SIGNATURE_50ML = PRODUCTS.filter((p) => p.category === '50ml');

export function Hero({ onSelectProduct }) {
  const { addToCart } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [addedNoticeId, setAddedNoticeId] = useState(null);
  const thumbnailsRef = useRef(null);

  // Check user system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSelect = useCallback((index) => {
    setSelectedIndex(index);
    if (thumbnailsRef.current) {
      const thumb = thumbnailsRef.current.children[index];
      if (thumb) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % SIGNATURE_50ML.length);
  }, []);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + SIGNATURE_50ML.length) % SIGNATURE_50ML.length);
  }, []);

  const handleKeyDown = useCallback(
    (e, index) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (index + 1) % SIGNATURE_50ML.length;
        handleSelect(next);
        const nextBtn = document.getElementById(`hero-bottle-btn-${next}`);
        if (nextBtn) nextBtn.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (index - 1 + SIGNATURE_50ML.length) % SIGNATURE_50ML.length;
        handleSelect(prev);
        const prevBtn = document.getElementById(`hero-bottle-btn-${prev}`);
        if (prevBtn) prevBtn.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(index);
        if (onSelectProduct) onSelectProduct(SIGNATURE_50ML[index]);
      }
    },
    [handleSelect, onSelectProduct]
  );

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    addToCart(product);
    setAddedNoticeId(product.id);
    setTimeout(() => setAddedNoticeId(null), 1800);
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeProduct = SIGNATURE_50ML[activeIndex] || SIGNATURE_50ML[0];

  return (
    <div id="home" className="relative bg-brand-emerald-950 text-brand-ivory-100">
      {/* ========================================================================= */}
      {/* 1. CINEMATIC HERO (First Screen with Full-Width Background Photo)         */}
      {/* ========================================================================= */}
      <section
        className="relative min-h-[90vh] sm:min-h-screen flex flex-col justify-between pt-16 sm:pt-20 lg:pt-22 pb-6 sm:pb-8 overflow-hidden"
        aria-label="MANGAALAM Campaign Showcase"
      >
        {/* Full-width campaign background photo for desktop & tablets (sm and up) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden sm:block" aria-hidden="true">
          <img
            src="/assets/campaign/mangaalam-campaign-bottles.jpg"
            alt="Six MANGAALAM perfumes displayed on marble in warm luxury setting"
            className="w-full h-full object-cover object-[center_66%] lg:object-[center_62%] filter brightness-95"
            loading="eager"
          />

          {/* Subtle emerald & dark atmospheric gradient overlay: preserves warm gold lighting while ensuring text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#041610]/85 via-[#041610]/25 to-[#041610]/90" />

          {/* Soft golden spotlight glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-gold-400/10 rounded-full blur-[130px]" />
        </div>

        {/* Ambient background for mobile screens */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#041610] via-brand-emerald-950 to-[#03110C] sm:hidden" aria-hidden="true" />

        {/* Hero Editorial Typography: Calm, uncluttered upper area balanced against the perfume lineup */}
        <div className="relative z-10 max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-1 sm:pt-2">
          {/* Brand Line: Khushboo Jo Dil Mein Bas Jaye */}
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 sm:py-1.5 rounded-full bg-brand-emerald-950/90 border border-brand-gold-500/40 shadow-gold-soft backdrop-blur-md mb-2 sm:mb-2.5">
            <LotusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-gold-300" />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-brand-gold-200 font-medium">
              Khushboo Jo Dil Mein Bas Jaye.
            </span>
            <LotusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-gold-300" />
          </div>

          {/* Headline: A scent that leaves a lasting impression */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[38px] font-bold tracking-tight text-white mb-1.5 sm:mb-2 leading-tight drop-shadow-md">
            A scent that{' '}
            <span className="gold-gradient-text italic font-normal">leaves a lasting impression.</span>
          </h1>

          {/* Lotus Divider Ornament */}
          <div className="flex items-center justify-center gap-3 my-1.5 sm:my-2">
            <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent via-brand-gold-400/60 to-brand-gold-400" />
            <LotusIcon className="w-3.5 h-3.5 text-brand-gold-400" />
            <span className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent via-brand-gold-400/60 to-brand-gold-400" />
          </div>

          {/* Supporting Line: Discover MANGAALAM — fragrances for moments worth remembering. */}
          <p className="max-w-md lg:max-w-lg mx-auto text-xs sm:text-sm text-brand-ivory-100/90 font-light leading-relaxed mb-3 sm:mb-4 px-2 drop-shadow-sm">
            Discover MANGAALAM — fragrances for moments worth remembering.
          </p>

          {/* Explore the Collection CTA Button */}
          <div className="flex items-center justify-center">
            <a
              href="#signature-showcase"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-brand-gold-400 via-brand-gold-300 to-brand-gold-500 text-brand-emerald-950 font-semibold text-xs tracking-wider uppercase shadow-gold-soft hover:shadow-gold-glow hover:scale-105 active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-gold-400"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-emerald-950" />
              <span>Explore the Collection</span>
            </a>
          </div>
        </div>

        {/* Mobile Responsive Campaign Showcase: preserves all six bottles in full width without cropping */}
        <div className="relative z-10 sm:hidden px-4 my-3">
          <div className="relative rounded-2xl overflow-hidden border border-brand-gold-500/30 shadow-gold-soft bg-brand-emerald-950/80">
            <div className="relative aspect-[16/10] w-full">
              <img
                src="/assets/campaign/mangaalam-campaign-bottles.jpg"
                alt="Six MANGAALAM perfumes displayed in warm luxury setting"
                className="w-full h-full object-cover object-[center_62%]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#041610]/80 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="py-2 px-3 text-center bg-brand-emerald-950/95 border-t border-brand-gold-500/20">
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-gold-300 font-mono">
                Six 50 ml Signature Flacons · ₹799 each
              </span>
            </div>
          </div>
        </div>

        {/* First-Screen Scroll Invitation Cue */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-2 sm:pt-3">
          <a
            href="#signature-showcase"
            className="inline-flex flex-col items-center gap-1.5 text-brand-gold-300/80 hover:text-brand-gold-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400 group"
            aria-label="Scroll down to inspect individual 50 ml flacons"
          >
            <span className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase font-mono group-hover:tracking-[0.28em] transition-all drop-shadow">
              Explore 50 ml Flacon Showcase
            </span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-gold-400 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. COLLECTION ENTRANCE (Interactive Six 50 ml Flacons Showcase)          */}
      {/* ========================================================================= */}
      <section
        id="signature-showcase"
        className="relative py-14 sm:py-20 lg:py-24 border-t border-brand-gold-500/25 bg-gradient-to-b from-[#041610] via-brand-emerald-950 to-[#020B07] text-brand-ivory-100 overflow-hidden"
        aria-label="The 50 ml Haute Flacon Gallery"
      >
        {/* Subtle lotus watermark texture */}
        <div className="absolute inset-0 lotus-pattern opacity-15 pointer-events-none" aria-hidden="true" />

        {/* Ambient golden lighting aura */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-brand-gold-400/8 rounded-full blur-[130px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Collection Entrance Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 text-brand-gold-400 text-xs uppercase tracking-[0.25em] font-medium mb-3">
              <LotusIcon className="w-4 h-4" />
              <span>Collection Entrance · 50 ml Flacons</span>
              <LotusIcon className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
              The Six Signature Flacons
            </h2>
            <p className="text-sm sm:text-base text-brand-ivory-200/80 font-light max-w-xl mx-auto leading-relaxed">
              Individually crafted with pure perfume oils. Select or hover any flacon to inspect its character, volume, and pricing.
            </p>
            <div className="mt-3.5 inline-block px-4 py-1 rounded-full bg-brand-emerald-900/80 border border-brand-gold-500/40 text-xs font-serif text-brand-gold-300">
              6 Fragrances · 50 ml Vaporisateur · ₹799 each
            </div>
          </div>

          {/* DESKTOP & TABLET GALLERY STAGE (≥ 640px) */}
          <div className="hidden sm:block">
            {/* Gallery Staging Plinth */}
            <div className="relative rounded-3xl p-6 lg:p-8 bg-gradient-to-b from-brand-emerald-900/40 via-brand-emerald-950/85 to-[#020B07] border border-brand-gold-500/30 shadow-2xl backdrop-blur-md">
              {/* Six Interactive Flacons Row */}
              <div
                className="grid grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-end justify-center pt-2 pb-2"
                role="tablist"
                aria-label="Six 50 ml Perfume Flacons"
              >
                {SIGNATURE_50ML.map((product, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isHovered = hoveredIndex === idx;
                  const isActive = isHovered || isSelected;

                  return (
                    <div key={product.id} className="flex flex-col items-center">
                      {/* Standalone Flacon Button */}
                      <button
                        id={`hero-bottle-btn-${idx}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(idx)}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onFocus={() => {
                          setHoveredIndex(idx);
                          handleSelect(idx);
                        }}
                        onBlur={() => setHoveredIndex(null)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={`relative w-full aspect-[4/5] max-w-[160px] p-2 rounded-2xl flex items-center justify-center transition-all duration-300 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-emerald-950 ${
                          isReducedMotion
                            ? isSelected
                              ? 'border border-brand-gold-400 bg-brand-emerald-900/60'
                              : 'border border-brand-gold-500/20 bg-brand-emerald-950/40'
                            : isActive
                            ? 'transform -translate-y-2.5 scale-105 border border-brand-gold-400/80 bg-brand-emerald-900/70 shadow-gold-glow'
                            : 'border border-brand-gold-500/20 bg-brand-emerald-950/40 hover:border-brand-gold-400/50 hover:-translate-y-1'
                        }`}
                        aria-label={`${product.name}, 50 ml, ₹799. Press Enter for full details.`}
                      >
                        {/* Crisp Bottle Image with full cap, base, and label visible */}
                        <img
                          src={product.images.bottle}
                          alt={product.name}
                          className={`w-full h-full object-contain filter transition-all duration-300 ${
                            isActive ? 'drop-shadow-[0_12px_24px_rgba(212,175,55,0.35)]' : 'drop-shadow-md'
                          }`}
                          loading="lazy"
                        />

                        {/* Active Gold Indicator Dot */}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <span className="w-2 h-2 rounded-full bg-brand-gold-400 block shadow-gold-glow animate-pulse" />
                          </div>
                        )}
                      </button>

                      {/* Soft Grounded Contact Shadow */}
                      <div className="w-3/4 h-2 mx-auto bg-black/70 blur-[3px] rounded-full -mt-1 pointer-events-none" />

                      {/* Mirror Reflection fading into floor */}
                      <div
                        className="relative w-full h-12 lg:h-14 -mt-0.5 overflow-hidden pointer-events-none opacity-20 filter blur-[0.4px]"
                        aria-hidden="true"
                      >
                        <img
                          src={product.images.bottle}
                          alt=""
                          className="w-full h-full object-contain transform -scale-y-100 origin-top"
                          style={{
                            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 75%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 75%)',
                          }}
                        />
                      </div>

                      {/* Bottle Label: Exact Name & 50 ml · ₹799 */}
                      <div className="mt-1 text-center w-full px-1">
                        <span
                          className={`font-serif text-xs lg:text-sm font-bold tracking-wide block truncate transition-colors ${
                            isActive ? 'text-brand-gold-300' : 'text-white'
                          }`}
                        >
                          {product.name}
                        </span>
                        <span className="text-[11px] text-brand-gold-300/90 font-medium block mt-0.5">
                          50 ml · ₹799
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hairline Horizon Edge */}
              <div className="relative mt-3">
                <div className="h-px bg-gradient-to-r from-transparent via-brand-gold-400/40 to-transparent w-full" />
                <div className="h-2 bg-gradient-to-b from-brand-gold-400/8 to-transparent w-full pointer-events-none blur-sm" />
              </div>

              {/* Dedicated Spotlight Caption Area: Zero collision or overlap */}
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-brand-emerald-950/80 border border-brand-gold-500/25 shadow-luxury-card flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-brand-gold-400 mb-1">
                    <span className="uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <LotusIcon className="w-3.5 h-3.5" />
                      Selected Creation · {activeProduct.name}
                    </span>
                    <span>—</span>
                    <span className="text-brand-gold-300 font-bold">50 ml · ₹799</span>
                  </div>
                  <p className="font-serif italic text-xs sm:text-sm text-brand-ivory-200/90 line-clamp-1">
                    {activeProduct.mood}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectProduct && onSelectProduct(activeProduct)}
                    className="px-4 py-2.5 rounded-full bg-brand-emerald-850 hover:bg-brand-emerald-750 border border-brand-gold-500/40 text-brand-gold-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(activeProduct, e)}
                    className="px-5 py-2.5 rounded-full bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-emerald-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-gold-soft hover:shadow-gold-glow focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                  >
                    {addedNoticeId === activeProduct.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag · ₹799
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE GALLERY STAGE (< 640px): Featured flacon + Selectable thumbnail strip */}
          <div className="block sm:hidden">
            {/* Prominent Featured Bottle Card */}
            <div className="rounded-2xl bg-brand-emerald-950/85 backdrop-blur-md border border-brand-gold-400/40 p-4 shadow-luxury-card mb-4 text-center">
              {/* Top controls & index */}
              <div className="flex items-center justify-between text-xs text-brand-gold-400 mb-2 font-mono">
                <span className="uppercase tracking-widest text-[10px] flex items-center gap-1">
                  <LotusIcon className="w-3 h-3 text-brand-gold-400" />
                  0{selectedIndex + 1} / 0{SIGNATURE_50ML.length} · 50 ml
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-1 rounded-full text-brand-gold-300 hover:text-white border border-brand-gold-500/30"
                    aria-label="Previous perfume flacon"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-1 rounded-full text-brand-gold-300 hover:text-white border border-brand-gold-500/30"
                    aria-label="Next perfume flacon"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sharp, prominent bottle image */}
              <div className="w-44 aspect-[4/5] mx-auto mb-2 flex items-center justify-center p-2">
                <img
                  src={activeProduct.images.bottle}
                  alt={activeProduct.name}
                  className="w-full h-full object-contain filter drop-shadow-xl"
                />
              </div>

              {/* Grounded shadow */}
              <div className="w-32 h-2 mx-auto bg-black/70 blur-[3px] rounded-full mb-3" />

              {/* Name & Price */}
              <h3 className="font-serif text-2xl font-bold text-white tracking-wide">
                {activeProduct.name}
              </h3>
              <p className="text-xs font-semibold text-brand-gold-300 mt-0.5 mb-2">
                50 ml Vaporisateur · ₹799
              </p>
              <p className="font-serif italic text-xs text-brand-ivory-200/85 mb-4 line-clamp-2 px-2">
                {activeProduct.mood}
              </p>

              {/* Mobile Actions */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectProduct && onSelectProduct(activeProduct)}
                  className="flex-1 py-2 px-3 rounded-full bg-brand-emerald-850 hover:bg-brand-emerald-750 border border-brand-gold-500/40 text-brand-gold-200 text-xs font-semibold inline-flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAddToCart(activeProduct, e)}
                  className="flex-1 py-2 px-3 rounded-full bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-emerald-950 text-xs font-bold inline-flex items-center justify-center gap-1 shadow-gold-soft"
                >
                  {addedNoticeId === activeProduct.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" /> Add · ₹799
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Horizontally scrollable thumbnail strip */}
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-wider text-brand-gold-400/90 font-semibold block mb-2 px-1">
                Tap any flacon to inspect:
              </span>
              <div
                ref={thumbnailsRef}
                className="flex gap-2.5 overflow-x-auto pb-2 snap-x no-scrollbar px-1"
                role="tablist"
                aria-label="50 ml Perfume Thumbnails"
              >
                {SIGNATURE_50ML.map((product, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(idx)}
                      className={`flex-shrink-0 w-20 snap-center rounded-xl p-1.5 text-center transition-all ${
                        isSelected
                          ? 'border-2 border-brand-gold-400 bg-brand-emerald-900/90 ring-1 ring-brand-gold-400/50 shadow-gold-soft'
                          : 'border border-brand-gold-500/25 bg-brand-emerald-950/70 backdrop-blur-sm opacity-80'
                      }`}
                    >
                      <div className="w-full aspect-[4/5] mb-1 flex items-center justify-center p-1">
                        <img
                          src={product.images.bottle}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="font-serif text-[10px] font-bold text-white block truncate">
                        {product.name}
                      </span>
                      <span className="text-[9px] text-brand-gold-300 font-semibold block">
                        ₹799
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Scroll Cue to Shop Full Catalog */}
          <div className="flex flex-col items-center justify-center mt-8 pt-4">
            <a
              href="#shop"
              className="inline-flex flex-col items-center gap-1.5 text-brand-gold-300/80 hover:text-brand-gold-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400 group"
              aria-label="Scroll down to browse all 11 fragrances"
            >
              <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-mono group-hover:tracking-[0.25em] transition-all">
                Continue to Complete 11-Fragrance Shop
              </span>
              <ChevronDown className="w-4 h-4 text-brand-gold-400 animate-bounce" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
