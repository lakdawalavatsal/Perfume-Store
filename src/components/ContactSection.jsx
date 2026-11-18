import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { BRAND_INFO } from '../data/products';
import { LotusIcon, GoldDivider } from './LotusIcon';

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    interest: '50ml-collection',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', emailOrPhone: '', interest: '50ml-collection', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="py-20 sm:py-28 bg-brand-emerald-950 text-brand-ivory-100 relative overflow-hidden">
      {/* Background radial gold aura */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold-400/5 rounded-full blur-[120px] pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-brand-gold-400 text-xs uppercase tracking-[0.25em] font-semibold mb-3">
            <LotusIcon className="w-4 h-4" />
            <span>Direct Concierge</span>
            <LotusIcon className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Connect with MANGAALAM
          </h2>
          <p className="text-base text-brand-ivory-200/80 font-light">
            Whether inquiring about our 50 ml flacons, 20 ml travel sets, or bespoke gifting, we welcome your presence.
          </p>
          <GoldDivider className="my-6 max-w-xs mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Brand Concierge Details with Editable Placeholders */}
          <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-3xl bg-brand-emerald-900/60 border border-brand-gold-500/30">
            <div>
              <span className="font-serif text-xl font-bold text-brand-gold-300">
                MANGAALAM PERFUMES
              </span>
              <p className="text-xs text-brand-ivory-300 italic mt-1 font-serif">
                “{BRAND_INFO.tagline}”
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-brand-emerald-850 text-brand-gold-400 border border-brand-gold-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-brand-ivory-300 block">Direct Concierge Email</span>
                    <span className="text-sm font-medium text-white font-mono">
                      concierge@mangaalam.in
                    </span>
                    <span className="text-[10px] text-brand-gold-300/70 block">
                      [Brand placeholder · Update with official email]
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-brand-emerald-850 text-brand-gold-400 border border-brand-gold-500/20">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-brand-ivory-300 block">Brand Inquiries</span>
                    <span className="text-sm font-medium text-white font-mono">
                      +91 (Brand Phone Pending)
                    </span>
                    <span className="text-[10px] text-brand-gold-300/70 block">
                      [Brand placeholder · Update with official contact]
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-brand-emerald-850 text-brand-gold-400 border border-brand-gold-500/20">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-brand-ivory-300 block">Origin & Parfumerie</span>
                    <span className="text-sm font-medium text-white">
                      India · Established 2026
                    </span>
                    <span className="text-[10px] text-brand-gold-300/70 block">
                      Founder: Mrs. Manisha Mehta
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-gold-500/20">
              <p className="text-xs text-brand-ivory-300/80 leading-relaxed font-light">
                * Note on Orders: As a luxury boutique maison, orders are handled directly through personalized consultation without automated billing.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white text-brand-emerald-950 shadow-2xl border border-stone-200">
            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Send a Fragrance Inquiry
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Our team will respond to assist with bottle selections, order requests, and gift curation.
            </p>

            {submitted ? (
              <div className="p-8 text-center bg-brand-ivory-100 rounded-2xl border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-serif text-lg font-bold text-stone-900">
                  Thank You for Your Inquiry
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Your message has been received by the MANGAALAM concierge desk. We will connect with you promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Your Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priyanshu Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-brand-ivory-50 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="contact-reach" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Email or Phone Number
                  </label>
                  <input
                    id="contact-reach"
                    type="text"
                    required
                    value={formData.emailOrPhone}
                    onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                    placeholder="e.g. yourname@domain.com or +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-brand-ivory-50 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="contact-interest" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Fragrance of Interest
                  </label>
                  <select
                    id="contact-interest"
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-brand-ivory-50 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:bg-white"
                  >
                    <option value="50ml-collection">50 ml Signature Flacons (₹799 each)</option>
                    <option value="20ml-collection">20 ml Travel Collection (₹449 each)</option>
                    <option value="blue-haven">Blue Haven (Aquatic)</option>
                    <option value="opulent">Opulent (Floral Elegance)</option>
                    <option value="elvora">Elvora (Verdant Botanical)</option>
                    <option value="forever">Forever (Romantic EDP)</option>
                    <option value="horizon">Horizon (Smoky Twilight)</option>
                    <option value="charming">Charming (Solar Flora)</option>
                    <option value="flora">Flora (Pearl Blossom)</option>
                    <option value="bespoke-gifting">Bespoke Festive or Corporate Gifting</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Personal Note or Inquiry
                  </label>
                  <textarea
                    id="contact-message"
                    rows="3"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what scent profile or moment you are seeking..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-brand-ivory-50 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-emerald-950 to-brand-emerald-900 hover:from-brand-emerald-900 hover:to-brand-emerald-850 text-brand-gold-300 font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  Submit Fragrance Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
