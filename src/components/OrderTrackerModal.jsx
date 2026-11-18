import React, { useState } from 'react';
import { X, Search, Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { LotusIcon } from './LotusIcon';

const STATUS_STEPS = ['New', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export function OrderTrackerModal({ isOpen, onClose, initialOrderId = '' }) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    const cleanId = orderIdInput.trim();
    if (!cleanId) {
      setError('Please enter your Order ID (e.g. MNG-20261116-XXXX).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No matching order found. Please verify your Order ID.');
      }
      setOrderData(data.order);
    } catch (err) {
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepIndex = orderData ? STATUS_STEPS.indexOf(orderData.order_status) : -1;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-brand-gold-500/40 shadow-2xl text-stone-900 my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <LotusIcon className="w-8 h-8 text-brand-gold-500 mx-auto mb-2" />
          <h3 className="font-serif text-xl font-bold text-brand-emerald-950">
            Track Your Fragrance Order
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Enter your unique Order Reference to view dispatch & tracking details.
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleTrack} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. MNG-20261116-4068"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-brand-emerald-950 hover:bg-brand-emerald-900 text-brand-gold-300 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Details Result */}
        {orderData && (
          <div className="space-y-5 pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-brand-emerald-950 block">
                  {orderData.id}
                </span>
                <span className="text-[11px] text-stone-500">
                  Placed on {new Date(orderData.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-emerald-900 text-brand-gold-300 border border-brand-gold-500/30">
                {orderData.order_status}
              </span>
            </div>

            {/* Progress Step Indicator */}
            {orderData.order_status !== 'Cancelled' ? (
              <div className="py-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                  {STATUS_STEPS.map((step, idx) => (
                    <span
                      key={step}
                      className={idx <= currentStepIndex ? 'text-brand-emerald-900 font-bold' : ''}
                    >
                      {step}
                    </span>
                  ))}
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-emerald-900 h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.max(10, ((currentStepIndex + 1) / STATUS_STEPS.length) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                This order has been cancelled and catalog inventory restored.
              </div>
            )}

            {/* Tracking Info if Shipped */}
            {orderData.tracking_number && (
              <div className="p-3.5 rounded-2xl bg-brand-ivory-50 border border-brand-gold-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-brand-emerald-950 font-bold">
                  <Truck className="w-4 h-4 text-brand-gold-600" />
                  <span>Dispatched via {orderData.shipping_provider || 'Courier'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 font-mono">
                  <span className="text-stone-500">Tracking Number:</span>
                  <span className="font-bold text-stone-900 select-all">{orderData.tracking_number}</span>
                </div>
              </div>
            )}

            {/* Summary Items */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {orderData.items?.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                  <span className="text-stone-800 font-medium">
                    {it.product_name} ({it.product_size}) × {it.quantity}
                  </span>
                  <span className="font-bold text-stone-900">
                    ₹{it.total_price}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
              <span className="text-stone-600 font-medium">Total Amount:</span>
              <span className="font-serif font-bold text-base text-brand-emerald-950">₹{orderData.total_amount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
