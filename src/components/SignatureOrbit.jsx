import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, ShoppingBag, Check, Package, Play, Pause, Sparkles } from 'lucide-react';
import { PRODUCTS, BRAND_INFO } from '../data/products';
import { useCart } from '../context/CartContext';
import { LotusIcon, GoldDivider } from './LotusIcon';

const SIGNATURE_50ML = PRODUCTS.filter((p) => p.category === '50ml');

export function SignatureOrbit({ onSelectProduct }) {
  const { addToCart } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBox, setShowBox] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [addedNoticeId, setAddedNoticeId] = useState(null);
  const [fadeState, setFadeState] = useState(true);

  const autoPlayTimerRef = useRef(null);
  const thumbnailsContainerRef = useRef(null);

  // Check user system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setIsReducedMotion(e.matches);
      if (e.matches) setIsAutoPlaying(false);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle switching featured fragrance with smooth fade
  const handleSelectFragrance = useCallback(
    (index) => {
      if (index === selectedIndex) return;

      if (isReducedMotion) {
        setSelectedIndex(index);
        setShowBox(false);
      } else {
        setFadeState(false);
        setTimeout(() => {
          setSelectedIndex(index);
          setShowBox(false);
          setFadeState(true);
        }, 180);
      }

      // Scroll active thumbnail smoothly into view on mobile
      if (thumbnailsContainerRef.current) {
        const thumb = thumbnailsContainerRef.current.children[index];
        if (thumb) {
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    },
    [selectedIndex, isReducedMotion]
  );

  const handleNext = useCallback(() => {
    const next = (selectedIndex + 1) % SIGNATURE_50ML.length;
    handleSelectFragrance(next);
  }, [selectedIndex, handleSelectFragrance]);

  const handlePrev = useCallback(() => {
    const prev = (selectedIndex - 1 + SIGNATURE_50ML.length) % SIGNATURE_50ML.length;
    handleSelectFragrance(prev);
  }, [selectedIndex, handleSelectFragrance]);

  // Subtle auto-advance (only when enabled by user, paused on hover/focus)
  useEffect(() => {
    if (!isAutoPlaying || isReducedMotion) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, isReducedMotion, handleNext]);

  // Keyboard navigation across all 6 bottles
  const handleKeyDown = useCallback(
    (e, index) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (index + 1) % SIGNATURE_50ML.length;
        handleSelectFragrance(next);
        const nextBtn = document.getElementById(`supporting-thumb-${next}`);
        if (nextBtn) nextBtn.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (index - 1 + SIGNATURE_50ML.length) % SIGNATURE_50ML.length;
        handleSelectFragrance(prev);
        const prevBtn = document.getElementById(`supporting-thumb-${prev}`);
        if (prevBtn) prevBtn.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelectFragrance(index);
      }
    },
    [handleSelectFragrance]
  );

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    addToCart(product);
    setAddedNoticeId(product.id);
    setTimeout(() => setAddedNoticeId(null), 2000);
  };

  const activeProduct = SIGNATURE_50ML[selectedIndex] || SIGNATURE_50ML[0];
  const hasBoxImage = Boolean(activeProduct.images.box);
  const currentHeroImage = showBox && hasBoxImage ? activeProduct.images.box : activeProduct.images.bottle;

  return (
    <section
      id="signature-showcase"
      className="relative py-12 sm:py-20 lg:py-24 bg-brand-emerald-950 text-brand-ivory-100 overflow-hidden border-t border-b border-brand-gold-500/25"
      aria-label="Signature 50 ml Perfume Showcase"
    >
      {/* Background radial gold aura & subtle lotus watermark */}
      <div
        className="absolute inset-0 lotus-pattern opacity-15 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-brand-gold-400/6 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-brand-gold-400 text-xs uppercase tracking-[0.25em] font-medium mb-3">
            <LotusIcon className="w-4 h-4" />
            <span>The 50 ml Haute Collection</span>
            <LotusIcon className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            Signature Fragrance Gallery
          </h2>
          <p className="text-sm sm:text-base text-brand-ivory-200/80 max-w-xl mx-auto font-light leading-relaxed">
            Six iconic flacons crafted to linger in memory. Select any creation to view its character, notes, and presentation.
          </p>
          <div className="mt-3.5 inline-block px-4 py-1 rounded-full bg-brand-emerald-900/80 border border-brand-gold-500/40 text-xs font-serif text-brand-gold-300">
            6 Signature Fragrances · 50 ml · ₹799 each
          </div>
        </div>

        {/* ========================================================= */}
        {/* EDITORIAL FEATURED STAGE (Grand Focal Showcase)           */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-gradient-to-b from-brand-emerald-900/70 via-brand-emerald-950/90 to-brand-emerald-900/70 border border-brand-gold-500/30 p-5 sm:p-8 lg:p-12 shadow-emerald-deep relative overflow-hidden mb-10 sm:mb-14">
          {/* Subtle floating gold shimmer behind the bottle */}
          <div
            className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-gold-400/10 rounded-full blur-[80px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* LEFT / CENTER: Large sharply framed featured bottle */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div
                className={`relative w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[380px] aspect-[4/5] rounded-2xl bg-brand-emerald-950/80 border border-brand-gold-400/40 p-4 sm:p-6 flex items-center justify-center shadow-luxury-card transition-all duration-300 ${
                  fadeState ? 'opacity-100 scale-100' : 'opacity-70 scale-[0.98]'
                }`}
              >
                {/* Clean, unobscured product photography with object-contain */}
                <img
                  key={`${activeProduct.id}-${showBox ? 'box' : 'bottle'}`}
                  src={currentHeroImage}
                  alt={`${activeProduct.name} 50 ml - ${showBox ? 'Presentation Gift Box' : 'Crystal Flacon'}`}
                  className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                />

                {/* Corner Badges: Size & Exact Price */}
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-brand-emerald-950/90 backdrop-blur-md text-[11px] font-semibold text-brand-gold-300 border border-brand-gold-400/40 shadow-sm">
                    {activeProduct.size}
                  </span>
                </div>
                <div className="absolute top-3 right-3 z-20">
                  <span className="px-3 py-1 rounded-full bg-brand-gold-400 text-brand-emerald-950 text-xs font-bold shadow-md">
                    {activeProduct.formattedPrice}
                  </span>
                </div>

                {/* Bottle vs Presentation Box Toggle */}
                {hasBoxImage && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-full bg-brand-emerald-950/95 border border-brand-gold-500/40 backdrop-blur-md shadow-lg">
                    <button
                      type="button"
                      onClick={() => setShowBox(false)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        !showBox
                          ? 'bg-brand-gold-400 text-brand-emerald-950 font-bold shadow-sm'
                          : 'text-brand-ivory-300 hover:text-white'
                      }`}
                    >
                      Flacon
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBox(true)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        showBox
                          ? 'bg-brand-gold-400 text-brand-emerald-950 font-bold shadow-sm'
                          : 'text-brand-ivory-300 hover:text-white'
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      Gift Box
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Dedicated, clean editorial information area (Zero collision or overlap) */}
            <div className="lg:col-span-7 flex flex-col justify-between text-left">
              <div>
                {/* Index counter & type */}
                <div className="flex items-center justify-between text-xs tracking-[0.2em] text-brand-gold-400 font-mono mb-2 uppercase">
                  <span>
                    0{selectedIndex + 1} / 0{SIGNATURE_50ML.length} · {activeProduct.type}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="p-1.5 rounded-full text-brand-gold-300 hover:text-white hover:bg-brand-emerald-850 border border-brand-gold-500/30 transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                      aria-label="Previous perfume"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="p-1.5 rounded-full text-brand-gold-300 hover:text-white hover:bg-brand-emerald-850 border border-brand-gold-500/30 transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                      aria-label="Next perfume"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Fragrance Name */}
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2">
                  {activeProduct.name}
                </h3>

                {/* Price and Bottle Volume */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-serif text-xl sm:text-2xl font-bold text-brand-gold-300">
                    {activeProduct.formattedPrice}
                  </span>
                  <span className="text-xs sm:text-sm text-brand-ivory-300/80 font-light">
                    · 50 ml Vaporisateur Flacon
                  </span>
                </div>

                {/* Mood / Narrative Quote */}
                <p className="font-serif italic text-sm sm:text-base lg:text-lg text-brand-ivory-200/90 leading-relaxed border-l-2 border-brand-gold-400/60 pl-3.5 py-1 mb-5 sm:mb-6 bg-brand-emerald-950/40 rounded-r-xl">
                  {activeProduct.mood}
                </p>

                {/* Scent Notes Teaser (Clean, compact 3-column row) */}
                <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-brand-emerald-950/60 border border-brand-gold-500/25">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-gold-400 font-semibold block mb-2">
                    Key Olfactory Impressions
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-brand-emerald-900/60 p-2 sm:p-2.5 rounded-lg border border-brand-gold-500/15">
                      <span className="text-brand-ivory-400 text-[9px] sm:text-[10px] block uppercase font-mono">Top</span>
                      <span className="text-brand-ivory-100 font-medium text-[11px] sm:text-xs truncate block">{activeProduct.notes.top.split(',')[0]}</span>
                    </div>
                    <div className="bg-brand-emerald-900/60 p-2 sm:p-2.5 rounded-lg border border-brand-gold-500/15">
                      <span className="text-brand-ivory-400 text-[9px] sm:text-[10px] block uppercase font-mono">Heart</span>
                      <span className="text-brand-ivory-100 font-medium text-[11px] sm:text-xs truncate block">{activeProduct.notes.heart.split(',')[0]}</span>
                    </div>
                    <div className="bg-brand-emerald-900/60 p-2 sm:p-2.5 rounded-lg border border-brand-gold-500/15">
                      <span className="text-brand-ivory-400 text-[9px] sm:text-[10px] block uppercase font-mono">Base</span>
                      <span className="text-brand-ivory-100 font-medium text-[11px] sm:text-xs truncate block">{activeProduct.notes.base.split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectProduct(activeProduct)}
                  className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-brand-emerald-850 hover:bg-brand-emerald-750 border border-brand-gold-500/40 text-brand-gold-200 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                >
                  <Eye className="w-4 h-4" />
                  View Notes
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAddToCart(activeProduct, e)}
                  className="flex-1 sm:flex-initial px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-emerald-950 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-gold-soft hover:shadow-gold-glow focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                >
                  {addedNoticeId === activeProduct.id ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Bag · ₹799
                    </>
                  )}
                </button>

                {/* Optional Auto-advance toggle */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="px-3 py-2.5 sm:py-3 rounded-full bg-brand-emerald-900/80 hover:bg-brand-emerald-800 border border-brand-gold-500/25 text-brand-gold-300/80 hover:text-brand-gold-300 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold-400 ml-auto"
                  title={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                  aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUPPORTING BOTTLE CARDS GALLERY (Balanced, No Overlap)     */}
        {/* ========================================================= */}
        <div>
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-brand-gold-500/20">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-gold-400 font-semibold flex items-center gap-2">
              <LotusIcon className="w-3.5 h-3.5" />
              The 50 ml Collection ({SIGNATURE_50ML.length} Creations)
            </span>
            <span className="text-xs text-brand-ivory-300/70 hidden sm:inline">
              Select any flacon to spotlight
            </span>
          </div>

          {/* Desktop & Tablet: Balanced 6-card row with generous gaps */}
          {/* Mobile: Horizontally scrollable track with snap alignment */}
          <div
            ref={thumbnailsContainerRef}
            className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 snap-x sm:snap-none"
            role="tablist"
            aria-label="50 ml Perfume Selections"
          >
            {SIGNATURE_50ML.map((product, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={product.id}
                  id={`supporting-thumb-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectFragrance(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`flex-shrink-0 w-28 sm:w-auto min-w-[110px] snap-center group rounded-2xl p-2.5 sm:p-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-emerald-950 ${
                    isSelected
                      ? 'bg-brand-emerald-900/90 border-2 border-brand-gold-400 ring-2 ring-brand-gold-400/40 shadow-gold-soft scale-[1.02]'
                      : 'bg-brand-emerald-950/60 hover:bg-brand-emerald-900/60 border border-brand-gold-500/25 hover:border-brand-gold-400/60 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`${product.name}, 50 ml, ₹799. ${isSelected ? 'Currently featured.' : 'Select to feature.'}`}
                >
                  {/* Bottle image container with consistent 4:5 aspect ratio and object-contain */}
                  <div className="relative aspect-[4/5] rounded-xl bg-brand-emerald-950 mb-2 sm:mb-3 border border-brand-gold-500/20 overflow-hidden flex items-center justify-center p-1.5 sm:p-2">
                    <img
                      src={product.images.bottle}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Active "Featured" Indicator */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-gold-400 block shadow-gold-glow animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Exact Catalog Name & Price */}
                  <div className="flex flex-col">
                    <h4 className="font-serif text-[11px] sm:text-sm font-bold tracking-tight text-white leading-tight">
                      {product.name}
                    </h4>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-brand-gold-300 mt-0.5">
                      50 ml · ₹799
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] mt-1 font-medium transition-colors ${
                        isSelected ? 'text-brand-gold-400 font-bold' : 'text-brand-ivory-400/70 group-hover:text-brand-ivory-200'
                      }`}
                    >
                      {isSelected ? '★ Featured' : 'Select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiet instructional footer */}
        <p className="text-center text-xs text-brand-ivory-300/60 mt-6 sm:mt-8 font-light">
          Tip: Click or tap any supporting bottle to spotlight it above, or use the arrow keys to browse.
        </p>
      </div>
    </section>
  );
}
