import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ShopCollection } from './components/ShopCollection';
import { OurStory } from './components/OurStory';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { FragranceModal } from './components/FragranceModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminDashboard } from './components/AdminDashboard';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { Check } from 'lucide-react';

function AppContent() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const { toastMessage } = useCart();

  // Listen for #admin or #track URL hash changes
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      } else if (window.location.hash === '#track') {
        setIsTrackerOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin') {
      history.pushState(null, '', window.location.pathname);
    }
  };

  const handleCloseTracker = () => {
    setIsTrackerOpen(false);
    if (window.location.hash === '#track') {
      history.pushState(null, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-ivory-100 font-sans selection:bg-brand-gold-400 selection:text-brand-emerald-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-brand-emerald-950 text-white shadow-2xl border border-brand-gold-400/50 animate-bounce transition-all"
        >
          <div className="p-1 rounded-full bg-brand-gold-400 text-brand-emerald-950">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold text-brand-ivory-100">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      {/* Hero Section with Six-Bottle Showcase */}
      <main id="main-content" className="flex-1">
        <Hero onSelectProduct={setSelectedProduct} />

        {/* Complete Shop Section */}
        <ShopCollection onSelectProduct={setSelectedProduct} />

        {/* Our Story & Founder Tribute */}
        <OurStory />

        {/* Contact Concierge Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      {/* Fragrance Detail Modal */}
      {selectedProduct && (
        <FragranceModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Shopping Bag Drawer */}
      <CartDrawer />

      {/* Customer Checkout Modal */}
      <CheckoutModal />

      {/* Customer Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={handleCloseTracker}
      />

      {/* Private Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard onClose={handleCloseAdmin} />
      )}
    </div>
  );
}

export function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
