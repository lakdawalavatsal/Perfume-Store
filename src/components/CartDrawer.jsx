import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check, MessageSquare, Copy } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BRAND_INFO } from '../data/products';
import { LotusIcon } from './LotusIcon';

export function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, isCartOpen, setIsCartOpen, setIsCheckoutOpen } = useCart();
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isCartOpen) return null;

  const orderSummaryText = `*MANGAALAM PERFUMES — Order Inquiry*
Brand: ${BRAND_INFO.tagline}

*Selected Fragrances:*
${cart.map((item, idx) => `${idx + 1}. ${item.name} (${item.size}) x ${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}

*Total Items:* ${totalItems}
*Subtotal:* ₹${subtotal}

Please confirm availability and order instructions.`;

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(orderSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-emerald-950/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-brand-gold-500/30">
          {/* Header */}
          <div className="p-6 bg-brand-emerald-950 text-brand-ivory-100 flex items-center justify-between border-b border-brand-gold-500/25">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-brand-emerald-900 border border-brand-gold-500/40 text-brand-gold-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold tracking-wide text-brand-gold-200">
                  Your Fragrance Bag
                </h2>
                <span className="text-xs text-brand-ivory-300">
                  {totalItems} {totalItems === 1 ? 'fragrance' : 'fragrances'} selected
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-brand-gold-300 hover:text-white hover:bg-brand-emerald-900 transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold-400"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-brand-ivory-100 flex items-center justify-center text-stone-400 mb-4 border border-stone-200">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-800">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mt-1 mb-6">
                  Discover our 11 curated perfumes from the 50 ml signature flacons to the 20 ml travel collection.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-brand-emerald-950 text-brand-gold-300 text-xs font-semibold uppercase tracking-wider hover:bg-brand-emerald-900 transition-colors"
                >
                  Explore Fragrances
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-brand-ivory-50 border border-stone-200/80 shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                    <img
                      src={item.images.bottle}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm font-bold text-stone-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {item.size} · {item.formattedPrice}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="inline-flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 text-xs font-bold"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-semibold text-stone-800 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 text-xs font-bold"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-brand-emerald-900">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                    aria-label={`Remove ${item.name} from bag`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Inquiry */}
          {cart.length > 0 && (
            <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Subtotal ({totalItems} items):</span>
                <span className="font-serif text-xl font-bold text-brand-emerald-950">
                  ₹{subtotal}
                </span>
              </div>

              <div className="text-[11px] text-stone-500 leading-normal bg-brand-ivory-100 p-3 rounded-xl border border-stone-200">
                <p>
                  * Orders are processed through direct concierge consultation with MANGAALAM to ensure bespoke client care.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold-500 to-brand-gold-400 hover:from-brand-gold-400 hover:to-brand-gold-300 text-brand-emerald-950 font-bold text-xs uppercase tracking-wider shadow-gold-soft flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                Proceed to Secure Checkout · ₹{subtotal}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(true)}
                  className="text-stone-500 hover:text-brand-emerald-900 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Concierge Inquiry Text</span>
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-stone-400 hover:text-stone-700 transition-colors"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Summary Modal */}
      {inquiryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-brand-gold-500/40 shadow-2xl relative text-brand-emerald-950">
            <button
              type="button"
              onClick={() => setInquiryModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <LotusIcon className="w-8 h-8 text-brand-gold-500 mx-auto mb-2" />
              <h3 className="font-serif text-xl font-bold text-brand-emerald-950">
                Concierge Order Summary
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                MANGAALAM · Direct Boutique Order Desk
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs font-mono whitespace-pre-wrap text-stone-700 max-h-56 overflow-y-auto mb-5">
              {orderSummaryText}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCopyOrder}
                className="flex-1 py-3 rounded-xl bg-brand-emerald-950 hover:bg-brand-emerald-900 text-brand-gold-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Summary Copied!' : 'Copy Order Text'}
              </button>

              <button
                type="button"
                onClick={() => setInquiryModalOpen(false)}
                className="px-5 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs uppercase tracking-wider hover:bg-stone-100 transition-colors"
              >
                Done
              </button>
            </div>

            <p className="text-[11px] text-stone-400 text-center mt-4">
              Share this summary with the brand team via email or messaging to finalize dispatch details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
