import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Eye, ShoppingBag, Sparkles, Package } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { useCart } from '../context/CartContext';
import { LotusIcon, GoldDivider } from './LotusIcon';

export function ShopCollection({ onSelectProduct }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewBoxId, setPreviewBoxId] = useState(null);
  const { addToCart } = useCart();

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.size.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="shop" className="py-20 sm:py-28 bg-brand-ivory-100 text-brand-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-brand-gold-600 text-xs uppercase tracking-[0.25em] font-medium mb-3">
            <LotusIcon className="w-4 h-4 text-brand-gold-500" />
            <span>Curated Indian Perfumery</span>
            <LotusIcon className="w-4 h-4 text-brand-gold-500" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-brand-emerald-950 mb-4">
            Shop the Collection
          </h2>
          <p className="text-base sm:text-lg text-stone-600 font-light max-w-xl mx-auto">
            Discover the complete 11-fragrance portfolio. From regal 50 ml display flacons to sleek 20 ml pocket fragrances.
          </p>
          <GoldDivider className="my-6 max-w-xs mx-auto" />
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-stone-200">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Fragrance categories">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-500 ${
                    isActive
                      ? 'bg-brand-emerald-900 text-brand-gold-300 shadow-md scale-105'
                      : 'bg-stone-200/70 hover:bg-stone-300/80 text-stone-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fragrance name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-stone-300 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 transition-colors shadow-sm"
              aria-label="Search fragrances"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Products Count Indicator */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-6 font-medium">
          <span>
            Showing <strong className="text-stone-800">{filteredProducts.length}</strong> of 11 fragrances
          </span>
          <span className="hidden sm:inline">
            50 ml at ₹799 · 20 ml at ₹449
          </span>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product) => {
            const hasBox = Boolean(product.images.box);
            const isShowingBox = previewBoxId === product.id;
            const currentImg = isShowingBox && hasBox ? product.images.box : product.images.bottle;

            return (
              <article
                key={product.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200/90 hover:border-brand-gold-400 shadow-sm hover:shadow-luxury-card transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container with view switch for 50ml */}
                <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                  <img
                    src={currentImg}
                    alt={`${product.name} ${product.size} - ${isShowingBox ? 'Presentation Box' : 'Bottle'}`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Size and Price Badge */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-full bg-brand-emerald-950/85 backdrop-blur-md text-[11px] font-semibold text-brand-gold-300 border border-brand-gold-400/40 shadow-sm">
                      {product.size}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-brand-emerald-950 border border-stone-300/80 shadow-sm">
                      {product.formattedPrice}
                    </span>
                  </div>

                  {/* 50ml Box toggle button */}
                  {hasBox && (
                    <button
                      type="button"
                      onClick={() => setPreviewBoxId(isShowingBox ? null : product.id)}
                      className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-brand-emerald-950/80 hover:bg-brand-emerald-950 text-white text-[10px] font-medium backdrop-blur-md flex items-center gap-1.5 transition-colors border border-white/20 shadow-md"
                      title={isShowingBox ? 'Switch to bottle view' : 'Preview presentation box'}
                    >
                      <Package className="w-3 h-3 text-brand-gold-400" />
                      <span>{isShowingBox ? 'Bottle' : 'Gift Box'}</span>
                    </button>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-medium tracking-wider uppercase text-stone-500 mb-1">
                      {product.type}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-brand-emerald-800 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2 italic font-serif">
                      “{product.mood}”
                    </p>
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-brand-emerald-900 text-stone-800 hover:text-brand-gold-300 text-xs font-semibold tracking-wider transition-colors duration-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Fragrance
                    </button>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="inline-flex items-center justify-center p-2.5 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-emerald-950 font-bold transition-all shadow-sm hover:shadow-gold-soft active:scale-95"
                      title={`Add ${product.name} (${product.size}) to bag`}
                      aria-label={`Add ${product.name} to shopping bag`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 max-w-md mx-auto">
            <LotusIcon className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-semibold text-stone-800">
              No fragrances found
            </h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Try searching with another name or reset your category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-full bg-brand-emerald-900 text-brand-gold-300 text-xs font-semibold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
