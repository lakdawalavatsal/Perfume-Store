import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, Package, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { LotusIcon, GoldDivider } from './LotusIcon';

export function FragranceModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState('bottle');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setSelectedImage('bottle');
    setQuantity(1);
    setIsAdded(false);
  }, [product]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const hasBox = Boolean(product.images.box);
  const currentImageUrl =
    selectedImage === 'box' && hasBox ? product.images.box : product.images.bottle;

  const handleAdd = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-fragrance-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-emerald-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-brand-gold-500/30 z-10 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-brand-emerald-950/70 hover:bg-brand-emerald-950 text-white backdrop-blur-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image Gallery */}
          <div className="relative bg-stone-100 flex flex-col items-center justify-between p-6 sm:p-8">
            <div className="relative w-full aspect-[3/4] max-w-sm rounded-2xl overflow-hidden shadow-md bg-stone-200">
              <img
                src={currentImageUrl}
                alt={`${product.name} ${product.size} - ${selectedImage === 'box' ? 'Presentation Box' : 'Flacon'}`}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-emerald-950/80 text-brand-gold-300 text-xs font-semibold backdrop-blur-md">
                {product.size}
              </span>
            </div>

            {/* Thumbnail switcher for 50ml (Bottle vs Box) */}
            {hasBox && (
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedImage('bottle')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedImage === 'bottle'
                      ? 'bg-brand-emerald-900 text-brand-gold-300 border-brand-gold-400 shadow-sm'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  Flacon View
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage('box')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedImage === 'box'
                      ? 'bg-brand-emerald-900 text-brand-gold-300 border-brand-gold-400 shadow-sm'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Presentation Box
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Fragrance Information */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-white text-brand-emerald-950">
            <div>
              <div className="flex items-center gap-2 text-brand-gold-600 text-xs font-semibold uppercase tracking-widest mb-1.5">
                <LotusIcon className="w-4 h-4 text-brand-gold-500" />
                <span>{product.type}</span>
              </div>

              <h2
                id="modal-fragrance-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight"
              >
                {product.name}
              </h2>

              {/* Price and size badge */}
              <div className="flex items-baseline gap-3 mt-2 mb-4">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-emerald-900">
                  {product.formattedPrice}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  Bottle Volume: {product.size}
                </span>
              </div>

              <p className="font-serif italic text-stone-700 text-sm mb-6 border-l-2 border-brand-gold-400 pl-3">
                “{product.mood}”
              </p>

              {/* Olfactory Notes Breakdown */}
              <div className="rounded-2xl bg-brand-ivory-100 p-4 border border-stone-200 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-stone-700">
                    Fragrance Notes Pyramid
                  </h4>
                  <span className="text-[10px] text-brand-gold-600 bg-brand-gold-100 px-2 py-0.5 rounded-full font-medium">
                    Editable Placeholder
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900">Top Notes: </span>
                    <span className="text-stone-600">{product.notes.top}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Heart Notes: </span>
                    <span className="text-stone-600">{product.notes.heart}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Base Notes: </span>
                    <span className="text-stone-600">{product.notes.base}</span>
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 italic mt-3 pt-2 border-t border-stone-200">
                  * Note: Scent pyramid is an editable placeholder awaiting official formula card from the creator Mrs. Manisha Mehta.
                </p>
              </div>

              {/* Fragrance Specifications */}
              <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mb-6">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="block text-[10px] uppercase text-stone-400">Application</span>
                  <span className="font-semibold text-stone-800">Apparel Vaporisateur</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="block text-[10px] uppercase text-stone-400">Presentation</span>
                  <span className="font-semibold text-stone-800">
                    {hasBox ? 'Crystal Flacon & Box' : 'Sleek Travel Vial'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Add to Bag Row */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden w-full sm:w-auto justify-between">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 font-bold"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-stone-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 w-full py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                  isAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-gradient-to-r from-brand-gold-500 to-brand-gold-400 hover:from-brand-gold-400 hover:to-brand-gold-300 text-brand-emerald-950 shadow-gold-soft'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Bag · ₹{product.price * quantity}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
