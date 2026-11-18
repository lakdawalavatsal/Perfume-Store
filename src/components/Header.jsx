import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BRAND_INFO } from '../data/products';

export function Header({ onOpenTracker }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Signature Showcase', href: '#signature-showcase' },
    { name: 'Shop Fragrances', href: '#shop' },
    { name: 'Our Story', href: '#story' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-brand-emerald-950/95 backdrop-blur-md py-3 shadow-emerald-deep border-b border-brand-gold-500/20'
            : 'bg-gradient-to-b from-brand-emerald-950/90 via-brand-emerald-950/60 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="#home"
              className="group flex items-center gap-2.5 sm:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400 rounded-lg p-1"
              aria-label="MANGAALAM Perfumes Home"
            >
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-brand-gold-400/50 shadow-gold-soft transition-transform duration-300 group-hover:scale-105 shrink-0">
                <img
                  src={BRAND_INFO.logoThumb}
                  alt="MANGAALAM Lotus Emblem"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.15em] sm:tracking-[0.2em] text-brand-gold-300 group-hover:text-brand-gold-200 transition-colors truncate">
                  MANGAALAM
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-brand-gold-200/70 uppercase">
                  Perfumes · Est. 2026
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium tracking-wider text-brand-ivory-200 hover:text-brand-gold-300 transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-brand-gold-400 hover:after:w-full after:transition-all after:duration-200"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Actions: Shop CTA + Bag Button + Mobile Hamburger */}
            <div className="flex items-center gap-3 sm:gap-4">
              <a
                href="#shop"
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-gold-500 to-brand-gold-400 text-brand-emerald-950 text-xs font-semibold uppercase tracking-wider shadow-gold-soft hover:shadow-gold-glow hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-emerald-950" />
                Shop Perfumes
              </a>

              {/* Track Order Button */}
              <button
                type="button"
                onClick={onOpenTracker}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-brand-gold-300 hover:text-white hover:bg-brand-emerald-850/80 border border-brand-gold-500/30 text-xs font-medium transition-colors"
                title="Track your fragrance order"
              >
                <Truck className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>Track Order</span>
              </button>

              {/* Shopping Bag Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full text-brand-gold-300 hover:text-brand-gold-100 hover:bg-brand-emerald-850/80 border border-brand-gold-500/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                aria-label={`Open shopping bag (${totalItems} items)`}
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-brand-gold-400 text-brand-emerald-950 text-[11px] font-bold shadow-md animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-lg text-brand-gold-300 hover:text-brand-gold-100 hover:bg-brand-emerald-850/80 border border-brand-gold-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-modal="true"
        role="dialog"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-brand-emerald-950/80 backdrop-blur-md"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`fixed top-0 right-0 bottom-0 w-full max-w-xs bg-brand-emerald-950 border-l border-brand-gold-500/30 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div>
            {/* Header in Drawer */}
            <div className="flex items-center justify-between pb-6 border-b border-brand-gold-500/20">
              <div className="flex items-center gap-3">
                <img
                  src={BRAND_INFO.logoThumb}
                  alt="MANGAALAM Logo"
                  className="w-9 h-9 rounded-full border border-brand-gold-400/50"
                />
                <span className="font-serif text-lg font-bold tracking-widest text-brand-gold-300">
                  MANGAALAM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-brand-gold-300 hover:bg-brand-emerald-850"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="mt-8 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium tracking-wider text-brand-ivory-200 hover:text-brand-gold-300 py-2 border-b border-brand-emerald-850/60 transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTracker();
                }}
                className="text-left text-base font-medium tracking-wider text-brand-ivory-200 hover:text-brand-gold-300 py-2 border-b border-brand-emerald-850/60 transition-colors flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-brand-gold-400" />
                <span>Track Order</span>
              </button>
            </nav>
          </div>

          {/* Mobile Bottom CTA */}
          <div className="pt-6 border-t border-brand-gold-500/20 space-y-3">
            <a
              href="#shop"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-gradient-to-r from-brand-gold-500 to-brand-gold-400 text-brand-emerald-950 font-semibold text-xs uppercase tracking-wider shadow-gold-soft hover:shadow-gold-glow transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Explore All 11 Fragrances
            </a>
            <p className="text-center text-[11px] text-brand-gold-200/60 italic font-serif">
              “Khushboo Jo Dil Mein Bas Jaye”
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
