import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, LogOut, Search, Filter, RefreshCw, Package, ShoppingBag, 
  TrendingUp, AlertTriangle, CheckCircle, Truck, Clock, Eye, 
  Check, X, ChevronRight, Edit3, ArrowLeft, Shield, Sliders, Save,
  Phone, Mail, MapPin, Calendar, CreditCard, ChevronDown, Sparkles,
  KeyRound, ShieldCheck, Terminal, User, Database
} from 'lucide-react';
import { LotusIcon } from './LotusIcon';

const STATUS_COLORS = {
  New: 'bg-sky-950/80 text-sky-200 border-sky-500/40',
  Confirmed: 'bg-purple-950/80 text-purple-200 border-purple-500/40',
  Packed: 'bg-amber-950/80 text-amber-200 border-amber-500/40',
  Shipped: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/40',
  Delivered: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40',
  Cancelled: 'bg-rose-950/80 text-rose-200 border-rose-500/40'
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
  failed: 'bg-red-900/40 text-red-300 border-red-500/30',
  refunded: 'bg-stone-800 text-stone-300 border-stone-600'
};

export function AdminDashboard({ onClose }) {
  const [token, setToken] = useState(() => localStorage.getItem('mangaalam_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);

  // Owner account setup & auth recovery state
  const [hasOwnerAccount, setHasOwnerAccount] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot' | 'resetWithToken'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [authFeedback, setAuthFeedback] = useState(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // In-dashboard password change state
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard views
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'settings'

  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Orders filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Selected Order for Modal/Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [paymentDraft, setPaymentDraft] = useState('');
  const [carrierDraft, setCarrierDraft] = useState('');
  const [trackingDraft, setTrackingDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  // Stock edit states
  const [stockEdits, setStockEdits] = useState({});
  const [isSavingStock, setIsSavingStock] = useState({});

  // Database connectivity & Supabase status
  const [dbHealth, setDbHealth] = useState(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  // 1. Verify token on mount or login
  const verifySession = useCallback(async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUser(data.admin);
        return true;
      } else {
        localStorage.removeItem('mangaalam_admin_token');
        setToken('');
        setAdminUser(null);
        return false;
      }
    } catch {
      localStorage.removeItem('mangaalam_admin_token');
      setToken('');
      setAdminUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifySession(token);
    }
  }, [token, verifySession]);

  const checkOwnerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      if (data.success) {
        setHasOwnerAccount(data.hasOwner);
      }
    } catch {
      setHasOwnerAccount(true);
    }
  }, []);

  useEffect(() => {
    checkOwnerStatus();
  }, [checkOwnerStatus]);

  // 2. Fetch stats, orders, products, and live database health
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Orders
      let ordersUrl = `/api/admin/orders?limit=100`;
      if (searchQuery.trim()) ordersUrl += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (statusFilter !== 'all') ordersUrl += `&order_status=${statusFilter}`;
      if (paymentFilter !== 'all') ordersUrl += `&payment_status=${paymentFilter}`;

      const ordersRes = await fetch(ordersUrl, { headers });
      const ordersData = await ordersRes.json();
      if (ordersData.success) setOrders(ordersData.orders);

      // Products
      const prodRes = await fetch('/api/admin/products', { headers });
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.products);

      // Database Connectivity Status
      try {
        const dbRes = await fetch('/api/admin/db-status', { headers });
        const dbData = await dbRes.json();
        if (dbData.success) setDbHealth(dbData);
      } catch (dbErr) {
        console.warn('DB status probe failed:', dbErr);
      }

    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [token, searchQuery, statusFilter, paymentFilter]);

  const handleTestDbConnection = async () => {
    if (!token) return;
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/admin/db-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDbHealth(data);
        setActionFeedback(data.supabase?.connected
          ? `Connected to Supabase PostgreSQL (${data.supabase.latencyMs}ms latency)!`
          : `Connected to Local SQLite fallback. ${data.supabase?.message || 'Supabase credentials pending.'}`);
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err) {
      alert(`Database probe error: ${err.message}`);
    } finally {
      setIsTestingDb(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchDashboardData();
    }
  }, [adminUser, fetchDashboardData]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      localStorage.setItem('mangaalam_admin_token', data.token);
      setToken(data.token);
      setAdminUser(data.admin);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mangaalam_admin_token');
    setToken('');
    setAdminUser(null);
  };

  // Request Reset Token Flow
  const handleRequestResetToken = async (e) => {
    e.preventDefault();
    setAuthFeedback(null);
    setIsSubmittingReset(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      setAuthFeedback({
        type: 'success',
        message: data.message || 'Reset authorization recorded. Check server console or run "npm run admin:reset".'
      });
    } catch (err) {
      setAuthFeedback({ type: 'error', message: err.message || 'Failed to request reset token.' });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Complete Reset with Token Flow
  const handleResetPasswordWithToken = async (e) => {
    e.preventDefault();
    setAuthFeedback(null);
    if (resetNewPassword !== resetConfirmPassword) {
      setAuthFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (resetNewPassword.length < 8) {
      setAuthFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    setIsSubmittingReset(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken.trim(),
          newPassword: resetNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setAuthFeedback({
        type: 'success',
        message: 'Password reset successfully! Please log in with your new password.'
      });
      setAuthView('login');
      setLoginPassword('');
    } catch (err) {
      setAuthFeedback({ type: 'error', message: err.message || 'Failed to reset password.' });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Authenticated Owner Changes Password from Settings tab
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdFeedback(null);
    if (pwdNew !== pwdConfirm) {
      setPwdFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (pwdNew.length < 8) {
      setPwdFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    setIsUpdatingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: pwdCurrent,
          newPassword: pwdNew
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }
      localStorage.setItem('mangaalam_admin_token', data.token);
      setToken(data.token);
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
      setPwdFeedback({
        type: 'success',
        message: 'Owner password updated successfully! All other sessions have been securely invalidated.'
      });
      verifySession(data.token);
    } catch (err) {
      setPwdFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  // Open Order Detail Drawer
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setStatusDraft(order.order_status);
    setPaymentDraft(order.payment_status);
    setCarrierDraft(order.shipping_provider || '');
    setTrackingDraft(order.tracking_number || '');
    setNoteDraft('');
  };

  // Save Order Updates
  const handleSaveOrderUpdates = async () => {
    if (!selectedOrder) return;
    setIsUpdatingOrder(true);
    setActionFeedback(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      // 1. Update status if changed
      if (statusDraft !== selectedOrder.order_status) {
        const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: statusDraft,
            note: noteDraft,
            shipping_provider: carrierDraft || null,
            tracking_number: trackingDraft || null
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update order status');
      }

      // 2. Update payment status if changed
      if (paymentDraft !== selectedOrder.payment_status) {
        const res = await fetch(`/api/admin/orders/${selectedOrder.id}/payment`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            payment_status: paymentDraft,
            note: noteDraft
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update payment status');
      }

      // 3. Update tracking if carrier or tracking entered
      if (carrierDraft && trackingDraft && (carrierDraft !== selectedOrder.shipping_provider || trackingDraft !== selectedOrder.tracking_number)) {
        const res = await fetch(`/api/admin/orders/${selectedOrder.id}/tracking`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            shipping_provider: carrierDraft,
            tracking_number: trackingDraft
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update tracking');
      }

      setActionFeedback('Order details updated successfully.');
      setTimeout(() => setActionFeedback(null), 3000);
      setSelectedOrder(null);
      fetchDashboardData();
    } catch (err) {
      alert(`Error updating order: ${err.message}`);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Handle Stock Updates
  const handleStockSave = async (productId) => {
    const newStock = stockEdits[productId];
    if (newStock === undefined) return;

    setIsSavingStock(prev => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock: Number(newStock) })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update stock');

      // Clear edit state for this product
      setStockEdits(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });

      fetchDashboardData();
    } catch (err) {
      alert(`Stock update failed: ${err.message}`);
    } finally {
      setIsSavingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  // =========================================================================
  // VIEW: OWNER AUTHENTICATION GATE (If not authenticated)
  // =========================================================================
  if (!adminUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-emerald-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-brand-emerald-900/90 rounded-3xl p-6 sm:p-8 border border-brand-gold-500/40 shadow-2xl text-brand-ivory-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-brand-gold-300 hover:text-white hover:bg-brand-emerald-800 transition-colors"
            aria-label="Back to Storefront"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <LotusIcon className="w-10 h-10 text-brand-gold-400 mx-auto mb-2" />
            <h2 className="font-serif text-2xl font-bold text-brand-gold-200">
              MANGAALAM
            </h2>
            <span className="text-[11px] font-mono tracking-widest text-brand-gold-300/80 uppercase">
              Private Boutique Administration
            </span>
          </div>

          {/* Feedback alerts */}
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          {authFeedback && (
            <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${
              authFeedback.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200' 
                : 'bg-red-950/90 border-red-500/60 text-red-200'
            }`}>
              {authFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{authFeedback.message}</span>
            </div>
          )}

          {/* State 1: Owner account not yet initialized */}
          {hasOwnerAccount === false ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Private Owner Account Required</span>
                </div>
                <p className="leading-relaxed text-stone-300">
                  For your business security, no public accounts or default passwords exist. Please initialize your private owner account via your server terminal:
                </p>
                <div className="mt-2 p-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 font-mono text-xs text-brand-gold-300 flex items-center justify-between">
                  <span>npm run admin:create</span>
                  <Terminal className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </div>

              <button
                type="button"
                onClick={checkOwnerStatus}
                className="w-full py-3 px-4 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-brand-gold-300 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Account Status</span>
              </button>
            </div>
          ) : authView === 'forgot' ? (
            /* State 2: Request Password Reset */
            <form onSubmit={handleRequestResetToken} className="space-y-4">
              <div className="text-left space-y-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-brand-gold-400" />
                  <span>Reset Owner Password</span>
                </h3>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Enter your owner email address. An authorization will be recorded to generate a one-time reset token.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gold-200 mb-1">
                  Owner Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="owner@mangaalam.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-xs text-white placeholder-brand-ivory-400/40 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-[11px] text-stone-400">
                💡 <strong className="text-stone-300">Terminal Recovery:</strong> You can also run <code className="text-brand-gold-300 font-mono">npm run admin:reset</code> in your server console at any time for direct recovery.
              </div>

              <button
                type="submit"
                disabled={isSubmittingReset}
                className="w-full py-3 px-4 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-emerald-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSubmittingReset ? 'Recording Authorization...' : 'Generate Reset Authorization'}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('resetWithToken');
                    setAuthFeedback(null);
                  }}
                  className="text-brand-gold-300 hover:underline"
                >
                  Have a reset token? Enter here →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setAuthFeedback(null);
                  }}
                  className="text-stone-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : authView === 'resetWithToken' ? (
            /* State 3: Complete Reset with Token */
            <form onSubmit={handleResetPasswordWithToken} className="space-y-4">
              <div className="text-left space-y-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-brand-gold-400" />
                  <span>Set New Owner Password</span>
                </h3>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Enter the 64-character reset token from your server console and your new password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gold-200 mb-1">
                  Reset Authorization Token
                </label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste 64-character token"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-xs text-white font-mono placeholder-brand-ivory-400/40 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gold-200 mb-1">
                  New Secure Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-xs text-white placeholder-brand-ivory-400/40 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gold-200 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-xs text-white placeholder-brand-ivory-400/40 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReset}
                className="w-full py-3 px-4 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-emerald-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSubmittingReset ? 'Resetting Password...' : 'Save New Password & Sign In'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setAuthFeedback(null);
                  }}
                  className="text-xs text-stone-400 hover:text-white"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* State 4: Standard Private Owner Login */
            <form id="admin-login-form" onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-gold-200 mb-1">
                  Business Owner Email / Username
                </label>
                <input
                  id="admin-login-email"
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="owner@mangaalam.com"
                  required
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-xs text-white placeholder-brand-ivory-400/40 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-brand-gold-200">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setAuthFeedback(null);
                      setForgotEmail(loginEmail);
                    }}
                    className="text-[11px] text-brand-gold-300/80 hover:text-brand-gold-200 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="admin-login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-xs text-white placeholder-brand-ivory-400/40 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <button
                id="admin-login-btn"
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-gold-500 via-brand-gold-400 to-brand-gold-500 text-brand-emerald-950 font-bold text-xs uppercase tracking-wider shadow-gold-soft hover:shadow-gold-glow transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-emerald-950" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Access Boutique Desk</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/95 backdrop-blur-md flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-brand-emerald-950 border-b border-brand-gold-500/30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <LotusIcon className="w-7 h-7 text-brand-gold-400" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base sm:text-lg font-bold tracking-wider text-brand-gold-200">
                MANGAALAM
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-brand-emerald-800 border border-brand-gold-500/30 text-[10px] text-brand-gold-300 font-mono uppercase">
                Admin Desk
              </span>
              {dbHealth && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 border ${
                  dbHealth.supabase?.connected
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-stone-800 border-stone-700 text-stone-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    dbHealth.supabase?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span>{dbHealth.supabase?.connected ? 'Supabase' : 'SQLite DB'}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-brand-ivory-300 font-mono hidden sm:block">
              Authenticated as {adminUser.name} ({adminUser.email})
            </p>
          </div>
        </div>

        {/* Tab Pills & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex rounded-xl bg-brand-emerald-900/80 p-1 border border-brand-gold-500/25">
            <button
              id="tab-btn-orders"
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-brand-gold-400 text-brand-emerald-950 shadow-sm'
                  : 'text-brand-ivory-200 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orders</span>
            </button>

            <button
              id="tab-btn-inventory"
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'inventory'
                  ? 'bg-brand-gold-400 text-brand-emerald-950 shadow-sm'
                  : 'text-brand-ivory-200 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inventory</span>
              {stats?.lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              )}
            </button>

            <button
              id="tab-btn-config"
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-brand-gold-400 text-brand-emerald-950 shadow-sm'
                  : 'text-brand-ivory-200 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Config</span>
            </button>
          </nav>

          <button
            type="button"
            onClick={fetchDashboardData}
            title="Refresh data"
            className="p-2 rounded-xl bg-brand-emerald-900 text-brand-gold-300 hover:text-white hover:bg-brand-emerald-850 border border-brand-gold-500/25 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-xl bg-brand-emerald-900 text-rose-300 hover:text-rose-100 hover:bg-rose-950 border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1 border border-stone-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Return to Store</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Metrics Summary */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-brand-emerald-950/80 border border-brand-gold-500/30 text-white shadow-lg">
              <div className="flex items-center justify-between text-brand-gold-300 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider">Total Booked</span>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-serif text-2xl font-bold">{stats.totalOrders}</span>
              <span className="text-[10px] text-brand-ivory-300 block mt-0.5">Orders in system</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-emerald-950/80 border border-brand-gold-500/30 text-white shadow-lg">
              <div className="flex items-center justify-between text-brand-gold-300 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider">Revenue</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="font-serif text-2xl font-bold">₹{stats.totalRevenue}</span>
              <span className="text-[10px] text-brand-ivory-300 block mt-0.5">Excludes cancelled</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-emerald-950/80 border border-brand-gold-500/30 text-white shadow-lg">
              <div className="flex items-center justify-between text-sky-300 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider">Action Needed</span>
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-serif text-2xl font-bold text-sky-200">{stats.newOrders}</span>
              <span className="text-[10px] text-sky-300/80 block mt-0.5">New orders to dispatch</span>
            </div>

            <div className={`p-4 rounded-2xl border shadow-lg ${
              stats.lowStockCount > 0 
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-200' 
                : 'bg-brand-emerald-950/80 border-brand-gold-500/30 text-white'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider">Low Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-serif text-2xl font-bold">{stats.lowStockCount}</span>
              <span className="text-[10px] block mt-0.5">
                {stats.lowStockCount > 0 ? 'Fragrances require restock' : 'All stock levels healthy'}
              </span>
            </div>
          </div>
        )}

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-emerald-900 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ORDERS MANAGEMENT                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID (MNG-...), Customer name, Phone, or Tracking #..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Status:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                >
                  <option value="all">All Orders</option>
                  <option value="New">New</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Orders Table & Cards */}
            {isLoadingData ? (
              <div className="py-20 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400">
                <RefreshCw className="w-8 h-8 mx-auto text-brand-gold-400 animate-spin mb-3" />
                <h3 className="font-serif text-base font-semibold text-white">Loading Orders...</h3>
                <p className="text-xs text-stone-400 mt-1">Retrieving live records from database</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                <h3 className="font-serif text-lg font-semibold text-white">No orders found</h3>
                <p className="text-xs text-stone-400 mt-1">
                  {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Customer orders will appear here as soon as placed.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-mono border-b border-stone-800">
                      <tr>
                        <th className="px-4 py-3">Order ID / Date</th>
                        <th className="px-4 py-3">Customer & Phone</th>
                        <th className="px-4 py-3">Fragrances</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Order Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-brand-gold-300 block select-all">
                              {ord.id}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-white block">
                              {ord.customer_name}
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono">
                              +91 {ord.phone}
                            </span>
                            <span className="text-[10px] text-stone-500 block truncate max-w-[140px]">
                              {ord.city}, {ord.state}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {ord.items?.slice(0, 3).map((it, idx) => (
                                <div key={idx} className="w-7 h-9 rounded bg-stone-800 border border-stone-700 overflow-hidden shrink-0" title={`${it.product_name} (${it.product_size}) x${it.quantity}`}>
                                  <img src={it.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {ord.items?.length > 3 && (
                                <span className="text-[10px] text-stone-400 font-mono">
                                  +{ord.items.length - 3}
                                </span>
                              )}
                              <span className="text-[11px] text-stone-300 font-mono pl-1">
                                ({ord.item_count} items)
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-serif font-bold text-white text-sm">
                            ₹{ord.total_amount}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wide ${PAYMENT_STATUS_COLORS[ord.payment_status] || 'bg-stone-800 text-stone-300'}`}>
                              {ord.payment_status}
                            </span>
                            <span className="text-[9px] text-stone-400 block mt-0.5 uppercase">
                              {ord.payment_method === 'cod' ? 'COD' : 'UPI'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide ${STATUS_COLORS[ord.order_status] || 'bg-stone-800 text-stone-300'}`}>
                              {ord.order_status}
                            </span>
                            {ord.tracking_number && (
                              <span className="text-[10px] text-stone-400 block mt-0.5 font-mono truncate max-w-[120px]" title={`${ord.shipping_provider}: ${ord.tracking_number}`}>
                                {ord.tracking_number}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openOrderDetails(ord)}
                              className="px-3 py-1.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-brand-gold-300 hover:bg-brand-emerald-900 hover:text-white transition-colors text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Manage</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INVENTORY & STOCK MANAGEMENT                                       */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  Fragrance Inventory & Batch Levels
                </h3>
                <p className="text-xs text-stone-400">
                  Authoritative backend inventory for all 11 catalog perfumes. Stock is automatically decremented upon valid checkout.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-brand-gold-300 uppercase block">
                  Catalog Total
                </span>
                <span className="text-xs font-bold text-white">
                  6 × 50 ml · 5 × 20 ml
                </span>
              </div>
            </div>

            {isLoadingData ? (
              <div className="py-20 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400">
                <RefreshCw className="w-8 h-8 mx-auto text-brand-gold-400 animate-spin mb-3" />
                <h3 className="font-serif text-base font-semibold text-white">Loading Inventory...</h3>
                <p className="text-xs text-stone-400 mt-1">Retrieving live product stock from database</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400">
                <Package className="w-10 h-10 mx-auto text-stone-600 mb-2" />
                <h3 className="font-serif text-lg font-semibold text-white">No products found</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => {
                const currentDraft = stockEdits[prod.id] !== undefined ? stockEdits[prod.id] : prod.stock;
                const isModified = stockEdits[prod.id] !== undefined && stockEdits[prod.id] !== prod.stock;
                const isLow = prod.stock <= prod.low_stock_threshold;
                const isOos = prod.stock === 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-2xl bg-stone-900 border transition-all ${
                      isOos
                        ? 'border-red-500/50 bg-red-950/20'
                        : isLow
                        ? 'border-amber-500/50 bg-amber-950/20'
                        : 'border-stone-800 hover:border-brand-gold-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-18 rounded-xl bg-stone-800 border border-stone-700 overflow-hidden shrink-0">
                        <img src={prod.bottle_image} alt={prod.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-800 text-brand-gold-300">
                            {prod.category}
                          </span>
                          <span className="font-serif font-bold text-white text-sm">
                            ₹{prod.price}
                          </span>
                        </div>

                        <h4 className="font-serif text-sm font-bold text-white truncate mt-1">
                          {prod.name}
                        </h4>
                        <span className="text-[11px] text-stone-400 block truncate">
                          {prod.type}
                        </span>

                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOos
                              ? 'bg-rose-950 text-rose-300 border border-rose-600'
                              : isLow
                              ? 'bg-amber-950 text-amber-300 border border-amber-600'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          }`}>
                            {isOos ? 'Out of Stock' : isLow ? `Low Stock (${prod.stock})` : `In Stock: ${prod.stock}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Adjustment Controls */}
                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStockEdits(prev => ({ ...prev, [prod.id]: Math.max(0, currentDraft - 1) }))}
                          className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={currentDraft}
                          onChange={(e) => setStockEdits(prev => ({ ...prev, [prod.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-14 px-2 py-1 text-center font-mono text-xs rounded-lg bg-stone-950 border border-stone-700 text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-400"
                        />
                        <button
                          type="button"
                          onClick={() => setStockEdits(prev => ({ ...prev, [prod.id]: currentDraft + 1 }))}
                          className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockEdits(prev => ({ ...prev, [prod.id]: currentDraft + 5 }))}
                          className="px-1.5 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono"
                        >
                          +5
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStockSave(prod.id)}
                        disabled={!isModified || isSavingStock[prod.id]}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                          isModified
                            ? 'bg-brand-gold-400 text-brand-emerald-950 hover:bg-brand-gold-300 shadow-md font-bold'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingStock[prod.id] ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFIGURATION, PERSISTENT DATABASE & PAYMENT GATEWAY SETUP        */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            {/* Database & Supabase PostgreSQL Status Card */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-brand-gold-500/40 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-2.5 text-brand-gold-300">
                  <Database className="w-5 h-5 text-brand-gold-400" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      Persistent External Database (Supabase PostgreSQL)
                    </h3>
                    <p className="text-xs text-stone-400">
                      Authoritative cloud database for catalog, orders, atomic inventory, and Row Level Security.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestDbConnection}
                  disabled={isTestingDb}
                  className="px-3 py-1.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/30 text-brand-gold-300 hover:text-white hover:bg-brand-emerald-900 transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  title="Probe database connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Probing...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Live Connectivity Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block">
                    Active Storage Engine
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${
                      dbHealth?.supabase?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <span className="font-bold text-white">
                      {dbHealth?.supabase?.connected ? 'Supabase PostgreSQL' : 'Local SQLite Fallback'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block">
                    Cloud Connection
                  </span>
                  <span className={`font-semibold block mt-0.5 ${
                    dbHealth?.supabase?.connected ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {dbHealth?.supabase?.connected 
                      ? `Active (${dbHealth.supabase.latencyMs}ms)`
                      : dbHealth?.supabase?.status === 'pending_configuration'
                      ? 'Credentials Pending in .env'
                      : 'Not Connected'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block">
                    Catalog & Orders
                  </span>
                  <span className="text-white font-mono block mt-0.5">
                    {dbHealth?.catalogSize || products.length} Fragrances · {dbHealth?.totalOrders || orders.length} Orders
                  </span>
                </div>
              </div>

              {/* Integration Status Notice */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 leading-relaxed ${
                dbHealth?.supabase?.connected
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {dbHealth?.supabase?.connected ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Supabase PostgreSQL Is Live & Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Ready for Supabase PostgreSQL Credentials</span>
                    </>
                  )}
                </div>
                <p className="text-stone-300 text-[11px]">
                  {dbHealth?.supabase?.connected
                    ? 'All customer checkouts, stock decrements, and admin operations are executing directly against your cloud PostgreSQL database with Row Level Security.'
                    : 'The application backend is operating safely on its local SQLite store with exact paise calculations and atomic stock deduction. To connect your Supabase project, follow the setup steps below.'}
                </p>
              </div>

              {/* Setup Instructions Box */}
              {!dbHealth?.supabase?.connected && (
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-semibold text-brand-gold-200 uppercase tracking-wider">
                    Simple Supabase Setup Steps
                  </h4>
                  <ol className="text-xs text-stone-300 space-y-2.5 list-decimal pl-4">
                    <li>
                      <strong>Create a Project:</strong> Sign in at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-gold-300 underline">supabase.com</a> and create a new project.
                    </li>
                    <li>
                      <strong>Run Migration Script:</strong> Open <em>SQL Editor</em> in your Supabase Dashboard, copy and paste the contents of <code className="text-brand-gold-300 font-mono">supabase/schema.sql</code>, then click <em>Run</em>.
                    </li>
                    <li>
                      <strong>Add Keys to .env:</strong> From Supabase <em>Project Settings → API</em>, add your URL and Service Role Key to <code className="text-brand-gold-300 font-mono">.env</code>:
                      <pre className="mt-1.5 p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300">
{`SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
                      </pre>
                    </li>
                    <li>
                      <strong>Sync Existing Data:</strong> Run <code className="text-brand-gold-300 font-mono bg-stone-950 px-1.5 py-0.5 rounded">npm run db:sync</code> in your server terminal to migrate existing orders and stock without data loss.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Owner Account Profile & Password Security */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-brand-gold-500/40 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-2.5 text-brand-gold-300">
                  <ShieldCheck className="w-5 h-5 text-brand-gold-400" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      Private Owner Security & Credentials
                    </h3>
                    <p className="text-xs text-stone-400">
                      Manage your business owner authentication and change dashboard password.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-semibold">
                  Verified Owner
                </span>
              </div>

              {/* Owner Profile Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block">Owner Name</span>
                  <span className="font-semibold text-white">{adminUser?.name || 'Business Owner'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block">Owner Email</span>
                  <span className="font-mono text-stone-300 truncate block">{adminUser?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block">Role Status</span>
                  <span className="text-brand-gold-300 font-semibold uppercase text-[11px]">Primary Business Owner</span>
                </div>
              </div>

              {/* Password Change Feedback */}
              {pwdFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  pwdFeedback.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/90 border-red-500/50 text-red-200'
                }`}>
                  {pwdFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{pwdFeedback.message}</span>
                </div>
              )}

              {/* In-Dashboard Password Change Form */}
              <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Current Password
                    </label>
                    <input
                      id="owner-current-pwd"
                      type="password"
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      New Password (min 8 chars)
                    </label>
                    <input
                      id="owner-new-pwd"
                      type="password"
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      id="owner-confirm-pwd"
                      type="password"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <button
                    id="owner-update-pwd-btn"
                    type="submit"
                    disabled={isUpdatingPwd}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold-500 via-brand-gold-400 to-brand-gold-500 text-brand-emerald-950 font-bold text-xs uppercase tracking-wider shadow-gold-soft hover:shadow-gold-glow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isUpdatingPwd ? 'Updating Password...' : 'Update Owner Password'}</span>
                  </button>

                  <span className="text-[11px] text-stone-400">
                    Changing password automatically invalidates all other active sessions.
                  </span>
                </div>
              </form>

              {/* CLI Recovery Reference */}
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Emergency Terminal Reset Command:</span>
                <code className="text-brand-gold-300 font-mono bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                  npm run admin:reset
                </code>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center gap-2.5 text-brand-gold-300">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Payment Channels & Gateway Architecture
                </h3>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                MANGAALAM operates with dual payment confirmation: Doorstep Cash on Delivery (COD) and Direct Boutique UPI. 
                Payment secrets and trusted verification logic are kept exclusively in the server environment.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Customers pay upon physical courier delivery. Status defaults to pending until delivery verified.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold">
                    Active
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      Direct Boutique UPI (mangaalam@upi)
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Instant transfer via Google Pay, PhonePe, Paytm, or BHIM. Verified manually by the boutique desk.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-bold">
                    Active
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      Online Gateway Adapter (Razorpay / Stripe)
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Modular backend payment service ready. Configure API credentials in <code className="text-brand-gold-300">.env</code> to activate.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-stone-800 text-stone-400 border border-stone-700 text-xs font-mono">
                    Standby (Set in .env)
                  </span>
                </div>
              </div>
            </div>

            {/* Environment Setup Checklist */}
            <div className="p-6 rounded-2xl bg-brand-emerald-950/60 border border-brand-gold-500/30 text-brand-ivory-100 space-y-3">
              <div className="flex items-center gap-2 text-brand-gold-300">
                <Shield className="w-5 h-5" />
                <h4 className="font-serif text-base font-bold text-white">
                  Security & Integration Template
                </h4>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                To connect a live online payment provider like Razorpay, add your merchant credentials to the server environment without touching frontend code:
              </p>
              <pre className="p-3.5 rounded-xl bg-brand-emerald-950 border border-brand-gold-500/20 text-[11px] font-mono text-brand-gold-200 overflow-x-auto">
{`# In .env:
PAYMENT_GATEWAY_PROVIDER=razorpay
PAYMENT_GATEWAY_KEY_ID=rzp_live_your_key_id
PAYMENT_GATEWAY_KEY_SECRET=your_backend_secret_key
PAYMENT_GATEWAY_WEBHOOK_SECRET=your_webhook_secret`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ORDER DETAILS & DISPATCH MODAL                                           */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-brand-gold-500/40 rounded-3xl p-6 sm:p-8 text-stone-100 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <LotusIcon className="w-6 h-6 text-brand-gold-400" />
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Order {selectedOrder.id}</span>
                </h3>
                <span className="text-[11px] text-stone-400 font-mono">
                  Booked on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-4 rounded-2xl bg-stone-950 border border-stone-800 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block mb-1">
                  Customer Contact
                </span>
                <span className="font-bold text-white block text-sm">
                  {selectedOrder.customer_name}
                </span>
                <a href={`tel:${selectedOrder.phone}`} className="text-brand-gold-300 font-mono flex items-center gap-1 mt-0.5 hover:underline">
                  <Phone className="w-3 h-3" />
                  +91 {selectedOrder.phone}
                </a>
                {selectedOrder.email && (
                  <span className="text-stone-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {selectedOrder.email}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono block mb-1">
                  Delivery Address
                </span>
                <p className="text-stone-300 leading-snug">
                  {selectedOrder.address_line1}
                  {selectedOrder.address_line2 ? `, ${selectedOrder.address_line2}` : ''}
                  <br />
                  {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                </p>
                {selectedOrder.order_notes && (
                  <p className="mt-1.5 p-1.5 rounded bg-stone-900 border border-stone-800 text-[11px] text-amber-300/90 italic">
                    Note: "{selectedOrder.order_notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-400 block">
                Order Items ({selectedOrder.items?.length || 0})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-10 rounded bg-stone-900 overflow-hidden shrink-0">
                        <img src={it.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-serif font-bold text-white block">
                          {it.product_name}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {it.product_size} · ₹{it.unit_price} × {it.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-white">
                      ₹{it.total_price}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-2 rounded-xl bg-stone-950 flex items-center justify-between text-xs font-bold text-white">
                <span>Total Amount Payable:</span>
                <span className="text-brand-gold-300 font-serif text-base">₹{selectedOrder.total_amount}</span>
              </div>
            </div>

            {/* Management Controls */}
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Order Lifecycle Status
                  </label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                  >
                    <option value="New">New</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled (Restores stock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Payment Verification Status
                  </label>
                  <select
                    value={paymentDraft}
                    onChange={(e) => setPaymentDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid (Verified)</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Shipping Provider / Carrier
                  </label>
                  <input
                    type="text"
                    value={carrierDraft}
                    onChange={(e) => setCarrierDraft(e.target.value)}
                    placeholder="e.g. Blue Dart, Delhivery, DTDC"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Consignment Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingDraft}
                    onChange={(e) => setTrackingDraft(e.target.value)}
                    placeholder="e.g. BD849204928IN"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Internal Admin Audit Note <span className="text-stone-500 font-normal">(Appended to audit log)</span>
                  </label>
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="e.g. Verified payment via GPay screenshot; dispatched via express courier"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-gold-400"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-2">
                <button
                  id="admin-save-order-btn"
                  type="button"
                  onClick={handleSaveOrderUpdates}
                  disabled={isUpdatingOrder}
                  className="flex-1 py-3 rounded-xl bg-brand-gold-400 text-brand-emerald-950 font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdatingOrder ? 'Saving Updates...' : 'Save Order Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
