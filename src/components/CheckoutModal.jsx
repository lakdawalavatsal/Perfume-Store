import React, { useState } from 'react';
import { X, Check, ShoppingBag, ShieldCheck, Truck, Sparkles, AlertCircle, Copy, ArrowRight, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { LotusIcon } from './LotusIcon';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export function CheckoutModal() {
  const { cart, subtotal, totalItems, isCheckoutOpen, setIsCheckoutOpen, clearCart, refreshProducts } = useCart();

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    order_notes: '',
    payment_method: 'cod'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isCheckoutOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim() || formData.customer_name.trim().length < 2) {
      newErrors.customer_name = 'Please enter your full name';
    }

    const cleanPhone = formData.phone.replace(/[\s\-\+]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address_line1.trim() || formData.address_line1.trim().length < 5) {
      newErrors.address_line1 = 'Please enter your delivery street address';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Please enter your city';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Please select your state';
    }

    const cleanPin = formData.pincode.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanPin)) {
      newErrors.pincode = 'Please enter a valid 6-digit postal pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (cart.length === 0) {
      setServerError('Your bag is empty.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        customer_name: formData.customer_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        order_notes: formData.order_notes.trim() || null,
        payment_method: formData.payment_method,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size,
          quantity: item.quantity
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order. Please check availability.');
      }

      // Order created successfully!
      setOrderConfirmation({
        order: data.order,
        payment: data.payment
      });

      // Clear bag and refresh live inventory in context
      clearCart();
      refreshProducts();

      // Trigger celebratory luxury confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#0A3B2C', '#E2D1A8', '#FFFFFF']
        });
      } catch (err) {
        // Safe fallback
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setServerError(err.message || 'An unexpected error occurred while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderText = () => {
    if (!orderConfirmation?.order) return;
    const ord = orderConfirmation.order;
    const summary = `MANGAALAM PERFUMES — Order Confirmation
Order ID: ${ord.id}
Customer: ${ord.customer_name} (${ord.phone})
Delivery Address: ${ord.address_line1}, ${ord.city}, ${ord.state} - ${ord.pincode}
Payment Method: ${ord.payment_method === 'cod' ? 'Cash on Delivery' : 'Direct UPI Transfer'}
Total Amount: ₹${ord.total_amount}
Items:
${ord.items.map((it, i) => `${i + 1}. ${it.product_name} (${it.product_size}) x ${it.quantity} = ₹${it.total_price}`).join('\n')}

Thank you for choosing MANGAALAM — Khushboo Jo Dil Mein Bas Jaye.`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setOrderConfirmation(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-gold-500/40 overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-brand-emerald-950 text-white flex items-center justify-between border-b border-brand-gold-500/30">
          <div className="flex items-center gap-2.5">
            <LotusIcon className="w-5 h-5 text-brand-gold-400" />
            <div>
              <h2 id="checkout-title" className="font-serif text-base sm:text-lg font-bold tracking-wide text-brand-gold-200">
                {orderConfirmation ? 'Order Confirmed' : 'Boutique Fragrance Checkout'}
              </h2>
              <span className="text-[10px] tracking-widest uppercase text-brand-gold-300/70 font-mono">
                MANGAALAM Luxury Dispatch Desk
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-brand-gold-300 hover:text-white hover:bg-brand-emerald-900 transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW A: ORDER CONFIRMATION SUCCESS VIEW                                   */}
        {/* ========================================================================= */}
        {orderConfirmation ? (
          <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Success Hero */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-emerald-950 border-2 border-brand-gold-400 flex items-center justify-center text-brand-gold-400 mx-auto mb-3 shadow-gold-soft">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold mb-2">
                Order Placed Successfully
              </span>
              <h3 className="font-serif text-2xl font-bold text-brand-emerald-950">
                Thank you, {orderConfirmation.order.customer_name}!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mt-1">
                Your bespoke fragrance order has been received and reserved in our boutique inventory.
              </p>
            </div>

            {/* Order ID & Meta Box */}
            <div className="p-4 rounded-2xl bg-brand-ivory-50 border border-brand-gold-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono block">
                  Unique Order Reference
                </span>
                <span className="font-mono text-lg font-bold text-brand-emerald-950 select-all">
                  {orderConfirmation.order.id}
                </span>
              </div>
              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono block">
                  Total Amount
                </span>
                <span className="font-serif text-xl font-bold text-brand-emerald-950">
                  ₹{orderConfirmation.order.total_amount}
                </span>
              </div>
            </div>

            {/* Payment & Next Steps Instructions */}
            <div className="p-4 rounded-2xl bg-brand-emerald-950/5 border border-brand-gold-500/40 text-xs space-y-2 text-stone-700">
              <div className="flex items-center gap-2 text-brand-emerald-950 font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-gold-600" />
                <span>
                  Payment Mode: {orderConfirmation.order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Direct UPI Transfer'}
                </span>
              </div>
              <p className="leading-relaxed">
                {orderConfirmation.payment?.instructions || 'Our boutique concierge will prepare your flacons with verified batch seals.'}
              </p>
              {orderConfirmation.payment?.upiUrl && (
                <div className="mt-3 pt-3 border-t border-brand-gold-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-900 block">
                      MANGAALAM Boutique UPI VPA:
                    </span>
                    <span className="font-mono text-xs font-bold text-brand-emerald-900 select-all">
                      {orderConfirmation.payment.vpa}
                    </span>
                  </div>
                  <a
                    href={orderConfirmation.payment.upiUrl}
                    className="px-4 py-2 rounded-xl bg-brand-emerald-950 text-brand-gold-300 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Open UPI App
                  </a>
                </div>
              )}
            </div>

            {/* Itemised Items List */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 font-mono">
                Ordered Fragrances ({orderConfirmation.order.items?.length || 0})
              </h4>
              <div className="space-y-2">
                {orderConfirmation.order.items?.map((it) => (
                  <div key={it.id || it.product_id} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0">
                        <img src={it.image_url} alt={it.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-serif font-bold text-stone-900 block">
                          {it.product_name}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {it.product_size} · Qty: {it.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900">
                      ₹{it.total_price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
              <span className="font-bold text-stone-900 block mb-1">
                Dispatch Destination:
              </span>
              <p>
                {orderConfirmation.order.address_line1}
                {orderConfirmation.order.address_line2 ? `, ${orderConfirmation.order.address_line2}` : ''}
                , {orderConfirmation.order.city}, {orderConfirmation.order.state} - {orderConfirmation.order.pincode}
              </p>
              <p className="mt-1 text-[11px] text-stone-500 font-mono">
                Contact: +91 {orderConfirmation.order.phone}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyOrderText}
                className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Summary Copied to Clipboard!' : 'Copy Order Receipt'}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-emerald-950 hover:bg-brand-emerald-900 text-brand-gold-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-gold-soft"
              >
                <span>Continue Exploring</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: CHECKOUT FORM & REVIEW                                            */
          /* ========================================================================= */
          <form id="checkout-order-form" onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Server Error Alert */}
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{serverError}</span>
              </div>
            )}

            {/* Itemised Order Summary Card */}
            <div className="p-4 rounded-2xl bg-brand-ivory-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-stone-500 pb-2 border-b border-stone-200">
                <span>Selected Flacons ({totalItems})</span>
                <span>Subtotal</span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-10 rounded bg-white border border-stone-200 overflow-hidden shrink-0">
                        <img src={item.images?.bottle} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <span className="font-serif font-bold text-stone-900 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {item.size} · ₹{item.price} × {item.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 shrink-0 pl-2">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <span>Insured Luxury Packaging & Courier:</span>
                <span className="text-emerald-700 font-bold uppercase tracking-wider text-[11px]">
                  Complimentary
                </span>
              </div>

              <div className="pt-2 border-t border-brand-gold-500/30 flex items-center justify-between font-serif text-base font-bold text-brand-emerald-950">
                <span>Total Payable:</span>
                <span className="text-lg text-brand-emerald-900 font-sans font-bold">
                  ₹{subtotal}
                </span>
              </div>
            </div>

            {/* Customer Contact Section */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-stone-700 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-emerald-950 text-brand-gold-300 flex items-center justify-center text-[10px]">1</span>
                <span>Customer Contact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="customer_name" className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Priya Sharma"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 focus:outline-none focus:ring-2 ${
                      errors.customer_name ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-brand-gold-400 focus:border-brand-gold-500'
                    }`}
                  />
                  {errors.customer_name && (
                    <span className="text-[11px] text-red-600 mt-1 block">{errors.customer_name}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-stone-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-mono">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className={`w-full pl-11 pr-3.5 py-2.5 rounded-xl border text-xs text-stone-900 font-mono focus:outline-none focus:ring-2 ${
                        errors.phone ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-brand-gold-400 focus:border-brand-gold-500'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-[11px] text-red-600 mt-1 block">{errors.phone}</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address <span className="text-stone-400 font-normal">(Optional, for dispatch updates)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="priya@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-brand-gold-400 focus:border-brand-gold-500'
                    }`}
                  />
                  {errors.email && (
                    <span className="text-[11px] text-red-600 mt-1 block">{errors.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-stone-700 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-emerald-950 text-brand-gold-300 flex items-center justify-center text-[10px]">2</span>
                <span>Delivery Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label htmlFor="address_line1" className="block text-xs font-semibold text-stone-700 mb-1">
                    Street Address / Flat / Building <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address_line1"
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    placeholder="Flat No, Wing, Building Name, Street"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 focus:outline-none focus:ring-2 ${
                      errors.address_line1 ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-brand-gold-400 focus:border-brand-gold-500'
                    }`}
                  />
                  {errors.address_line1 && (
                    <span className="text-[11px] text-red-600 mt-1 block">{errors.address_line1}</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address_line2" className="block text-xs font-semibold text-stone-700 mb-1">
                    Landmark / Locality <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="address_line2"
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    placeholder="Near City Center / Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:border-brand-gold-500"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-semibold text-stone-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 focus:outline-none focus:ring-2 ${
                      errors.city ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-brand-gold-400 focus:border-brand-gold-500'
                    }`}
                  />
                  {errors.city && (
                    <span className="text-[11px] text-red-600 mt-1 block">{errors.city}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-xs font-semibold text-stone-700 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g. 400001"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 font-mono focus:outline-none focus:ring-2 ${
                      errors.pincode ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-brand-gold-400 focus:border-brand-gold-500'
                    }`}
                  />
                  {errors.pincode && (
                    <span className="text-[11px] text-red-600 mt-1 block">{errors.pincode}</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="state" className="block text-xs font-semibold text-stone-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:border-brand-gold-500"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-stone-700 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-emerald-950 text-brand-gold-300 flex items-center justify-center text-[10px]">3</span>
                <span>Payment Mode</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cash on Delivery */}
                <label className={`relative flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.payment_method === 'cod'
                    ? 'border-brand-gold-500 bg-brand-gold-50/30 ring-2 ring-brand-gold-400/40 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={formData.payment_method === 'cod'}
                    onChange={handleInputChange}
                    className="mt-1 text-brand-emerald-900 focus:ring-brand-gold-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                      <Truck className="w-3.5 h-3.5 text-brand-emerald-800" />
                      <span>Cash on Delivery</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                      Pay cash or UPI upon delivery to the courier partner.
                    </p>
                  </div>
                </label>

                {/* Direct UPI / Boutique Concierge */}
                <label className={`relative flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.payment_method === 'manual_upi'
                    ? 'border-brand-gold-500 bg-brand-gold-50/30 ring-2 ring-brand-gold-400/40 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="manual_upi"
                    checked={formData.payment_method === 'manual_upi'}
                    onChange={handleInputChange}
                    className="mt-1 text-brand-emerald-900 focus:ring-brand-gold-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                      <QrCode className="w-3.5 h-3.5 text-brand-emerald-800" />
                      <span>Direct UPI Transfer</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                      Instant transfer via GPay, PhonePe, Paytm, or BHIM.
                    </p>
                  </div>
                </label>
              </div>

              {/* Security Assurance */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  No credit card numbers or banking secrets are collected or stored. Your luxury privacy is guaranteed.
                </span>
              </div>
            </div>

            {/* Optional Order Note */}
            <div>
              <label htmlFor="order_notes" className="block text-xs font-semibold text-stone-700 mb-1">
                Bespoke Order Notes / Gifting Instructions <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="order_notes"
                name="order_notes"
                rows={2}
                value={formData.order_notes}
                onChange={handleInputChange}
                placeholder="e.g. Please include handwritten gifting note or deliver after 5 PM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400 focus:border-brand-gold-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="checkout-submit-btn"
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-gold-500 via-brand-gold-400 to-brand-gold-500 text-brand-emerald-950 font-bold text-xs uppercase tracking-widest shadow-gold-soft hover:shadow-gold-glow transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-emerald-950 border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Inventory & Creating Order...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-emerald-950" />
                    <span>Confirm & Place Order · ₹{subtotal}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
